const express = require('express');
const Joi = require('joi');
const sequelize = require('sequelize');
const { WritingPrompt, WritingSubmission, User, GeneratedMedia } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const safetyAgent = require('../services/safetyAgent');

const router = express.Router();

// ==================== THEMES ====================

// ==================== WRITING TYPES ====================

/**
 * GET /api/writing/types
 * Get available writing types from database
 */
router.get('/types', async (req, res) => {
  try {
    // Get distinct types from database where prompts are active
    const types = await WritingPrompt.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('type')), 'type']],
      where: { isActive: true },
      raw: true,
      order: [['type', 'ASC']],
    });

    const typeList = types.map((t) => t.type).filter((t) => t);

    // Get count of prompts per type
    const typeCounts = await WritingPrompt.findAll({
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { isActive: true },
      group: ['type'],
      raw: true,
    });

    const countMap = Object.fromEntries(typeCounts.map(tc => [tc.type, parseInt(tc.count)]));

    res.json({
      success: true,
      types: typeList.map(type => ({
        name: type,
        count: countMap[type] || 0,
      })),
      totalTypes: typeList.length,
    });
  } catch (error) {
    console.error('Writing types fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch writing types' });
  }
});

/**
 * GET /api/writing/topics/:ageGroup/:type
 * Get available topics (prompts) for a specific writing type and age group
 */
router.get('/topics/:ageGroup/:type', authenticateToken, async (req, res) => {
  try {
    const { ageGroup, type } = req.params;

    // Validate age group
    const validAgeGroups = ['3-5', '5-7', '7-11', '11-14', '14-16', '16+'];
    if (!validAgeGroups.includes(ageGroup)) {
      return res.status(400).json({ error: 'Invalid age group' });
    }

    const validTypes = ['creative', 'persuasive', 'descriptive', 'narrative', 'informative', 'poems'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid writing type' });
    }

    // Get all prompts for this type and age group
    const topics = await WritingPrompt.findAll({
      where: {
        type,
        ageGroup,
        isActive: true,
      },
      attributes: ['id', 'title', 'theme', 'difficulty'],
      order: [['createdAt', 'DESC']],
      raw: true,
    });

    if (!topics || topics.length === 0) {
      return res.status(404).json({
        error: 'No topics found for this type and age group',
        type,
        ageGroup,
      });
    }

    res.json({
      success: true,
      topics,
      totalTopics: topics.length,
    });
  } catch (error) {
    console.error('Topics fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

// ==================== THEMES ====================

/**
 * GET /api/writing/themes
 * Get available writing themes from database (kept for backward compatibility)
 */
router.get('/themes', async (req, res) => {
  try {
    // Get distinct themes from database where prompts are active and type is creative
    const themes = await WritingPrompt.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('theme')), 'theme']],
      where: { isActive: true, type: 'creative' },
      raw: true,
      order: [['theme', 'ASC']],
    });

    const themeList = themes.map((t) => t.theme).filter((t) => t);

    res.json({
      success: true,
      themes: themeList,
      count: themeList.length,
    });
  } catch (error) {
    console.error('Theme fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch themes' });
  }
});

// ==================== PROMPTS ====================

/**
 * GET /api/writing/prompt/:promptId
 * Get a specific prompt by ID
 */
router.get('/prompt/:promptId', authenticateToken, async (req, res) => {
  try {
    const { promptId } = req.params;

    const prompt = await WritingPrompt.findByPk(promptId);

    if (!prompt) {
      return res.status(404).json({
        error: 'Prompt not found',
        promptId,
      });
    }

    res.json({
      success: true,
      prompt: {
        id: prompt.id,
        title: prompt.title,
        prompt: prompt.prompt,
        description: prompt.description,
        instructions: prompt.instructions,
        type: prompt.type,
        theme: prompt.theme,
        ageGroup: prompt.ageGroup,
        difficulty: prompt.difficulty,
        wordCountTarget: prompt.wordCountTarget,
        wordCountMin: prompt.wordCountMin,
        wordCountMax: prompt.wordCountMax,
        timeLimit: prompt.timeLimit,
        category: prompt.category,
      },
    });
  } catch (error) {
    console.error('Prompt fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch prompt' });
  }
});

