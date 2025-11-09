const express = require('express');
const multer = require('multer');
const { User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { uploadProfilePicture, deleteProfilePicture } = require('../services/storageService');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed'));
    }
  },
});

/**
 * GET /api/user/profile
 * Get current user profile
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: user.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * PUT /api/user/profile
 * Update user profile
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, age, ageGroup, avatar } = req.body;
    const user = await User.findByPk(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update email if provided (no validation for testing)
    if (email && email !== user.email) {
      user.email = email;
    }

    if (name) user.name = name;
    if (age) user.age = age;
    if (ageGroup) user.ageGroup = ageGroup;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated',
      user: user.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * GET /api/user/credits
 * Get current credit balance
 */
router.get('/credits', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    const trialActive = user.isTrialActive();

    res.json({
      success: true,
      aiCredits: user.aiCredits,
      totalScore: user.totalScore,
      level: user.level,
      trialActive,
      trialEndDate: user.trialEndDate,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch credits' });
  }
});

/**
 * POST /api/user/profile-picture
 * Upload profile picture
 */
router.post('/profile-picture', authenticateToken, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete old profile picture if it exists
    if (user.profilePictureUrl) {
      await deleteProfilePicture(user.profilePictureUrl);
    }

    // Upload new profile picture
    const profilePictureUrl = await uploadProfilePicture(
      req.file.buffer,
      req.file.mimetype,
      user.id
    );

    // Update user profile
    user.profilePictureUrl = profilePictureUrl;
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      profilePictureUrl,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload profile picture' });
  }
});

/**
 * DELETE /api/user/profile-picture
 * Delete profile picture
 */
router.delete('/profile-picture', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete profile picture from GCS
    if (user.profilePictureUrl) {
      await deleteProfilePicture(user.profilePictureUrl);
      user.profilePictureUrl = null;
      await user.save();
    }

    res.json({
      success: true,
      message: 'Profile picture deleted successfully',
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Profile picture delete error:', error);
    res.status(500).json({ error: 'Failed to delete profile picture' });
  }
});

module.exports = router;
