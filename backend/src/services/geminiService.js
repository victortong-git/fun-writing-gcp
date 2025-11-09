const axios = require('axios');

/**
 * Gemini API Service
 * Integrates with Google Gemini 2.5 Flash for text generation and analysis
 */

const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'gemini-2.5-flash';
const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

if (!API_KEY) {
  console.warn('[GEMINI] WARNING: GOOGLE_API_KEY not configured. Gemini service will not work.');
}

/**
 * Call Gemini API
 * @param {string} prompt - The prompt to send to Gemini
 * @param {object} options - Additional options
 * @param {string} options.systemPrompt - System instructions
 * @param {number} options.temperature - Model temperature (0-2)
 * @param {number} options.maxTokens - Maximum tokens to generate
 * @returns {Promise<string>} Generated text response
 */
async function callGemini(prompt, options = {}) {
  const {
    systemPrompt = 'You are a helpful educational AI assistant.',
    temperature = 0.7,
    maxTokens = 2048,
  } = options;

  if (!API_KEY) {
    throw new Error('GOOGLE_API_KEY not configured');
  }

  try {
    const url = `${API_ENDPOINT}/${MODEL}:generateContent?key=${API_KEY}`;

    const payload = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        topP: 0.95,
        topK: 64,
      },
    };

    // Add system instruction if provided
    if (systemPrompt) {
      payload.systemInstruction = {
        parts: [
          {
            text: systemPrompt,
          },
        ],
      };
    }

    const response = await axios.post(url, payload, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No text in Gemini response');
    }

    console.log('[GEMINI] API call successful');
    return text;
  } catch (error) {
    console.error('[GEMINI_ERROR]', error.message);
    throw new Error(`Gemini API call failed: ${error.message}`);
  }
}

/**
 * Call Gemini with retry logic
 * @param {string} prompt - The prompt to send
 * @param {object} options - Additional options (including systemPrompt)
 * @param {number} retries - Number of retry attempts (default: 3)
 * @returns {Promise<string>} Generated text response
 */
async function callGeminiWithRetry(prompt, options = {}, retries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[GEMINI] Attempt ${attempt}/${retries}`);
      return await callGemini(prompt, options);
    } catch (error) {
      lastError = error;
      console.warn(`[GEMINI] Attempt ${attempt} failed: ${error.message}`);

      // Exponential backoff
      if (attempt < retries) {
        const delayMs = Math.pow(2, attempt - 1) * 1000;
        console.log(`[GEMINI] Waiting ${delayMs}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError || new Error('Gemini API call failed after all retries');
}

/**
 * Analyze text and return JSON response
 * @param {string} prompt - The prompt to analyze
 * @param {string} jsonSchema - Expected JSON structure description
 * @param {object} options - Additional options
 * @returns {Promise<object>} Parsed JSON response
 */
async function callGeminiJSON(prompt, jsonSchema = 'JSON', options = {}) {
  const systemPrompt = options.systemPrompt || `You must respond ONLY with valid JSON. No markdown, no extra text. Schema: ${jsonSchema}`;

  const enhancedPrompt = `${prompt}\n\nRespond with valid JSON only.`;

  const response = await callGeminiWithRetry(enhancedPrompt, {
    ...options,
    systemPrompt,
  });

  try {
    // Try to extract JSON from response (in case of extra text)
    const jsonMatch = response.match(/\{[\s\S]*\}/) || response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Otherwise try to parse directly
    return JSON.parse(response);
  } catch (parseError) {
    console.error('[GEMINI_JSON_PARSE_ERROR]', parseError.message, 'Response:', response);
    throw new Error(`Failed to parse Gemini JSON response: ${parseError.message}`);
  }
}

/**
 * Check content for harmful content
 * @param {string} text - Text to check
 * @param {string} ageGroup - Age group of user
 * @returns {Promise<object>} Safety check result
 */
async function checkContentSafety(text, ageGroup = '11-14') {
  const prompt = `
You are a content moderation AI. Check the following text for inappropriate content.
Age group: ${ageGroup}

Text: "${text}"

Respond with JSON only in this format:
{
  "isSafe": boolean,
  "harmfulTopics": [],
  "reason": "string"
}

Harmful topics include: violence, gore, sexual content, profanity, hate speech, dangerous advice, etc.
`;

  return callGeminiJSON(prompt, 'Safety check JSON');
}

/**
 * Extract key themes and topics from text
 * @param {string} text - Text to analyze
 * @returns {Promise<array>} Array of extracted themes
 */
async function extractThemes(text) {
  const prompt = `
Analyze this text and extract 3-5 key themes, topics, or concepts:

Text: "${text.substring(0, 500)}"

Respond with JSON only:
{
  "themes": ["theme1", "theme2", ...]
}
`;

  const result = await callGeminiJSON(prompt);
  return result.themes || [];
}

/**
 * Generate creative prompt from theme
 * @param {string} theme - Writing theme
 * @param {string} ageGroup - Age group
 * @returns {Promise<string>} Generated prompt
 */
async function generatePrompt(theme, ageGroup = '11-14') {
  const ageContext = {
    '3-5': 'very simple, 20-50 words, about fun animals or colors',
    '5-7': 'simple, 50-100 words, about magical creatures or adventures',
    '7-11': 'moderate, 100-250 words, about fantasy or everyday adventures',
    '11-14': 'engaging, 250-500 words, about complex emotions or interesting worlds',
    '14-16': 'complex, 500-1000 words, about deeper themes or personal growth',
    '16+': 'sophisticated, 1000+ words, about abstract concepts or social issues',
  };

  const prompt = `
Create a creative writing prompt for age group ${ageGroup}.
Theme: ${theme}
Expected complexity: ${ageContext[ageGroup] || ageContext['11-14']}

Generate a clear, engaging prompt that:
1. Sparks imagination
2. Is age-appropriate
3. Is specific enough to guide writing
4. Opens room for creative interpretation

Respond with the prompt only (no JSON, just the prompt text).
`;

  return callGeminiWithRetry(prompt, {
    temperature: 0.8,
  });
}

module.exports = {
  callGemini,
  callGeminiWithRetry,
  callGeminiJSON,
  checkContentSafety,
  extractThemes,
  generatePrompt,
};
