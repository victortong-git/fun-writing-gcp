const { User, UserAchievement } = require('../models');
const creditService = require('./creditService');
const { v4: uuidv4 } = require('uuid');

/**
 * Reward Service - Manages gamification rewards and achievements
 */

/**
 * Award credits based on writing score
 * - Score 51+: adds to total score
 * - Perfect score (100): grants bonus credits
 * @param {string} userId - User ID
 * @param {number} score - Writing score (0-100)
 * @returns {Promise<object>} Reward details
 */
async function awardCreditsForScore(userId, score) {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new Error('User not found');
  }

  const rewards = {
    creditsAwarded: 0,
    scoreAdded: false,
    achievements: [],
  };

  // Add to total score if score is 51 or higher
  if (score >= 51) {
    user.totalScore += score;
    rewards.scoreAdded = true;

    // Update level (300 points = 1 level)
    user.updateLevel();

    console.log(`[REWARDS] Added ${score} to total score for user ${userId}. New total: ${user.totalScore}, Level: ${user.level}`);
  }

  // Award bonus credits for perfect score
  if (score === 100) {
    const bonusCredits = parseInt(process.env.BONUS_CREDITS_PERFECT_SCORE || 1000);
    user.aiCredits += bonusCredits;
    rewards.creditsAwarded = bonusCredits;

    console.log(`[REWARDS] Awarded ${bonusCredits} bonus credits to user ${userId} for perfect score!`);

    // Check for perfect score achievement
    rewards.achievements.push(await checkPerfectScoreAchievement(userId));
  }

  await user.save();

  return rewards;
}

/**
 * Unlock an achievement for user
 * @param {string} userId - User ID
 * @param {string} achievementId - Unique achievement identifier
 * @param {object} achievementData - Achievement details
 * @returns {Promise<object|null>} Achievement if newly unlocked, null if already unlocked
 */
async function unlockAchievement(userId, achievementId, achievementData) {
  // Check if already unlocked
  const existing = await UserAchievement.findOne({
    where: {
      userId,
      achievementId,
      isUnlocked: true,
    },
  });

  if (existing) {
    console.log(`[ACHIEVEMENTS] Achievement ${achievementId} already unlocked for user ${userId}`);
    return null;
  }

  const achievement = await UserAchievement.create({
    id: uuidv4(),
    userId,
    achievementId,
    achievementName: achievementData.name,
    description: achievementData.description,
    icon: achievementData.icon,
    rarity: achievementData.rarity || 'common',
    creditsReward: achievementData.creditsReward || 0,
    isUnlocked: true,
    unlockedAt: new Date(),
  });

  // Award credits if specified
  if (achievement.creditsReward > 0) {
    await creditService.addCredits(userId, achievement.creditsReward, `achievement-${achievementId}`);
  }

  console.log(`[ACHIEVEMENTS] Unlocked achievement ${achievementId} for user ${userId}`);

  return achievement;
}

/**
 * Check for perfect score achievement
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} Achievement object if unlocked
 */
async function checkPerfectScoreAchievement(userId) {
  return unlockAchievement(userId, 'first-perfect-score', {
    name: 'Perfect Writer',
    description: 'Achieved a perfect score of 100 on a writing submission',
    icon: '⭐',
    rarity: 'rare',
    creditsReward: 500,
  });
}

/**
 * Check for first submission achievement
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} Achievement object if unlocked
 */
async function checkFirstSubmissionAchievement(userId) {
  return unlockAchievement(userId, 'first-submission', {
    name: 'Brave Writer',
    description: 'Submitted your first writing',
    icon: '✍️',
    rarity: 'common',
    creditsReward: 100,
  });
}

/**
 * Check for submission milestone achievements
 * @param {string} userId - User ID
 * @param {number} totalSubmissions - Total number of submissions
 * @returns {Promise<array>} Array of newly unlocked achievements
 */
