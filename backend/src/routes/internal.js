/**
 * Internal API Routes
 * Service-to-service endpoints for AI agents and internal services
 * Protected by INTERNAL_API_KEY authentication
 */

const express = require('express');
const router = express.Router();
const { authenticateInternalService } = require('../middleware/internalAuth');
const { GeneratedMedia, User, WritingSubmission } = require('../models');

/**
 * POST /api/internal/media/save-generated-image
 * Called by AI agents after generating and uploading an image to GCS
 * Creates a GeneratedMedia record to track the image
 */
router.post('/media/save-generated-image', authenticateInternalService, async (req, res) => {
  try {
    const {
      submissionId,
      userId,
      imageUrl,
      imagePrompt,
      creditsUsed
    } = req.body;

    // Validate required fields
    if (!submissionId || !userId || !imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['submissionId', 'userId', 'imageUrl']
      });
    }

    // Verify submission exists
    const submission = await WritingSubmission.findByPk(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Writing submission not found',
        submissionId
      });
    }

    // Verify user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        userId
      });
    }

    // Create GeneratedMedia record
    const mediaRecord = await GeneratedMedia.create({
      submissionId,
      userId,
      mediaType: 'image',
      imageUrl,
      imagePrompt: imagePrompt || 'AI-generated illustration',
      generationStatus: 'completed',
      creditsUsed: creditsUsed || 100
    });

    console.log('✅ Image record saved by AI agent:', {
      mediaId: mediaRecord.id,
      submissionId,
      userId,
      imageUrl
    });

    return res.json({
      success: true,
      mediaId: mediaRecord.id,
      imageUrl: mediaRecord.imageUrl,
      message: 'Image record saved successfully'
    });

  } catch (error) {
    console.error('Error saving generated image record:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save image record',
      message: error.message
    });
  }
});

/**
 * POST /api/internal/media/save-generated-video
 * Called by AI agents after generating and uploading a video to GCS
 * Creates a GeneratedMedia record to track the video
 */
router.post('/media/save-generated-video', authenticateInternalService, async (req, res) => {
  try {
    const {
      submissionId,
      userId,
      videoUrl,
      videoPrompt,
      sourceImageUrl,
      creditsUsed
    } = req.body;

    // Validate required fields
    if (!submissionId || !userId || !videoUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['submissionId', 'userId', 'videoUrl']
      });
    }

    // Verify submission exists
    const submission = await WritingSubmission.findByPk(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Writing submission not found',
        submissionId
      });
    }

    // Verify user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        userId
      });
    }

    // Create GeneratedMedia record
    const mediaRecord = await GeneratedMedia.create({
      submissionId,
      userId,
      mediaType: 'video',
      videoUrl,
      videoPrompt: videoPrompt || 'AI-generated video animation',
      sourceImageUrl: sourceImageUrl || null,
      generationStatus: 'completed',
      creditsUsed: creditsUsed || 500
    });

    console.log('✅ Video record saved by AI agent:', {
      mediaId: mediaRecord.id,
      submissionId,
      userId,
      videoUrl
    });

    return res.json({
      success: true,
      mediaId: mediaRecord.id,
      videoUrl: mediaRecord.videoUrl,
      message: 'Video record saved successfully'
    });

  } catch (error) {
    console.error('Error saving generated video record:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save video record',
      message: error.message
    });
  }
});

/**
 * POST /api/internal/media/update-generation-status
 * Update the status of a media generation task
 */
router.post('/media/update-generation-status', authenticateInternalService, async (req, res) => {
  try {
    const { mediaId, status, error } = req.body;

    if (!mediaId || !status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['mediaId', 'status']
      });
    }

    const mediaRecord = await GeneratedMedia.findByPk(mediaId);
    if (!mediaRecord) {
      return res.status(404).json({
        success: false,
        error: 'Media record not found',
        mediaId
      });
    }

    await mediaRecord.update({
      generationStatus: status,
      generationError: error || null
    });

    return res.json({
      success: true,
      message: 'Status updated successfully'
    });

  } catch (error) {
    console.error('Error updating generation status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update status',
      message: error.message
    });
  }
});

module.exports = router;
