const express = require('express');
const Joi = require('joi');
const { User, Admin, WritingSubmission, WritingPrompt } = require('../models');
const { authenticateAdminToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// ==================== USER MANAGEMENT ====================

/**
 * GET /api/admin/users
 * Get all users with pagination and filtering
 */
router.get('/users', authenticateAdminToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const subscriptionStatus = req.query.subscriptionStatus;

    // Build where clause
    const where = {};
    if (search) {
      where[require('sequelize').Op.or] = [
        { email: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { name: { [require('sequelize').Op.iLike]: `%${search}%` } },
      ];
    }
    if (subscriptionStatus) {
      where.subscriptionStatus = subscriptionStatus;
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: {
        exclude: ['password', 'emailVerificationToken'],
      },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      success: true,
      data: {
        users: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
          hasMore: page < Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * GET /api/admin/users/:userId
 * Get specific user details
 */
router.get('/users/:userId', authenticateAdminToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId, {
      attributes: {
        exclude: ['password', 'emailVerificationToken'],
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user stats
    const submissionCount = await WritingSubmission.count({
      where: { userId: req.params.userId },
    });

    res.json({
      success: true,
      user: {
        ...user.toJSON(),
        stats: {
          totalSubmissions: submissionCount,
          totalScore: user.totalScore,
          aiCredits: user.aiCredits,
          level: user.level,
          streak: user.streak,
        },
      },
    });
  } catch (error) {
    console.error('User detail error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * POST /api/admin/users
 * Create new user (admin only)
 */
router.post('/users', authenticateAdminToken, async (req, res) => {
  try {
    const schema = Joi.object({
      name: Joi.string().min(2).max(255),
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      age: Joi.number().min(3).max(100),
      ageGroup: Joi.string().valid('3-5', '5-7', '7-11', '11-14', '14-16', '16+'),
      aiCredits: Joi.number().integer().min(0).default(3000),
      subscriptionStatus: Joi.string().valid('trial', 'active', 'inactive', 'cancelled').default('trial'),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if email exists
    const existing = await User.findOne({ where: { email: value.email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    const user = await User.create({
      id: uuidv4(),
      ...value,
      trialStartDate: new Date(),
      trialEndDate,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * PUT /api/admin/users/:userId
 * Update user details (excluding credits)
 *
 * Note: AI Credits are managed separately via PATCH /users/:userId/credits
 * to prevent race conditions and ensure proper credit transaction handling
 */
router.put('/users/:userId', authenticateAdminToken, async (req, res) => {
  try {
    const schema = Joi.object({
      name: Joi.string().min(2).max(255),
      email: Joi.string().email(),
      age: Joi.number().min(3).max(100),
      ageGroup: Joi.string().valid('3-5', '5-7', '7-11', '11-14', '14-16', '16+'),
      subscriptionStatus: Joi.string().valid('trial', 'active', 'inactive', 'cancelled'),
      isActive: Joi.boolean(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = await User.findByPk(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check email uniqueness if changed
    if (value.email && value.email !== user.email) {
      const existing = await User.findOne({ where: { email: value.email } });
      if (existing) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // Update fields
    Object.assign(user, value);
    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * PATCH /api/admin/users/:userId/credits
 * Update user AI credits (quick action)
 */
router.patch('/users/:userId/credits', authenticateAdminToken, async (req, res) => {
  try {
    const schema = Joi.object({
      aiCredits: Joi.number().integer().min(0).required(),
      action: Joi.string().valid('set', 'add', 'subtract').default('set'),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = await User.findByPk(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate new credit amount
    let newCredits = value.aiCredits;
    if (value.action === 'add') {
      newCredits = user.aiCredits + value.aiCredits;
    } else if (value.action === 'subtract') {
      newCredits = Math.max(0, user.aiCredits - value.aiCredits);
    }

    user.aiCredits = newCredits;
    await user.save();

    res.json({
      success: true,
      message: 'Credits updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        aiCredits: user.aiCredits,
      },
    });
  } catch (error) {
    console.error('Credits update error:', error);
    res.status(500).json({ error: 'Failed to update credits' });
  }
});

/**
 * DELETE /api/admin/users/:userId
 * Delete user account
 */
router.delete('/users/:userId', authenticateAdminToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete related data
    await WritingSubmission.destroy({ where: { userId: req.params.userId } });

    // Delete user
    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ==================== STATISTICS ====================

/**
 * GET /api/admin/stats
 * Get platform statistics
 */
router.get('/stats', authenticateAdminToken, async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalSubmissions = await WritingSubmission.count();
    const totalPrompts = await WritingPrompt.count();
    const activeUsers = await User.count({
      where: {
        isActive: true,
      },
    });
    const trialUsers = await User.count({
      where: {
        subscriptionStatus: 'trial',
      },
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        trialUsers,
        totalSubmissions,
        totalPrompts,
        avgSubmissionsPerUser: totalUsers > 0 ? (totalSubmissions / totalUsers).toFixed(2) : 0,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// ==================== PROMPTS MANAGEMENT ====================

/**
 * GET /api/admin/prompts
 * Get all writing prompts
 */
router.get('/prompts', authenticateAdminToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { count, rows } = await WritingPrompt.findAndCountAll({
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      attributes: {
        exclude: ['prompt'],
      },
    });

    res.json({
      success: true,
      data: {
        prompts: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error('Prompts fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch prompts' });
  }
});

/**
 * POST /api/admin/prompts
 * Create new writing prompt
 */
router.post('/prompts', authenticateAdminToken, async (req, res) => {
  try {
    const schema = Joi.object({
      title: Joi.string().max(255).required(),
      description: Joi.string(),
      prompt: Joi.string().required(),
      instructions: Joi.array().items(Joi.string()),
      theme: Joi.string().required(),
      ageGroup: Joi.string().valid('3-5', '5-7', '7-11', '11-14', '14-16', '16+').required(),
      difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
      wordCountMin: Joi.number().integer().min(0),
      wordCountMax: Joi.number().integer().min(0),
      wordCountTarget: Joi.number().integer().min(0),
      timeLimit: Joi.number().integer().min(0),
      category: Joi.string().valid('practice', 'quiz', 'assessment').default('practice'),
      maxAttempts: Joi.number().integer().min(1).default(3),
      passingScore: Joi.number().integer().min(0).max(100).default(70),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const prompt = await WritingPrompt.create({
      id: uuidv4(),
      ...value,
      createdBy: req.admin.adminId,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Prompt created successfully',
      prompt,
    });
  } catch (error) {
    console.error('Prompt creation error:', error);
    res.status(500).json({ error: 'Failed to create prompt' });
  }
});

/**
 * DELETE /api/admin/prompts/:promptId
 * Deactivate a prompt
 */
router.delete('/prompts/:promptId', authenticateAdminToken, async (req, res) => {
  try {
    const prompt = await WritingPrompt.findByPk(req.params.promptId);
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    prompt.isActive = false;
    await prompt.save();

    res.json({
      success: true,
      message: 'Prompt deactivated',
    });
  } catch (error) {
    console.error('Prompt deletion error:', error);
    res.status(500).json({ error: 'Failed to deactivate prompt' });
  }
});

module.exports = router;
