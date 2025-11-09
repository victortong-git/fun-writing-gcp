const geminiService = require('./geminiService');

/**
 * Safety Agent Service
 * Moderates user submissions and AI-generated content
 * Ensures compliance with age-appropriate guidelines
 */

/**
 * Prohibited topics and patterns to filter
 */
const PROHIBITED_TOPICS = [
  'violence',
  'gore',
  'abuse',
  'self-harm',
  'suicide',
  'sexual content',
  'profanity',
  'hate speech',
  'discrimination',
  'bullying',
  'drugs',
  'alcohol',
  'smoking',
  'weapons',
  'dangerous instructions',
  'personal information sharing',
];

/**
 * Validate user-submitted content
 * Checks for harmful, violent, or inappropriate content
 * @param {string} text - Content to validate
 * @param {string} ageGroup - Age group of student
 * @returns {Promise<object>} Validation result
 */
async function validateUserSubmission(text, ageGroup = '11-14') {
  if (!text || text.trim().length === 0) {
    return {
      passed: false,
      reason: 'Content is empty',
      harmfulTopics: [],
    };
  }

  try {
    // Quick check for obvious prohibited words
    const lowerText = text.toLowerCase();
    const foundProhibited = PROHIBITED_TOPICS.filter((topic) =>
      lowerText.includes(topic.toLowerCase())
    );

    if (foundProhibited.length > 0) {
      console.log(`[SAFETY] Prohibited topics found: ${foundProhibited.join(', ')}`);
      return {
        passed: false,
        reason: `Content contains prohibited topics: ${foundProhibited.join(', ')}`,
        harmfulTopics: foundProhibited,
      };
    }

    // Use Gemini for deeper analysis
    const safetyCheck = await geminiService.checkContentSafety(text, ageGroup);

    return {
      passed: safetyCheck.isSafe,
      reason: safetyCheck.reason,
      harmfulTopics: safetyCheck.harmfulTopics || [],
    };
  } catch (error) {
    console.error('[SAFETY_ERROR]', error.message);

    // On error, log but don't block (fail open)
    return {
      passed: true,
      reason: 'Safety check service unavailable, allowing content',
      warning: error.message,
    };
  }
}

/**
 * Validate AI-generated output before showing to user
 * More strict than user submission validation
 * @param {string} text - AI-generated text
 * @param {string} ageGroup - Age group of student
 * @returns {Promise<object>} Validation result
 */
async function validateAIOutput(text, ageGroup = '11-14') {
  if (!text || text.trim().length === 0) {
    return {
      passed: false,
      reason: 'AI output is empty',
    };
  }

  // Check for prohibited content
  const lowerText = text.toLowerCase();

  // Strict list for AI output
  const strictProhibited = [
    'violence',
    'gore',
    'abuse',
    'sexual',
    'profanity',
    'hate',
    'discriminat',
    'bully',
    'drug',
    'suicide',
    'self-harm',
  ];

  for (const prohibited of strictProhibited) {
    if (lowerText.includes(prohibited)) {
      console.warn(`[SAFETY] AI output contains prohibited content: ${prohibited}`);
      return {
        passed: false,
        reason: `Generated content contains inappropriate material: ${prohibited}`,
      };
    }
  }

  return {
    passed: true,
    reason: 'Content passes safety check',
  };
}

/**
 * Sanitize AI-generated text
 * Removes or replaces potentially inappropriate content
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
function sanitizeText(text) {
  if (!text) return text;

  // Replace common profanities with censored versions
  let sanitized = text;

  const profanities = [
    { pattern: /\bshit\b/gi, replacement: 'crap' },
    { pattern: /\bass\b/gi, replacement: 'butt' },
    { pattern: /\bcrap\b/gi, replacement: 'poop' },
  ];

  for (const { pattern, replacement } of profanities) {
    sanitized = sanitized.replace(pattern, replacement);
  }

  return sanitized;
}

/**
 * Check if content is appropriate for age group
 * @param {string} text - Content to check
 * @param {string} ageGroup - Age group ('3-5', '5-7', etc.)
 * @returns {Promise<boolean>} True if appropriate
 */
async function isAgeAppropriate(text, ageGroup) {
  const ageRestrictions = {
    '3-5': ['complex vocabulary', 'abstract concepts'],
    '5-7': ['complex themes', 'scary content'],
    '7-11': ['mature themes', 'dark content'],
    '11-14': [],
    '14-16': [],
    '16+': [],
  };

  // Simple check based on text complexity
  const wordCount = text.split(/\s+/).length;
  const avgWordLength = text.split(/\s+/).reduce((sum, word) => sum + word.length, 0) / wordCount;

  // Younger age groups shouldn't see overly complex text
  if (ageGroup === '3-5' && avgWordLength > 7) {
    return false;
  }

  if ((ageGroup === '5-7' || ageGroup === '7-11') && avgWordLength > 10) {
    return false;
  }

  return true;
}