/**
 * GET /api/writing/prompts/:ageGroup/:typeOrTheme
 * Get writing prompt based on age and type (or theme for creative prompts)
 * Supports both:
 *   - /prompts/:ageGroup/:type (e.g., /prompts/11-14/persuasive)
 *   - /prompts/:ageGroup/:theme (e.g., /prompts/11-14/Hero%20Quest) for backward compatibility
 */
router.get('/prompts/:ageGroup/:typeOrTheme', authenticateToken, async (req, res) => {
  try {
    const { ageGroup, typeOrTheme } = req.params;

    // Validate age group
    const validAgeGroups = ['3-5', '5-7', '7-11', '11-14', '14-16', '16+'];
    if (!validAgeGroups.includes(ageGroup)) {
      return res.status(400).json({ error: 'Invalid age group' });
    }

    const validTypes = ['creative', 'persuasive', 'descriptive', 'narrative', 'informative', 'poems'];
    const isType = validTypes.includes(typeOrTheme);

    // Build where clause based on whether it's a type or theme
    const whereClause = {
      ageGroup,
      isActive: true,
    };

    if (isType) {
      whereClause.type = typeOrTheme;
    } else {
      // Treat as theme (for backward compatibility with creative writing)
      whereClause.theme = typeOrTheme;
      whereClause.type = 'creative';
    }

    // Find a prompt matching criteria
    const prompt = await WritingPrompt.findOne({
      where: whereClause,
      order: [['createdAt', 'DESC']],
    });

    if (!prompt) {
      return res.status(404).json({
        error: 'No prompts found for this selection',
        ageGroup,
        typeOrTheme,
      });
    }

    res.json({
      success: true,
      prompt: {
        id: prompt.id,
        title: prompt.title,
        prompt: prompt.prompt,
        description: prompt.description,
        instructions: prompt.instructions,
        theme: prompt.theme,
        ageGroup: prompt.ageGroup,
        difficulty: prompt.difficulty,
        wordCountTarget: prompt.wordCountTarget,
        wordCountMin: prompt.wordCountMin,
        wordCountMax: prompt.wordCountMax,
        timeLimit: prompt.timeLimit,
        category: prompt.category,
      },
    });
  } catch (error) {
    console.error('Prompt fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch prompt' });
  }
});

// ==================== SUBMISSIONS ====================

