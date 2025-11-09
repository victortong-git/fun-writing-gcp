const geminiService = require('./geminiService');

/**
 * Feedback Agent Service
 * Evaluates student writing and provides detailed feedback
 */

/**
 * Evaluate writing submission
 * Scores on grammar, spelling, relevance, creativity
 * @param {string} studentWriting - Student's written submission
 * @param {string} originalPrompt - The original prompt/assignment
 * @param {string} ageGroup - Age group for contextual scoring
 * @returns {Promise<object>} Comprehensive feedback and score
 */
async function evaluateSubmission(studentWriting, originalPrompt, ageGroup = '11-14') {
  try {
    // Parallel evaluation on multiple dimensions
    const [grammar, spelling, relevance, creativity] = await Promise.all([
      evaluateGrammar(studentWriting, ageGroup),
      evaluateSpelling(studentWriting, ageGroup),
      evaluateRelevance(studentWriting, originalPrompt, ageGroup),
      evaluateCreativity(studentWriting, ageGroup),
    ]);

    // Calculate total score (out of 100)
    const totalScore = Math.round((grammar.score + spelling.score + relevance.score + creativity.score) / 4);

    // Generate comprehensive feedback
    const feedback = {
      totalScore,
      breakdown: {
        grammar: grammar.score,
        spelling: spelling.score,
        relevance: relevance.score,
        creativity: creativity.score,
      },
      grammarFeedback: grammar.feedback,
      spellingFeedback: spelling.feedback,
      relevanceFeedback: relevance.feedback,
      creativityFeedback: creativity.feedback,
      strengths: extractStrengths(grammar, spelling, relevance, creativity),
      areasForImprovement: extractAreasForImprovement(grammar, spelling, relevance, creativity),
      generalComment: generateGeneralComment(totalScore, ageGroup),
      nextSteps: generateNextSteps(totalScore, grammar, spelling, relevance, creativity),
    };

    console.log(`[FEEDBACK_AGENT] Evaluation complete. Score: ${totalScore}/100 for age group ${ageGroup}`);

    return feedback;
  } catch (error) {
    console.error('[FEEDBACK_AGENT_ERROR]', error.message);
    throw new Error(`Failed to evaluate submission: ${error.message}`);
  }
}

/**
 * Evaluate grammar
 * @param {string} text - Text to evaluate
 * @param {string} ageGroup - Age group
 * @returns {Promise<object>} Grammar score and feedback
 */
async function evaluateGrammar(text, ageGroup = '11-14') {
  const prompt = `
Evaluate the grammar in this student writing (age ${ageGroup}).
Be encouraging but honest. Give a score out of 25.

Text: "${text.substring(0, 500)}"

Respond with JSON:
{
  "score": 0-25,
  "issues": ["issue 1", "issue 2"],
  "feedback": "specific feedback on grammar"
}
`;

  const result = await geminiService.callGeminiJSON(prompt);

  return {
    score: result.score || 20,
    issues: result.issues || [],
    feedback: result.feedback || 'Good grammar usage',
  };
}

/**
 * Evaluate spelling
 * @param {string} text - Text to evaluate
 * @param {string} ageGroup - Age group
 * @returns {Promise<object>} Spelling score and feedback
 */
async function evaluateSpelling(text, ageGroup = '11-14') {
  const prompt = `
Evaluate the spelling in this student writing (age ${ageGroup}).
Be encouraging. Give a score out of 25.

Text: "${text.substring(0, 500)}"

Respond with JSON:
{
  "score": 0-25,
  "misspelledWords": ["word1", "word2"],
  "feedback": "feedback on spelling"
}
`;

  const result = await geminiService.callGeminiJSON(prompt);

  return {
    score: result.score || 22,
    misspelledWords: result.misspelledWords || [],
    feedback: result.feedback || 'Good spelling',
  };
}

/**
 * Evaluate relevance to prompt
 * @param {string} text - Student writing
 * @param {string} prompt - Original prompt
 * @param {string} ageGroup - Age group
 * @returns {Promise<object>} Relevance score and feedback
 */
