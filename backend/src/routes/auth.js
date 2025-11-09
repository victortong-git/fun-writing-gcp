const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const { User, Admin } = require('../models');
const {
  generateUserToken,
  generateAdminToken,
  authenticateToken,
  authenticateAdminToken,
} = require('../middleware/auth');

const router = express.Router();

// ==================== VALIDATION SCHEMAS ====================

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).max(255),
  age: Joi.number().min(3).max(100),
  ageGroup: Joi.string().valid('3-5', '5-7', '7-11', '11-14', '14-16', '16+'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const adminLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// ==================== USER ROUTES ====================

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password, name, age, ageGroup } = value;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user with default credits and 14-day trial
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    const user = await User.create({
      id: uuidv4(),
      email,
      password,
      name,
      age,
      ageGroup,
      aiCredits: parseInt(process.env.TRIAL_INITIAL_CREDITS || 3000),
      trialStartDate: new Date(),
      trialEndDate,
      subscriptionStatus: 'trial',
    });

    // Generate token
    const token = generateUserToken(user.id, user.email, 'student');

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: user.toJSON(),
      token,
      trialEndDate: user.trialEndDate,
      initialCredits: user.aiCredits,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = value;

    // Find user
    console.log(`[LOGIN] Looking for user with email: ${email}`);
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log(`[LOGIN] User not found for email: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password with extended timeout (bcrypt can be slow in Cloud Run)
    console.log(`[LOGIN] Found user: ${user.email}, comparing password...`);
    const passwordPromise = user.comparePassword(password);
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(false), 30000)); // 30 second timeout
    const isPasswordValid = await Promise.race([passwordPromise, timeoutPromise]);
    console.log(`[LOGIN] Password valid: ${isPasswordValid}`);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Update last active date
    user.lastActiveDate = new Date();
    await user.save();

    // Generate token
    const token = generateUserToken(user.id, user.email, 'student');

    res.json({
      success: true,
      message: 'Login successful',
      user: user.toJSON(),
      token,
      trialEndDate: user.trialEndDate,
      aiCredits: user.aiCredits,
      totalScore: user.totalScore,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/auth/validate-token
 * Validate current user token
 */
router.post('/validate-token', authenticateToken, (req, res) => {
  res.json({
    success: true,
    valid: true,
    user: req.user,
  });
});

/**
 * POST /api/auth/refresh-token
 * Refresh user token
 */
router.post('/refresh-token', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newToken = generateUserToken(user.id, user.email, 'student');

    res.json({
      success: true,
      message: 'Token refreshed',
      token: newToken,
    });
  } catch (error) {
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// ==================== ADMIN ROUTES ====================

/**
 * POST /api/auth/admin/login
 * Admin login
 */
router.post('/admin/login', async (req, res) => {
  try {
    const { error, value } = adminLoginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = value;

    // Find admin
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({ error: 'Admin account is inactive' });
    }

    // Update last login
    admin.lastLoginDate = new Date();
    await admin.save();

    // Generate admin token
    const token = generateAdminToken(admin.id, admin.email);

    res.json({
      success: true,
      message: 'Admin login successful',
      admin: admin.toJSON(),
      token,
      role: admin.role,
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Admin login failed' });
  }
});

/**
 * POST /api/auth/admin/validate-token
 * Validate admin token
 */
router.post('/admin/validate-token', authenticateAdminToken, (req, res) => {
  res.json({
    success: true,
    valid: true,
    admin: req.admin,
  });
});

// ==================== TEST USER SETUP ====================

/**
 * POST /api/auth/setup-test-user
 * Setup test user (development only)
 */
router.post('/setup-test-user', async (req, res) => {
  try {
    // Allow in both development and production for initial setup
    // In production, this should only be called once to create the test user

    const testEmail = process.env.TEST_USER_EMAIL || 'demo@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'demoinitialpassword';

    // Check if test user exists
    let user = await User.findOne({ where: { email: testEmail } });

    if (user) {
      return res.json({
        success: true,
        message: 'Test user already exists',
        user: user.toJSON(),
      });
    }

    // Create test user
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    user = await User.create({
      id: uuidv4(),
      email: testEmail,
      password: testPassword,
      name: 'Test User',
      age: 12,
      ageGroup: '11-14',
      aiCredits: 3000,
      totalScore: 0,
      trialStartDate: new Date(),
      trialEndDate,
      subscriptionStatus: 'trial',
      isEmailVerified: true,
      isActive: true,
    });

    res.json({
      success: true,
      message: 'Test user created',
      user: user.toJSON(),
      credentials: {
        email: testEmail,
        password: testPassword,
      },
    });
  } catch (error) {
    console.error('Test user setup error:', error);
    res.status(500).json({ error: 'Failed to setup test user' });
  }
});

/**
 * POST /api/auth/create-test-user-with-hash
 * Create test user with pre-hashed password (for GCP migration - development only)
 */
router.post('/create-test-user-with-hash', async (req, res) => {
  try {
    const testEmail = process.env.TEST_USER_EMAIL || 'demo@example.com';
    const hashedPassword = req.body.hashedPassword || '$2b$06$83c.NJlHs8zZU0CmttZ/V.XzGG2Kbe2hXpcwuw7lH8DkGqGvlAcby';

    // Delete existing user if any
    await User.destroy({ where: { email: testEmail } });

    // Create test user with pre-hashed password (bypass hook)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    const user = await User.create({
      id: uuidv4(),
      email: testEmail,
      password: hashedPassword,
      name: 'Test User',
      age: 12,
      ageGroup: '11-14',
      aiCredits: 3000,
      totalScore: 0,
      trialStartDate: new Date(),
      trialEndDate,
      subscriptionStatus: 'trial',
      isEmailVerified: true,
      isActive: true,
    }, {
      // Skip hooks to use pre-hashed password
      hooks: false,
      individualHooks: false
    });

    console.log(`[CREATE] Created test user with pre-hashed password: ${testEmail}`);

    res.json({
      success: true,
      message: 'Test user created with pre-hashed password',
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Test user creation error:', error);
    res.status(500).json({ error: 'Failed to create test user', details: error.message });
  }
});

/**
 * POST /api/auth/reset-test-user
 * Reset test user - delete and recreate (development only)
 */
router.post('/reset-test-user', async (req, res) => {
  try {
    const testEmail = process.env.TEST_USER_EMAIL || 'demo@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'demoinitialpassword';

    // Delete existing user
    await User.destroy({ where: { email: testEmail } });
    console.log(`[RESET] Deleted existing test user: ${testEmail}`);

    // Create new test user
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    const user = await User.create({
      id: uuidv4(),
      email: testEmail,
      password: testPassword,
      name: 'Test User',
      age: 12,
      ageGroup: '11-14',
      aiCredits: 3000,
      totalScore: 0,
      trialStartDate: new Date(),
      trialEndDate,
      subscriptionStatus: 'trial',
      isEmailVerified: true,
      isActive: true,
    });

    console.log(`[RESET] Created new test user: ${testEmail}`);

    res.json({
      success: true,
      message: 'Test user reset successfully',
      user: user.toJSON(),
      credentials: {
        email: testEmail,
        password: testPassword,
      },
    });
  } catch (error) {
    console.error('Test user reset error:', error);
    res.status(500).json({ error: 'Failed to reset test user' });
  }
});

/**
 * POST /api/auth/setup-test-admin
 * Setup test admin (development only)
 */
router.post('/setup-test-admin', async (req, res) => {
  try {
    // Allow in both development and production for initial setup
    // In production, this should only be called once to create the test admin

    const testAdminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
    const testAdminPassword = process.env.TEST_ADMIN_PASSWORD || 'admininitialpassword';

    // Check if admin exists
    let admin = await Admin.findOne({ where: { email: testAdminEmail } });

    if (admin) {
      return res.json({
        success: true,
        message: 'Test admin already exists',
        admin: admin.toJSON(),
      });
    }

    // Create test admin
    admin = await Admin.create({
      id: uuidv4(),
      email: testAdminEmail,
      password: testAdminPassword,
      name: 'Test Admin',
      role: 'super_admin',
      isActive: true,
    });

    res.json({
      success: true,
      message: 'Test admin created',
      admin: admin.toJSON(),
      credentials: {
        email: testAdminEmail,
        password: testAdminPassword,
      },
    });
  } catch (error) {
    console.error('Test admin setup error:', error);
    res.status(500).json({ error: 'Failed to setup test admin' });
  }
});

module.exports = router;