/**
 * POST /api/writing/submit
 * Submit writing for feedback
 * Body: { promptId, content, wordCount, timeSpent }
 */
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    // Validate input
    const schema = Joi.object({
      promptId: Joi.string().uuid().required(),
      content: Joi.string().min(10).max(50000).required(),
      wordCount: Joi.number().integer().min(1),
      timeSpent: Joi.number().integer().min(0),
      noCopyPasteCheck: Joi.boolean(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { promptId, content, wordCount, timeSpent, noCopyPasteCheck } = value;

    // Get user
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get prompt
    const prompt = await WritingPrompt.findByPk(promptId);
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    // Calculate word count
    const actualWordCount = wordCount || content.trim().split(/\s+/).length;

    // Validate word count constraints
    if (prompt.wordCountMin && actualWordCount < prompt.wordCountMin) {
      return res.status(400).json({
        error: `Writing too short. Minimum: ${prompt.wordCountMin} words, Actual: ${actualWordCount}`,
        minWords: prompt.wordCountMin,
        actualWords: actualWordCount,
      });
    }

    if (prompt.wordCountMax && actualWordCount > prompt.wordCountMax) {
      return res.status(400).json({
        error: `Writing too long. Maximum: ${prompt.wordCountMax} words, Actual: ${actualWordCount}`,
        maxWords: prompt.wordCountMax,
        actualWords: actualWordCount,
      });
    }

    // Perform safety checks
    let safetyCheckPassed = true;
    let copyPasteCheckResult = null;

    // Only run copy-paste detection if noCopyPasteCheck is false
    if (!noCopyPasteCheck) {
      try {
        copyPasteCheckResult = await safetyAgent.detectCopyPaste(content, user.ageGroup);

        // If high confidence copy-paste is detected (>70%), reject the submission
        if (copyPasteCheckResult.likelyCopyPasted && copyPasteCheckResult.confidence > 70) {
          console.warn(`[SAFETY] Possible copy-paste detected for user ${req.user.userId}:`, copyPasteCheckResult);
          return res.status(403).json({
            error: 'Possible copy-paste detected',
            message: 'Your writing shows signs of being copy-pasted. Please write in your own words and try again.',
            details: copyPasteCheckResult.reason,
            indicators: copyPasteCheckResult.indicators,
          });
        }
      } catch (error) {
        console.error('[COPY_PASTE_CHECK_ERROR]', error.message);
        // On error, continue - don't block the submission
      }
    }

    // Perform standard content safety check
    try {
      const contentSafetyCheck = await safetyAgent.validateUserSubmission(content, user.ageGroup);
      safetyCheckPassed = contentSafetyCheck.passed;

      if (!safetyCheckPassed) {
        console.warn(`[SAFETY] Content failed safety check for user ${req.user.userId}:`, contentSafetyCheck);
        return res.status(403).json({
          error: 'Content failed safety check',
          message: 'Your writing contains inappropriate content. Please revise and resubmit.',
          reason: contentSafetyCheck.reason,
        });
      }
    } catch (error) {
      console.error('[CONTENT_SAFETY_CHECK_ERROR]', error.message);
      // On error, continue - don't block the submission (fail open for safety)
      safetyCheckPassed = true;
    }

    // Create submission
    const submission = await WritingSubmission.create({
      userId: req.user.userId,
      promptId,
      promptTitle: prompt.title,
      theme: prompt.theme,
      promptType: prompt.type,
      promptDifficulty: prompt.difficulty,
      content,
      wordCount: actualWordCount,
      timeSpent: timeSpent || 0,
      status: 'reviewing',
      ageGroup: user.ageGroup,
      difficulty: prompt.difficulty,
      submissionType: prompt.category,
      safetyCheckPassed: safetyCheckPassed,
      copyPasteCheckPerformed: !noCopyPasteCheck,
      copyPasteCheckResult: copyPasteCheckResult ? JSON.stringify(copyPasteCheckResult) : null,
    });

    // Call AI agents service for real-time analysis
    try {
      const axios = require('axios');
      const AI_AGENTS_URL = process.env.AI_AGENTS_URL || 'https://fun-writing-ai-agents-yaildcgk6q-uc.a.run.app';

      console.log(`📝 Calling AI agents for real-time writing analysis at: ${AI_AGENTS_URL}`);

      const analysisResponse = await axios.post(
        `${AI_AGENTS_URL}/analyze-writing`,
        {
          submissionId: submission.id,
          userId: req.user.userId,
          studentWriting: content,
          originalPrompt: prompt.prompt,
          ageGroup: user.ageGroup || '11-14'
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 90000 // 90 second timeout (AI service uses 60s + overhead)
        }
      );

      if (analysisResponse.data.success) {
        // Update submission with AI analysis results
        await submission.update({
          score: analysisResponse.data.score,
          feedback: analysisResponse.data.feedback,
          status: 'reviewed',
        });

        console.log(`✅ Real-time analysis complete. Score: ${analysisResponse.data.score}/100`);

        const score = analysisResponse.data.score;

        // Update user's total score and level if score is 51 or above
        if (score >= 51) {
          const previousTotalScore = user.totalScore;
          const previousLevel = user.level;

          // Add score to cumulative total
          user.totalScore += score;

          // Update level based on new total score (300 points = 1 level)
          user.updateLevel();

          await user.save();

          console.log(`📊 Score added to total: ${previousTotalScore} → ${user.totalScore}`);
          console.log(`🎯 Level updated: ${previousLevel} → ${user.level}`);
        }

        // Award bonus credits for perfect score (100 points)
        if (score === 100) {
          user.aiCredits += 1000;
          await user.save();
          console.log(`🎉 Perfect score! Awarded 1000 bonus credits to user ${user.id}`);
        }

        return res.status(201).json({
          success: true,
          message: 'Writing submitted and analyzed',
          submission: {
            id: submission.id,
            status: 'reviewed',
            wordCount: submission.wordCount,
            theme: submission.theme,
            promptTitle: submission.promptTitle,
            score: analysisResponse.data.score,
            feedback: analysisResponse.data.feedback,
          },
        });
      } else {
        console.error(`❌ AI analysis failed:`, analysisResponse.data.error);
        // Return submission without analysis
        return res.status(201).json({
          success: true,
          message: 'Writing submitted (analysis pending)',
          submission: {
            id: submission.id,
            status: submission.status,
            wordCount: submission.wordCount,
            theme: submission.theme,
            promptTitle: submission.promptTitle,
          },
          warning: 'Analysis service temporarily unavailable'
        });
      }
    } catch (analysisError) {
      console.error('❌ Real-time analysis error:', analysisError.message);
      // Return submission without analysis - don't fail the submission
      return res.status(201).json({
        success: true,
        message: 'Writing submitted (analysis pending)',
        submission: {
          id: submission.id,
          status: submission.status,
          wordCount: submission.wordCount,
          theme: submission.theme,
          promptTitle: submission.promptTitle,
        },
        warning: 'Analysis service temporarily unavailable'
      });
    }
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ error: 'Failed to submit writing' });
  }
});