async function evaluateRelevance(text, prompt, ageGroup = '11-14') {
  const evaluationPrompt = `
Does this student writing address the original prompt? (age ${ageGroup})
Give a score out of 25 based on how well they followed instructions.

Original prompt: "${prompt}"

Student writing: "${text.substring(0, 500)}"

Respond with JSON:
{
  "score": 0-25,
  "addressed": ["aspect 1", "aspect 2"],
  "missing": ["missing aspect"],
  "feedback": "feedback on relevance"
}
`;

  const result = await geminiService.callGeminiJSON(evaluationPrompt);

  return {
    score: result.score || 18,
    addressed: result.addressed || [],
    missing: result.missing || [],
    feedback: result.feedback || 'Somewhat relevant to prompt',
  };
}

/**
 * Evaluate creativity
 * @param {string} text - Student writing
 * @param {string} ageGroup - Age group
 * @returns {Promise<object>} Creativity score and feedback
 */
async function evaluateCreativity(text, ageGroup = '11-14') {
  const prompt = `
Evaluate the creativity and imagination in this student writing (age ${ageGroup}).
Give a score out of 25.

Text: "${text.substring(0, 500)}"

Respond with JSON:
{
  "score": 0-25,
  "creativeElements": ["element 1", "element 2"],
  "feedback": "feedback on creativity"
}
`;

  const result = await geminiService.callGeminiJSON(prompt);

  return {
    score: result.score || 15,
    creativeElements: result.creativeElements || [],
    feedback: result.feedback || 'Shows some creativity',
  };
}

/**
 * Extract strengths from evaluations
 * @returns {array} List of strengths
 */
function extractStrengths(grammar, spelling, relevance, creativity) {
  const strengths = [];

  if (grammar.score >= 20) strengths.push('Strong grammar and sentence structure');
  if (spelling.score >= 22) strengths.push('Excellent spelling');
  if (relevance.score >= 20) strengths.push('Well-addressed the prompt');
  if (creativity.score >= 18) strengths.push('Creative and imaginative writing');

  return strengths.length > 0 ? strengths : ['Completed the assignment'];
}

/**
 * Extract areas for improvement
 * @returns {array} List of areas to improve
 */
function extractAreasForImprovement(grammar, spelling, relevance, creativity) {
  const improvements = [];

  if (grammar.score < 20) improvements.push('Review grammar and sentence structure');
  if (spelling.score < 22) improvements.push('Practice spelling challenging words');
  if (relevance.score < 20) improvements.push('Stay closer to the original prompt');
  if (creativity.score < 18) improvements.push('Add more creative and unique ideas');

  return improvements.length > 0 ? improvements : [];
}

/**
 * Generate general comment based on score
 * @returns {string} Encouraging comment
 */
function generateGeneralComment(score, ageGroup) {
  if (score === 100) return "🌟 Perfect! You're a master writer!";
  if (score >= 90) return '⭐ Excellent work! Very impressive!';
  if (score >= 80) return '🎉 Great job! Your writing is strong.';
  if (score >= 70) return '👍 Good work! Keep practicing.';
  if (score >= 60) return '✓ Nice effort. Keep improving!';
  if (score >= 50) return '💪 Good start. Practice makes perfect!';
  return '📝 Keep writing and practicing. You\'ll improve!';
}

/**
 * Generate next steps for student
 * @returns {array} Recommended next steps
 */
function generateNextSteps(score, grammar, spelling, relevance, creativity) {
  const steps = [];

  if (grammar.issues && grammar.issues.length > 0) {
    steps.push(`Practice: ${grammar.issues[0]}`);
  }

  if (score < 75) {
    steps.push('Write another story on a similar topic');
    steps.push('Review feedback and revise your writing');
  }

  if (creativity.score < 15) {
    steps.push('Try adding more descriptive words');
    steps.push('Include unexpected plot twists');
  }

  steps.push('Read your writing aloud to catch errors');
  steps.push('Ask for feedback from teachers or friends');

  return steps;
}

module.exports = {
  evaluateSubmission,
  evaluateGrammar,
  evaluateSpelling,
  evaluateRelevance,
  evaluateCreativity,
};
