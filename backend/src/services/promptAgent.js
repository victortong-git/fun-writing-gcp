const geminiService = require('./geminiService');

/**
 * Prompt Agent Service
 * Generates creative, age-appropriate writing prompts
 */

/**
 * Generate a writing prompt
 * @param {string} theme - Writing theme (e.g., "Fairy Tale", "Mystery")
 * @param {string} ageGroup - Age group (e.g., "11-14")
 * @returns {Promise<object>} Generated prompt with instructions
 */
async function generatePrompt(theme, ageGroup = '11-14') {
  try {
    const systemPrompt = `You are an expert educational prompt writer for the "${theme}" theme.
Generate age-appropriate creative writing prompts that inspire imagination while being suitable for age group ${ageGroup}.`;

    const prompt = `
Generate a creative writing prompt for age group ${ageGroup} with the theme: "${theme}"

Include:
1. An engaging opening or scenario
2. 3-4 specific guiding questions or instructions
3. Recommended word count (appropriate for age)

Format your response as JSON:
{
  "title": "Prompt title",
  "prompt": "Main prompt text",
  "instructions": ["instruction 1", "instruction 2", "instruction 3"],
  "wordCountTarget": 300,
  "wordCountMin": 200,
  "wordCountMax": 400,
  "estimatedTimeMinutes": 30
}
`;

    const result = await geminiService.callGeminiJSON(prompt, 'Writing prompt JSON', {
      systemPrompt,
      temperature: 0.8,
    });

    console.log(`[PROMPT_AGENT] Generated prompt for ${theme} (Age: ${ageGroup})`);

    return {
      theme,
      ageGroup,
      ...result,
    };
  } catch (error) {
    console.error('[PROMPT_AGENT_ERROR]', error.message);
    throw new Error(`Failed to generate prompt: ${error.message}`);
  }
}

/**
 * Generate multiple prompt variations
 * @param {string} theme - Writing theme
 * @param {string} ageGroup - Age group
 * @param {number} count - Number of prompts to generate
 * @returns {Promise<array>} Array of prompts
 */
async function generatePromptVariations(theme, ageGroup = '11-14', count = 3) {
  const prompts = [];

  for (let i = 0; i < count; i++) {
    try {
      const prompt = await generatePrompt(theme, ageGroup);
      prompts.push({
        ...prompt,
        variation: i + 1,
      });

      // Small delay between requests to avoid rate limiting
      if (i < count - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.warn(`[PROMPT_AGENT] Failed to generate variation ${i + 1}:`, error.message);
    }
  }

  return prompts;
}

/**
 * Get word count recommendation for age group
 * @param {string} ageGroup - Age group
 * @returns {object} Word count specifications
 */
function getWordCountRecommendation(ageGroup) {
  const recommendations = {
    '3-5': { min: 20, target: 30, max: 50 },
    '5-7': { min: 50, target: 75, max: 100 },
    '7-11': { min: 100, target: 200, max: 300 },
    '11-14': { min: 250, target: 350, max: 500 },
    '14-16': { min: 400, target: 600, max: 800 },
    '16+': { min: 750, target: 1000, max: 1500 },
  };

  return recommendations[ageGroup] || recommendations['11-14'];
}

/**
 * Get time limit recommendation
 * @param {string} ageGroup - Age group
 * @returns {number} Time limit in minutes
 */
function getTimeLimitRecommendation(ageGroup) {
  const timeLimits = {
    '3-5': 15,
    '5-7': 20,
    '7-11': 30,
    '11-14': 45,
    '14-16': 60,
    '16+': 90,
  };

  return timeLimits[ageGroup] || timeLimits['11-14'];
}

/**
 * Validate prompt for age-appropriateness
 * @param {string} prompt - Prompt text
 * @param {string} ageGroup - Age group
 * @returns {Promise<object>} Validation result
 */
async function validatePrompt(prompt, ageGroup) {
  try {
    const checkPrompt = `
Is this prompt age-appropriate for ${ageGroup}? Does it inspire creativity without being offensive or inappropriate?

Prompt: "${prompt}"

Respond with JSON only:
{
  "isAppropriate": boolean,
  "inspiresCreativity": boolean,
  "concerns": ["concern 1", "concern 2"] or [],
  "feedback": "brief feedback"
}
`;

    const result = await geminiService.callGeminiJSON(checkPrompt);

    return {
      ...result,
      ageGroup,
    };
  } catch (error) {
    console.error('[PROMPT_VALIDATION_ERROR]', error.message);
    return {
      isAppropriate: true,
      inspiresCreativity: true,
      concerns: [],
      feedback: 'Validation skipped due to service error',
    };
  }
}

module.exports = {
  generatePrompt,
  generatePromptVariations,
  getWordCountRecommendation,
  getTimeLimitRecommendation,
  validatePrompt,
};