/**
 * GET /api/writing/submissions
 * Get all user submissions with pagination
 */
router.get('/submissions', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const { count, rows } = await WritingSubmission.findAndCountAll({
      where: { userId: req.user.userId },
      include: [{
        model: WritingPrompt,
        attributes: ['id', 'title', 'theme', 'type', 'description'],
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      attributes: [
        'id', 'promptTitle', 'theme', 'promptType', 'wordCount',
        'score', 'status', 'createdAt', 'updatedAt'
      ],
    });

    res.json({
      success: true,
      data: {
        submissions: rows,
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
    console.error('Submissions fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

/**
 * GET /api/writing/submissions/:submissionId
 * Get specific submission with full details
 */
router.get('/submissions/:submissionId', authenticateToken, async (req, res) => {
  try {
    const submission = await WritingSubmission.findOne({
      where: {
        id: req.params.submissionId,
        userId: req.user.userId,
      },
      include: [{
        model: WritingPrompt,
        attributes: ['id', 'title', 'theme', 'type', 'prompt', 'instructions', 'description'],
      }],
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Get associated media
    const media = await GeneratedMedia.findAll({
      where: { submissionId: req.params.submissionId },
      attributes: ['id', 'mediaType', 'imageUrl', 'videoUrl', 'generationStatus'],
    });

    res.json({
      success: true,
      submission: {
        ...submission.toJSON(),
        media,
      },
    });
  } catch (error) {
    console.error('Submission detail error:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

/**
 * DELETE /api/writing/submissions/:submissionId
 * Delete a submission (only own submissions)
 */
router.delete('/submissions/:submissionId', authenticateToken, async (req, res) => {
  try {
    const submission = await WritingSubmission.findOne({
      where: {
        id: req.params.submissionId,
        userId: req.user.userId,
      },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Delete associated media
    await GeneratedMedia.destroy({
      where: { submissionId: req.params.submissionId },
    });

    // Delete submission
    await submission.destroy();

    res.json({
      success: true,
      message: 'Submission deleted',
    });
  } catch (error) {
    console.error('Submission deletion error:', error);
    res.status(500).json({ error: 'Failed to delete submission' });
  }
});

/**
 * POST /api/writing/submissions/:submissionId/reanalyze
 * Re-analyze a submission to regenerate feedback
 */
router.post('/submissions/:submissionId/reanalyze', authenticateToken, async (req, res) => {
  try {
    console.log(`📝 Re-analysis requested for submission: ${req.params.submissionId}`);

    // Find the submission
    const submission = await WritingSubmission.findOne({
      where: {
        id: req.params.submissionId,
        userId: req.user.userId,
      },
      include: [{
        model: WritingPrompt,
        attributes: ['id', 'title', 'prompt', 'theme', 'ageGroup', 'type'],
      }],
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Only allow re-analysis for reviewed or reviewing submissions
    if (submission.status !== 'reviewed' && submission.status !== 'reviewing') {
      return res.status(400).json({
        error: 'Only reviewed submissions can be re-analyzed',
        currentStatus: submission.status
      });
    }

    console.log(`📊 Current score: ${submission.score}, Status: ${submission.status}`);

    // Update status to reviewing
    await submission.update({ status: 'reviewing' });

    // Call AI agents service for feedback
    const axios = require('axios');
    const AI_AGENTS_URL = process.env.AI_AGENTS_URL || 'https://fun-writing-ai-agents-yaildcgk6q-uc.a.run.app';

    console.log(`🤖 Calling AI agents service for re-analysis at: ${AI_AGENTS_URL}`);
    const aiResponse = await axios.post(
      `${AI_AGENTS_URL}/analyze-writing`,
      {
        submissionId: submission.id,
        userId: req.user.userId,
        studentWriting: submission.content,
        originalPrompt: submission.WritingPrompt.prompt,
        ageGroup: submission.ageGroup || submission.WritingPrompt.ageGroup || '11-14',
      },
      {
        timeout: 90000, // 90 second timeout (AI service uses 60s + overhead)
      }
    );

    if (!aiResponse.data || !aiResponse.data.success) {
      throw new Error(aiResponse.data?.error || 'Invalid AI response structure');
    }

    const newScore = aiResponse.data.score || 0;
    const feedback = aiResponse.data.feedback;
    const oldScore = submission.score || 0;

    console.log(`✅ Re-analysis complete. Old score: ${oldScore}, New score: ${newScore}`);

    // Update submission with new feedback
    await submission.update({
      score: newScore,
      feedback,
      status: 'reviewed',
      updatedAt: new Date(),
    });

    // Get user for score/level updates
    const user = await User.findByPk(req.user.userId);
    if (user) {
      // Calculate score difference
      const scoreDifference = newScore - oldScore;

      // Update total score if both scores are >= 51 or if crossing the threshold
      if (newScore >= 51 && oldScore >= 51) {
        // Both scores count - adjust by the difference
        const previousTotalScore = user.totalScore;
        const previousLevel = user.level;

        user.totalScore += scoreDifference;
        user.updateLevel();
        await user.save();

        console.log(`📊 Total score adjusted by ${scoreDifference}: ${previousTotalScore} → ${user.totalScore}`);
        console.log(`🎯 Level updated: ${previousLevel} → ${user.level}`);
      } else if (newScore >= 51 && oldScore < 51) {
        // Crossing threshold - add new score
        const previousTotalScore = user.totalScore;
        const previousLevel = user.level;

        user.totalScore += newScore;
        user.updateLevel();
        await user.save();

        console.log(`📊 Score now qualifies! Total score: ${previousTotalScore} → ${user.totalScore}`);
        console.log(`🎯 Level updated: ${previousLevel} → ${user.level}`);
      } else if (newScore < 51 && oldScore >= 51) {
        // Score dropped below threshold - remove old score
        const previousTotalScore = user.totalScore;
        const previousLevel = user.level;

        user.totalScore -= oldScore;
        user.updateLevel();
        await user.save();

        console.log(`📊 Score no longer qualifies. Total score: ${previousTotalScore} → ${user.totalScore}`);
        console.log(`🎯 Level updated: ${previousLevel} → ${user.level}`);
      }

      // Award bonus credits for perfect score (100 points) - only if improved to 100
      if (newScore === 100 && oldScore !== 100) {
        user.aiCredits += 1000;
        await user.save();
        console.log(`🎉 Perfect score achieved! Awarded 1000 bonus credits to user ${user.id}`);
      }
    }

    // Reload submission with updated data
    await submission.reload({
      include: [{
        model: WritingPrompt,
        attributes: ['id', 'title', 'theme', 'prompt', 'instructions', 'description'],
      }],
    });

    // Get associated media
    const media = await GeneratedMedia.findAll({
      where: { submissionId: submission.id },
      attributes: ['id', 'mediaType', 'imageUrl', 'videoUrl', 'generationStatus'],
    });

    res.json({
      success: true,
      message: 'Submission re-analyzed successfully',
      submission: {
        ...submission.toJSON(),
        media,
      },
    });

  } catch (error) {
    console.error('❌ Re-analysis error:', error.message);

    // Try to reset submission status
    try {
      const submission = await WritingSubmission.findByPk(req.params.submissionId);
      if (submission) {
        await submission.update({ status: 'reviewed' });
      }
    } catch (resetError) {
      console.error('Failed to reset submission status:', resetError);
    }

    res.status(500).json({
      error: 'Failed to re-analyze submission',
      details: error.message
    });
  }
});

module.exports = router;
