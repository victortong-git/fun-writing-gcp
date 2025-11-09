const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate user JWT tokens
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Prevent admin tokens from being used as user tokens
    if (user.role === 'admin' || user.isAdmin) {
      return res.status(403).json({ error: 'Cannot use admin token for user endpoints' });
    }

    req.user = user;
    next();
  });
};

/**
 * Optional authentication - allows requests without token but extracts user if present
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (!err && user.role !== 'admin' && !user.isAdmin) {
        req.user = user;
      }
    });
  }

  next();
};

/**
 * Middleware to authenticate admin JWT tokens
 */
const authenticateAdminToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Admin access token required' });
  }

  jwt.verify(token, process.env.ADMIN_JWT_SECRET, (err, admin) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired admin token' });
    }

    if (!admin.isAdmin) {
      return res.status(403).json({ error: 'Admin privileges required' });
    }

    req.admin = admin;
    next();
  });
};

/**
 * Role-based authorization
 */
const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

/**
 * Generate JWT token for user
 */
const generateUserToken = (userId, email, role = 'student') => {
  return jwt.sign(
    { userId, email, role, isAdmin: false },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Generate JWT token for admin
 */
const generateAdminToken = (adminId, email) => {
  return jwt.sign(
    { adminId, email, isAdmin: true },
    process.env.ADMIN_JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Trial enforcement middleware
 */
const trialMiddleware = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { User } = require('../models');
  const user = await User.findByPk(req.user.userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const trialEndDate = new Date(user.trialEndDate);
  const isTrialActive = trialEndDate > new Date();

  // Check if user has credits
  if (user.aiCredits <= 0 && !isTrialActive) {
    return res.status(402).json({
      error: 'Insufficient credits',
      creditsRequired: req.body.creditsNeeded || 0,
      creditsAvailable: user.aiCredits,
    });
  }

  req.userAccount = user;
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  authenticateAdminToken,
  authorizeRole,
  generateUserToken,
  generateAdminToken,
  trialMiddleware,
};