/**
 * Get safety report for content
 * Comprehensive safety analysis
 * @param {string} text - Content to analyze
 * @param {string} ageGroup - Age group
 * @param {string} type - Type of content ('user-submission' or 'ai-output')
 * @returns {Promise<object>} Detailed safety report
 */
async function getSafetyReport(text, ageGroup, type = 'user-submission') {
  try {
    const validation = type === 'ai-output'
      ? await validateAIOutput(text, ageGroup)
      : await validateUserSubmission(text, ageGroup);

    const ageAppropriate = await isAgeAppropriate(text, ageGroup);

    return {
      passed: validation.passed && ageAppropriate,
      validation,
      ageAppropriate,
      contentType: type,
      timestamp: new Date(),
      recommendation: validation.passed && ageAppropriate ? 'approve' : 'reject',
    };
  } catch (error) {
    console.error('[SAFETY_REPORT_ERROR]', error.message);

    return {
      passed: false,
      validation: {
        passed: false,
        reason: `Safety check error: ${error.message}`,
      },
      error: error.message,
      recommendation: 'review-manually',
    };
  }
}

/**
 * Flag content for manual review
 * Used for borderline cases
 * @param {string} contentId - ID of content
 * @param {string} reason - Reason for flagging
 * @param {number} severity - Severity level (1-5)
 * @returns {object} Flag record
 */
function flagForReview(contentId, reason, severity = 2) {
  const flag = {
    id: require('uuid').v4(),
    contentId,
    reason,
    severity,
    createdAt: new Date(),
    status: 'pending',
  };

  console.log(`[SAFETY] Content flagged for review: ${contentId} - ${reason} (Severity: ${severity})`);

  return flag;
}

/**
 * Detect if content appears to be copy-pasted from external sources
 * Uses AI to analyze writing patterns, consistency, and suspicious indicators
 * @param {string} text - Content to check
 * @param {string} ageGroup - Age group of student
 * @returns {Promise<object>} Copy-paste detection result
 */
async function detectCopyPaste(text, ageGroup = '11-14') {
  if (!text || text.trim().length === 0) {
    return {
      likelyCopyPasted: false,
      confidence: 0,
      indicators: [],
      reason: 'Content is too short to analyze',
    };
  }

  try {
    // Check minimum length for analysis
    if (text.trim().length < 50) {
      return {
        likelyCopyPasted: false,
        confidence: 0,
        indicators: [],
        reason: 'Content is too short for copy-paste detection',
      };
    }

    const prompt = `You are an expert at detecting copy-pasted content in student writing assignments. Analyze this student writing submission for signs of copy-pasting from external sources.

Student Age Group: ${ageGroup}
Text to analyze:
"${text}"

Analyze for these specific indicators:
1. Writing style inconsistencies (sudden shifts in tone or vocabulary)
2. Vocabulary inappropriately advanced for the age group
3. Professional or overly formal tone unexpected for a student of this age
4. Multiple distinct writing styles within the same text
5. Suspiciously polished sentences that stand out from the rest
6. Unnatural transitions between sentences
7. Use of idioms or expressions too advanced for the age group
8. Patterns typical of adult writing that wouldn't match student level

Based on your analysis, respond ONLY with valid JSON (no markdown, no code blocks, no extra text):
{
  "likelyCopyPasted": boolean,
  "confidence": number (0-100),
  "indicators": [list of specific indicators found],
  "reason": "brief explanation of findings"
}

Be conservative - only mark as likely copy-pasted if you find multiple strong indicators.`;

    const result = await geminiService.callGeminiJSON(prompt);

    // Validate the response
    if (!result || typeof result !== 'object') {
      console.error('[COPY_PASTE_DETECTION_ERROR] Invalid response from Gemini');
      return {
        likelyCopyPasted: false,
        confidence: 0,
        indicators: [],
        reason: 'Detection service error - allowing content',
        error: 'Invalid service response',
      };
    }

    // Ensure all required fields exist
    return {
      likelyCopyPasted: result.likelyCopyPasted === true,
      confidence: Math.min(100, Math.max(0, result.confidence || 0)),
      indicators: Array.isArray(result.indicators) ? result.indicators : [],
      reason: result.reason || 'No analysis available',
    };
  } catch (error) {
    console.error('[COPY_PASTE_DETECTION_ERROR]', error.message);

    // On error, don't block (fail open) - teacher can manually review if needed
    return {
      likelyCopyPasted: false,
      confidence: 0,
      indicators: [],
      reason: 'Detection service unavailable - allowing content',
      error: error.message,
    };
  }
}

module.exports = {
  validateUserSubmission,
  validateAIOutput,
  sanitizeText,
  isAgeAppropriate,
  getSafetyReport,
  flagForReview,
  detectCopyPaste,
  PROHIBITED_TOPICS,
};
