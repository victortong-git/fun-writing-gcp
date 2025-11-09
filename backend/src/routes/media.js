const express = require('express');
const axios = require('axios');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const { WritingSubmission, User, GeneratedMedia } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const AI_AGENTS_URL = process.env.AI_AGENTS_URL || 'https://fun-writing-ai-agents-yaildcgk6q-uc.a.run.app';

/**
 * POST /api/media/generate-single-image
 * Generate 1 AI image for a submission (requires score >= 51 and 100 credits)
 * Supports different image styles: 'standard', 'comic', 'manga', 'princess'
 */
router.post('/generate-single-image', authenticateToken, async (req, res) => {
  try {
    // Validate input
    const schema = Joi.object({
      submissionId: Joi.string().uuid().required(),
      imageStyle: Joi.string().valid('standard', 'comic', 'manga', 'princess').optional().default('standard'),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { submissionId, imageStyle } = value;

    // Get user and check credits
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get submission and verify ownership
    const submission = await WritingSubmission.findOne({
      where: {
        id: submissionId,
        userId: req.user.userId,
      },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Check if submission has been reviewed and scored
    if (submission.status !== 'reviewed' || !submission.score) {
      return res.status(400).json({
        error: 'Submission must be reviewed first',
        status: submission.status,
        score: submission.score
      });
    }

    // Check if score is high enough (>= 51)
    if (submission.score < 51) {
      return res.status(403).json({
        error: 'Score too low for image generation',
        message: 'You need a score of 51 or higher to generate images',
        currentScore: submission.score,
        requiredScore: 51
      });
    }

    // Check if user has enough credits (100 for 1 image)
    const requiredCredits = 100;
    if (user.aiCredits < requiredCredits) {
      return res.status(403).json({
        error: 'Insufficient credits',
        message: 'You need 100 credits to generate an image',
        currentCredits: user.aiCredits,
        requiredCredits: requiredCredits
      });
    }

    // Count existing images to determine next imageIndex
    const existingImageCount = await GeneratedMedia.count({
      where: {
        submissionId: submissionId,
        mediaType: 'image',
      },
    });

    const imageIndex = existingImageCount + 1;

    // Deduct credits first
    await user.update({
      aiCredits: user.aiCredits - requiredCredits,
    });

    console.log(`💳 Deducted ${requiredCredits} credits from user ${user.id}. Remaining: ${user.aiCredits - requiredCredits}`);

    try {
      console.log(`🎨 Generating AI ${imageStyle} style image #${imageIndex} for submission ${submissionId}`);

      // Call AI agents Cloud Run job via HTTP
      const axios = require('axios');
      const AI_AGENTS_URL = process.env.AI_AGENTS_URL || 'https://fun-writing-ai-agents-yaildcgk6q-uc.a.run.app';

      const response = await axios.post(
        `${AI_AGENTS_URL}/generate-image`,
        {
          submissionId: submissionId,
          userId: req.user.userId,
          studentWriting: submission.content,
          ageGroup: user.ageGroup || '11-14',
          imageIndex: imageIndex,
          imageStyle: imageStyle
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 120000 // 120 second timeout for image generation
        }
      );

      if (response.data.success) {
        console.log(`✅ ${imageStyle} style image #${imageIndex} generated successfully`);

        // Create the image record in database
        const imageRecord = await GeneratedMedia.create({
          id: uuidv4(),
          submissionId: submissionId,
          userId: req.user.userId,
          mediaType: 'image',
          imageUrl: response.data.imageUrl,
          imagePrompt: response.data.prompt || `AI-generated ${imageStyle} style image`,
          generationStatus: 'completed',
          creditsUsed: requiredCredits,
        });

        console.log(`📊 Database record created for image ${imageRecord.id}`);

        // Refresh user to get updated credits
        await user.reload();

        return res.status(201).json({
          success: true,
          message: `Successfully generated AI ${imageStyle} style image`,
          creditsUsed: requiredCredits,
          remainingCredits: user.aiCredits,
          image: {
            id: imageRecord.id,
            imageUrl: response.data.imageUrl,
            description: `AI-generated ${imageStyle} style image based on your story`,
            imageIndex: imageIndex,
            imageStyle: imageStyle
          },
          submission: {
            id: submission.id,
            score: submission.score,
          },
        });
      } else {
        // Refund credits if generation fails
        await user.update({
          aiCredits: user.aiCredits + requiredCredits,
        });
        console.error(`❌ Image generation failed:`, response.data.error);
        return res.status(500).json({ error: response.data.error || 'Failed to generate image' });
      }

    } catch (generationError) {
      // Refund credits if generation fails
      await user.update({
        aiCredits: user.aiCredits + requiredCredits,
      });

      console.error('Image generation failed, credits refunded:', generationError);

      // Check if it's a 503 error (services initializing)
      if (generationError.response?.status === 503) {
        return res.status(503).json({
          error: 'AI service is starting up. Please wait a moment and try again.',
          retryable: true
        });
      }

      return res.status(500).json({
        error: generationError.response?.data?.error || 'Failed to generate image',
        details: generationError.message
      });
    }

  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

/**
 * POST /api/media/generate-images
 * DEPRECATED: Use /api/media/generate-single-image instead
 * Generate 2 AI images for a submission (requires score >= 51 and 200 credits)
 */
/* COMMENTED OUT - Use single image generation instead
router.post('/generate-images', authenticateToken, async (req, res) => {
  try {
    // Validate input
    const schema = Joi.object({
      submissionId: Joi.string().uuid().required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { submissionId } = value;

    // Get user and check credits
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get submission and verify ownership
    const submission = await WritingSubmission.findOne({
      where: {
        id: submissionId,
        userId: req.user.userId,
      },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Check if submission has been reviewed and scored
    if (submission.status !== 'reviewed' || !submission.score) {
      return res.status(400).json({ 
        error: 'Submission must be reviewed first',
        status: submission.status,
        score: submission.score 
      });
    }

    // Check if score is high enough (>= 51)
    if (submission.score < 51) {
      return res.status(403).json({ 
        error: 'Score too low for image generation',
        message: 'You need a score of 51 or higher to generate images',
        currentScore: submission.score,
        requiredScore: 51
      });
    }

    // Check if user has enough credits (200 for 2 images)
    const requiredCredits = 200;
    if (user.aiCredits < requiredCredits) {
      return res.status(403).json({
        error: 'Insufficient credits',
        message: 'You need 200 credits to generate images',
        currentCredits: user.aiCredits,
        requiredCredits: requiredCredits
      });
    }

    // Check if images already generated for this submission
    const existingImages = await GeneratedMedia.findAll({
      where: {
        submissionId: submissionId,
        mediaType: 'image',
      },
    });

    if (existingImages.length > 0) {
      return res.status(400).json({ 
        error: 'Images already generated for this submission',
        images: existingImages.map(img => ({
          id: img.id,
          imageUrl: img.imageUrl || img.gcsUrl,
        }))
      });
    }

    // Deduct credits first
    await user.update({
      aiCredits: user.aiCredits - requiredCredits,
    });

    console.log(`💳 Deducted ${requiredCredits} credits from user ${user.id}. Remaining: ${user.aiCredits - requiredCredits}`);

    try {
      console.log(`🎨 Generating AI images for submission ${submissionId}`);

      // Generate 2 images sequentially using AI agents Cloud Run job
      const generatedImages = [];
      const AI_AGENTS_URL = process.env.AI_AGENTS_URL || 'https://fun-writing-ai-agents-yaildcgk6q-uc.a.run.app';

      for (let i = 1; i <= 2; i++) {
        try {
          console.log(`   Generating image ${i}/2...`);

          // Call Cloud Run job via HTTP
          const axios = require('axios');

          const response = await axios.post(
            `${AI_AGENTS_URL}/generate-image`,
            {
              submissionId: submissionId,
              userId: req.user.userId,
              studentWriting: submission.content,
              ageGroup: user.ageGroup || '11-14',
              imageIndex: i
            },
            {
              headers: {
                'Content-Type': 'application/json'
              },
              timeout: 120000 // 120 second timeout for image generation
            }
          );

          if (response.data.success) {
            generatedImages.push({
              id: response.data.mediaId,
              imageUrl: response.data.imageUrl,
              description: `AI-generated image based on your story`,
            });
            console.log(`   ✅ Image ${i}/3 generated successfully`);
          } else {
            console.error(`   ❌ Image ${i}/3 generation failed:`, response.data.error);
          }

        } catch (imageError) {
          console.error(`   ❌ Error generating image ${i}/3:`, imageError.message);
          // Continue to next image even if one fails
        }
      }

      console.log(`✅ Generated ${generatedImages.length} themed images for submission ${submissionId}`);
      console.log(`📊 Database records created for submission-media relationship`);

      // Refresh user to get updated credits
      await user.reload();

      res.status(201).json({
        success: true,
        message: `Successfully generated ${generatedImages.length} themed images`,
        creditsUsed: requiredCredits,
        remainingCredits: user.aiCredits,
        images: generatedImages,
        submission: {
          id: submission.id,
          score: submission.score,
        },
      });

    } catch (generationError) {
      // Refund credits if generation fails
      await user.update({
        aiCredits: user.aiCredits + requiredCredits,
      });
      
      console.error('Image generation failed, credits refunded:', generationError);
      throw generationError;
    }

  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: 'Failed to generate images' });
  }
});
*/

/**
 * POST /api/media/regenerate-images
 * DEPRECATED: Students can now delete individual images and generate new ones
 * Regenerate 2 AI images for a submission (replaces existing images, requires score >= 51 and 200 credits)
 */
/* COMMENTED OUT - Use delete + single image generation instead
router.post('/regenerate-images', authenticateToken, async (req, res) => {
  try {
    // Validate input
    const schema = Joi.object({
      submissionId: Joi.string().uuid().required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { submissionId } = value;

    // Get user and check credits
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get submission and verify ownership
    const submission = await WritingSubmission.findOne({
      where: {
        id: submissionId,
        userId: req.user.userId,
      },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Check if submission has been reviewed and scored
    if (submission.status !== 'reviewed' || !submission.score) {
      return res.status(400).json({ 
        error: 'Submission must be reviewed first',
        status: submission.status,
        score: submission.score 
      });
    }

    // Check if score is high enough (>= 51)
    if (submission.score < 51) {
      return res.status(403).json({ 
        error: 'Score too low for image generation',
        message: 'You need a score of 51 or higher to generate images',
        currentScore: submission.score,
        requiredScore: 51
      });
    }

    // Check if user has enough credits (200 for 2 images)
    const requiredCredits = 200;
    if (user.aiCredits < requiredCredits) {
      return res.status(403).json({
        error: 'Insufficient credits',
        message: 'You need 200 credits to regenerate images',
        currentCredits: user.aiCredits,
        requiredCredits: requiredCredits
      });
    }

    // Delete existing images for this submission
    await GeneratedMedia.destroy({
      where: {
        submissionId: submissionId,
        mediaType: 'image',
      },
    });

    // Deduct credits first
    await user.update({
      aiCredits: user.aiCredits - requiredCredits,
    });

    console.log(`💳 Deducted ${requiredCredits} credits from user ${user.id} for regeneration. Remaining: ${user.aiCredits - requiredCredits}`);

    try {
      console.log(`🎨 Regenerating AI images for submission ${submissionId}`);

      // Generate 2 images sequentially using AI agents Cloud Run job
      const generatedImages = [];
      const AI_AGENTS_URL = process.env.AI_AGENTS_URL || 'https://fun-writing-ai-agents-yaildcgk6q-uc.a.run.app';

      for (let i = 1; i <= 2; i++) {
        try {
          console.log(`   Regenerating image ${i}/2...`);

          // Call Cloud Run job via HTTP
          const axios = require('axios');

          const response = await axios.post(
            `${AI_AGENTS_URL}/generate-image`,
            {
              submissionId: submissionId,
              userId: req.user.userId,
              studentWriting: submission.content,
              ageGroup: user.ageGroup || '11-14',
              imageIndex: i
            },
            {
              headers: {
                'Content-Type': 'application/json'
              },
              timeout: 120000 // 120 second timeout for image generation
            }
          );

          if (response.data.success) {
            generatedImages.push({
              id: response.data.mediaId,
              imageUrl: response.data.imageUrl,
              description: `AI-generated image based on your story`
            });
            console.log(`   ✅ Image ${i}/2 generated successfully`);
          } else {
            console.error(`   ❌ Image ${i}/2 generation failed:`, response.data.error);
          }

        } catch (imageError) {
          console.error(`   ❌ Error generating image ${i}/2:`, imageError.message);
          // Continue to next image even if one fails
        }
      }

      console.log(`✅ Regenerated ${generatedImages.length}/2 AI images for submission ${submissionId}`);

      // Refresh user to get updated credits
      await user.reload();

      res.status(201).json({
        success: true,
        message: `Successfully regenerated ${generatedImages.length} AI images`,
        creditsUsed: requiredCredits,
        remainingCredits: user.aiCredits,
        images: generatedImages,
        submission: {
          id: submission.id,
          score: submission.score,
        },
      });

    } catch (generationError) {
      // Refund credits if generation fails
      await user.update({
        aiCredits: user.aiCredits + requiredCredits,
      });
      
      console.error('Image regeneration failed, credits refunded:', generationError);
      throw generationError;
    }

  } catch (error) {
    console.error('Image regeneration error:', error);
    res.status(500).json({ error: 'Failed to regenerate images' });
  }
});
*/

/**
 * POST /api/media/generate-video
 * Generate 1 AI video from text only (requires 500 credits)
 * Uses text-to-video mode with style options: 'animation' or 'cinematic'
 */
router.post('/generate-video', authenticateToken, async (req, res) => {
  try {
    // Validate input
    const schema = Joi.object({
      submissionId: Joi.string().uuid().required(),
      mode: Joi.string().valid('text-to-video').optional(),
      videoStyle: Joi.string().valid('animation', 'cinematic').optional().default('animation'),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { submissionId, videoStyle } = value;

    console.log(`🎬 Video generation request - Mode: text-to-video, Style: ${videoStyle}`);

    // Get user and check credits
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get submission and verify ownership
    const submission = await WritingSubmission.findOne({
      where: {
        id: submissionId,
        userId: req.user.userId,
      },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Check if user has enough credits (500 for video)
    const requiredCredits = 500;
    if (user.aiCredits < requiredCredits) {
      return res.status(403).json({ 
        error: 'Insufficient credits',
        message: 'You need 500 credits to generate a video',
        currentCredits: user.aiCredits,
        requiredCredits: requiredCredits
      });
    }

    // Check if video already generated for this submission
    const existingVideo = await GeneratedMedia.findOne({
      where: {
        submissionId: submissionId,
        mediaType: 'video',
      },
    });

    if (existingVideo) {
      return res.status(400).json({ 
        error: 'Video already generated for this submission',
        video: {
          id: existingVideo.id,
          videoUrl: existingVideo.videoUrl || existingVideo.gcsUrl,
        }
      });
    }

    // Deduct credits first
    await user.update({
      aiCredits: user.aiCredits - requiredCredits,
    });

    console.log(`💳 Deducted ${requiredCredits} credits from user ${user.id}. Remaining: ${user.aiCredits - requiredCredits}`);

    try {
      console.log(`🎬 Generating ${videoStyle} style video for submission ${submissionId} - Mode: text-to-video`);

      // Build request payload for text-to-video with style
      const requestPayload = {
        submissionId,
        userId: req.user.userId,
        studentWriting: submission.content,
        ageGroup: user.ageGroup || '11-14',
        videoStyle: videoStyle
      };

      // Call AI agents service to generate video with Veo 3.1
      const agentResponse = await axios.post(
        `${AI_AGENTS_URL}/generate-video`,
        requestPayload,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 600000 // 10 minutes for video generation + polling
        }
      );

      if (!agentResponse.data.success) {
        throw new Error(agentResponse.data.error || 'Video generation failed');
      }

      const { videoUrl, description, duration, prompt } = agentResponse.data;

      // Create the video record in database
      const videoRecord = await GeneratedMedia.create({
        id: uuidv4(),
        submissionId: submissionId,
        userId: req.user.userId,
        mediaType: 'video',
        videoUrl: videoUrl,
        videoPrompt: prompt || `AI-generated ${videoStyle} style video based on submission`,
        generationStatus: 'completed',
        creditsUsed: requiredCredits,
      });

      const generatedVideo = {
        id: videoRecord.id,
        videoUrl: videoUrl,
        description: description || `AI-generated ${videoStyle} style video based on your story`,
        duration: duration || 8,
        videoStyle: videoStyle,
      };

      console.log(`✅ Generated ${videoStyle} style video for submission ${submissionId}`);

      res.status(201).json({
        success: true,
        message: `Successfully generated ${videoStyle} style video`,
        creditsUsed: requiredCredits,
        remainingCredits: user.aiCredits - requiredCredits,
        video: generatedVideo,
        submission: {
          id: submission.id,
          score: submission.score,
        },
      });

    } catch (generationError) {
      // Refund credits if generation fails
      await user.update({
        aiCredits: user.aiCredits + requiredCredits,
      });
      
      console.error('Video generation failed, credits refunded:', generationError);
      throw generationError;
    }

  } catch (error) {
    console.error('Video generation error:', error);
    res.status(500).json({ error: 'Failed to generate video' });
  }
});

/**
 * GET /api/media/submission/:submissionId
 * Get all media (images and videos) for a submission
 */
router.get('/submission/:submissionId', authenticateToken, async (req, res) => {
  try {
    const { submissionId } = req.params;

    // Verify submission ownership
    const submission = await WritingSubmission.findOne({
      where: {
        id: submissionId,
        userId: req.user.userId,
      },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Get all media for this submission
    const media = await GeneratedMedia.findAll({
      where: { submissionId: submissionId },
      order: [['createdAt', 'ASC']],
    });

    const images = media.filter(m => m.mediaType === 'image');
    const videos = media.filter(m => m.mediaType === 'video');

    res.json({
      success: true,
      submission: {
        id: submission.id,
        score: submission.score,
        status: submission.status,
      },
      media: {
        images: images.map(img => ({
          id: img.id,
          imageUrl: img.imageUrl,
          description: `AI-generated image based on your story`,
          createdAt: img.createdAt,
        })),
        videos: videos.map(vid => ({
          id: vid.id,
          videoUrl: vid.videoUrl,
          description: `AI-generated video based on your selected image`,
          duration: 6,
          sourceImageId: vid.selectedImageUrl,
          createdAt: vid.createdAt,
        })),
      },
    });

  } catch (error) {
    console.error('Media fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

/**
 * DELETE /api/media/image/:imageId
 * Delete a specific generated image (with ownership verification)
 */
router.delete('/image/:imageId', authenticateToken, async (req, res) => {
  try {
    const { imageId } = req.params;

    // Validate imageId is UUID
    const schema = Joi.string().uuid().required();
    const { error } = schema.validate(imageId);
    if (error) {
      return res.status(400).json({ error: 'Invalid image ID' });
    }

    // Find the image
    const image = await GeneratedMedia.findOne({
      where: {
        id: imageId,
        mediaType: 'image',
      },
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Verify ownership
    if (image.userId !== req.user.userId) {
      return res.status(403).json({ error: 'You do not have permission to delete this image' });
    }

    // Delete the image record (do NOT delete from GCS - keep for audit)
    await image.destroy();

    console.log(`🗑️  Deleted image ${imageId} for user ${req.user.userId}`);

    res.json({
      success: true,
      message: 'Image deleted successfully',
      imageId: imageId,
    });

  } catch (error) {
    console.error('Image deletion error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

/**
 * GET /api/media/gallery
 * Get all user's generated images with submission details for gallery view
 */
router.get('/gallery', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get all user's images with associated submission data
    const { rows: images, count } = await GeneratedMedia.findAndCountAll({
      where: {
        userId: req.user.userId,
        mediaType: 'image',
      },
      include: [
        {
          model: WritingSubmission,
          attributes: ['id', 'promptTitle', 'promptType', 'content', 'theme', 'createdAt'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const galleryItems = images.map(img => ({
      id: img.id,
      imageUrl: img.imageUrl,
      topic: img.WritingSubmission?.promptTitle || 'Unknown Topic',
      writingType: img.WritingSubmission?.promptType || 'creative',
      theme: img.WritingSubmission?.theme || null,
      studentWriting: img.WritingSubmission?.content || '',
      submissionId: img.submissionId,
      createdAt: img.createdAt,
    }));

    res.json({
      success: true,
      gallery: galleryItems,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });

  } catch (error) {
    console.error('Gallery fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch gallery' });
  }
});

/**
 * GET /api/media/video-gallery
 * Get all user's generated videos with submission details for video gallery view
 */
router.get('/video-gallery', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get all user's videos with associated submission data
    const { rows: videos, count } = await GeneratedMedia.findAndCountAll({
      where: {
        userId: req.user.userId,
        mediaType: 'video',
      },
      include: [
        {
          model: WritingSubmission,
          attributes: ['id', 'promptTitle', 'promptType', 'content', 'theme', 'createdAt'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const galleryItems = videos.map(vid => ({
      id: vid.id,
      videoUrl: vid.videoUrl,
      topic: vid.WritingSubmission?.promptTitle || 'Unknown Topic',
      writingType: vid.WritingSubmission?.promptType || 'creative',
      theme: vid.WritingSubmission?.theme || null,
      studentWriting: vid.WritingSubmission?.content || '',
      submissionId: vid.submissionId,
      createdAt: vid.createdAt,
      duration: 8, // Default video duration
    }));

    res.json({
      success: true,
      gallery: galleryItems,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });

  } catch (error) {
    console.error('Video gallery fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch video gallery' });
  }
});

module.exports = router;