const { User } = require('../models');

/**
 * Credit Service - Manages user credits for AI generations
 */

/**
 * Deduct credits from user account
 * @param {string} userId - User ID
 * @param {number} amount - Credits to deduct
 * @param {string} reason - Reason for deduction (e.g., 'image-generation', 'video-generation')
 * @returns {Promise<object>} Updated user object
 */
async function deductCredits(userId, amount, reason) {
  if (amount <= 0) {
    throw new Error('Credit amount must be positive');
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (user.aiCredits < amount) {
    throw new Error(`Insufficient credits. Required: ${amount}, Available: ${user.aiCredits}`);
  }

  user.aiCredits -= amount;
  await user.save();

  console.log(`[CREDITS] Deducted ${amount} credits from user ${userId} for ${reason}. New balance: ${user.aiCredits}`);

  return user;
}

/**
 * Add credits to user account
 * @param {string} userId - User ID
 * @param {number} amount - Credits to add
 * @param {string} reason - Reason for addition (e.g., 'perfect-score-bonus', 'achievement-reward')
 * @returns {Promise<object>} Updated user object
 */
async function addCredits(userId, amount, reason) {
  if (amount <= 0) {
    throw new Error('Credit amount must be positive');
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  user.aiCredits += amount;
  await user.save();

  console.log(`[CREDITS] Added ${amount} credits to user ${userId} for ${reason}. New balance: ${user.aiCredits}`);

  return user;
}

/**
 * Check if user has sufficient credits
 * @param {string} userId - User ID
 * @param {number} amount - Credits required
 * @returns {Promise<boolean>} True if user has sufficient credits
 */
async function hasSufficientCredits(userId, amount) {
  const user = await User.findByPk(userId, { attributes: ['aiCredits'] });
  if (!user) {
    throw new Error('User not found');
  }
  return user.aiCredits >= amount;
}

/**
 * Get current credit balance
 * @param {string} userId - User ID
 * @returns {Promise<number>} Current credit balance
 */
async function getCreditBalance(userId) {
  const user = await User.findByPk(userId, { attributes: ['aiCredits'] });
  if (!user) {
    throw new Error('User not found');
  }
  return user.aiCredits;
}

/**
 * Reset user credits to default amount (3000)
 * Useful for admins to reset accounts
 * @param {string} userId - User ID
 * @returns {Promise<object>} Updated user object
 */
async function resetCredits(userId) {
  const defaultCredits = parseInt(process.env.TRIAL_INITIAL_CREDITS || 3000);
  const user = await User.findByPk(userId);

  if (!user) {
    throw new Error('User not found');
  }

  user.aiCredits = defaultCredits;
  await user.save();

  console.log(`[CREDITS] Reset credits for user ${userId} to ${defaultCredits}`);

  return user;
}

/**
 * Get credit cost for operation
 * @param {string} operationType - Type of operation ('image' or 'video')
 * @returns {number} Credit cost
 */
function getCreditCost(operationType) {
  const costs = {
    image: parseInt(process.env.CREDIT_PER_IMAGE || 100),
    'image-pack': (parseInt(process.env.CREDIT_PER_IMAGE || 100)) * 3,
    video: parseInt(process.env.CREDIT_PER_VIDEO || 500),
  };

  if (!costs[operationType]) {
    throw new Error(`Unknown operation type: ${operationType}`);
  }

  return costs[operationType];
}

/**
 * Get credit status for user
 * @param {string} userId - User ID
 * @returns {Promise<object>} Credit status including balance, trial status, etc.
 */
async function getCreditStatus(userId) {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new Error('User not found');
  }

  const trialEndDate = new Date(user.trialEndDate);
  const now = new Date();
  const isTrialActive = trialEndDate > now;
  const daysUntilTrialEnds = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24));

  return {
    userId: user.id,
    aiCredits: user.aiCredits,
    subscriptionStatus: user.subscriptionStatus,
    isTrialActive,
    trialEndDate: user.trialEndDate,
    daysUntilTrialEnds: isTrialActive ? daysUntilTrialEnds : 0,
    level: user.level,
    totalScore: user.totalScore,
  };
}

/**
 * Check if user can perform operation and deduct credits
 * @param {string} userId - User ID
 * @param {string} operationType - Type of operation
 * @param {string} reason - Reason for deduction
 * @returns {Promise<object>} Result with success status and new balance
 */
async function performCreditedOperation(userId, operationType, reason) {
  try {
    const cost = getCreditCost(operationType);
    const hasEnough = await hasSufficientCredits(userId, cost);

    if (!hasEnough) {
      const currentBalance = await getCreditBalance(userId);
      return {
        success: false,
        error: 'Insufficient credits',
        creditsRequired: cost,
        creditsAvailable: currentBalance,
      };
    }

    const user = await deductCredits(userId, cost, reason);

    return {
      success: true,
      creditsDeducted: cost,
      newBalance: user.aiCredits,
    };
  } catch (error) {
    console.error('[CREDITS_ERROR]', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  deductCredits,
  addCredits,
  hasSufficientCredits,
  getCreditBalance,
  resetCredits,
  getCreditCost,
  getCreditStatus,
  performCreditedOperation,
};