async function checkSubmissionMilestones(userId, totalSubmissions) {
  const achievements = [];

  const milestones = [
    { count: 5, id: 'five-submissions', name: 'Prolific Writer', creditsReward: 250, rarity: 'uncommon' },
    { count: 10, id: 'ten-submissions', name: 'Dedicated Writer', creditsReward: 500, rarity: 'rare' },
    { count: 25, id: 'twenty-five-submissions', name: 'Master Writer', creditsReward: 1000, rarity: 'epic' },
    { count: 50, id: 'fifty-submissions', name: 'Legendary Writer', creditsReward: 2000, rarity: 'legendary' },
  ];

  for (const milestone of milestones) {
    if (totalSubmissions >= milestone.count) {
      const achievement = await unlockAchievement(userId, milestone.id, {
        name: milestone.name,
        description: `Submitted ${milestone.count} writings`,
        icon: '🏆',
        rarity: milestone.rarity,
        creditsReward: milestone.creditsReward,
      });

      if (achievement) {
        achievements.push(achievement);
      }
    }
  }

  return achievements;
}

/**
 * Get all achievements for a user
 * @param {string} userId - User ID
 * @returns {Promise<array>} Array of user achievements
 */
async function getUserAchievements(userId) {
  return UserAchievement.findAll({
    where: { userId },
    order: [['isUnlocked', 'DESC'], ['unlockedAt', 'DESC']],
  });
}

/**
 * Get achievement progress for user
 * @param {string} userId - User ID
 * @returns {Promise<object>} Achievement progress summary
 */
async function getAchievementProgress(userId) {
  const achievements = await getUserAchievements(userId);
  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const totalPossible = achievements.length;
  const totalCreditsEarned = achievements
    .filter((a) => a.isUnlocked)
    .reduce((sum, a) => sum + (a.creditsReward || 0), 0);

  return {
    userId,
    unlockedCount,
    totalPossible,
    progressPercentage: totalPossible > 0 ? ((unlockedCount / totalPossible) * 100).toFixed(2) : 0,
    totalCreditsEarned,
    achievements,
  };
}

/**
 * Check streak and award streak bonus
 * @param {string} userId - User ID
 * @returns {Promise<object>} Streak status
 */
async function updateStreak(userId) {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Simple streak logic - increment streak on each submission
  user.streak += 1;

  // Award bonus credits at streak milestones
  const streakBonuses = {
    5: 250,
    10: 500,
    15: 750,
    20: 1000,
  };

  let bonusAwarded = 0;

  for (const [streakCount, bonus] of Object.entries(streakBonuses)) {
    if (user.streak === parseInt(streakCount)) {
      user.aiCredits += bonus;
      bonusAwarded = bonus;

      console.log(`[REWARDS] Streak bonus of ${bonus} credits awarded to user ${userId} for ${streakCount}-submission streak!`);
      break;
    }
  }

  await user.save();

  return {
    userId,
    streak: user.streak,
    streakBonusAwarded: bonusAwarded,
    newBalance: user.aiCredits,
  };
}

/**
 * Reset streak (for testing or admin purposes)
 * @param {string} userId - User ID
 * @returns {Promise<object>} Updated user
 */
async function resetStreak(userId) {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new Error('User not found');
  }

  user.streak = 0;
  await user.save();

  console.log(`[REWARDS] Streak reset for user ${userId}`);

  return user;
}

/**
 * Get reward status for user
 * @param {string} userId - User ID
 * @returns {Promise<object>} Complete reward status
 */
async function getRewardStatus(userId) {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new Error('User not found');
  }

  const achievements = await getAchievementProgress(userId);

  return {
    userId,
    level: user.level,
    totalScore: user.totalScore,
    streak: user.streak,
    aiCredits: user.aiCredits,
    achievements,
  };
}

module.exports = {
  awardCreditsForScore,
  unlockAchievement,
  checkFirstSubmissionAchievement,
  checkPerfectScoreAchievement,
  checkSubmissionMilestones,
  getUserAchievements,
  getAchievementProgress,
  updateStreak,
  resetStreak,
  getRewardStatus,
};
