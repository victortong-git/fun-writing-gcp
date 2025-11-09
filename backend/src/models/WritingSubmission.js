const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WritingSubmission = sequelize.define(
  'WritingSubmission',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    promptId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'WritingPrompts',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    promptTitle: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    theme: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    promptType: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    promptDifficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard'),
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'The student writing',
    },
    wordCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    timeSpent: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Time spent in minutes',
    },
    status: {
      type: DataTypes.ENUM('submitted', 'reviewing', 'reviewed', 'revised'),
      defaultValue: 'submitted',
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 0, max: 100 },
      comment: 'Score out of 100',
    },
    feedback: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Detailed feedback from FeedbackAgent',
    },
    ageGroup: {
      type: DataTypes.ENUM('3-5', '5-7', '7-11', '11-14', '14-16', '16+'),
      allowNull: true,
    },
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard'),
      allowNull: true,
    },
    submissionNumber: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    originalSubmissionId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Reference to original submission for revisions',
    },
    submissionType: {
      type: DataTypes.ENUM('practice', 'quiz', 'assessment'),
      defaultValue: 'practice',
    },
    attemptNumber: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    maxAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
    },
    timeLimitSeconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    mediaUrls: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Generated images and video URLs',
    },
    creditsUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Total credits deducted for this submission',
    },
    safetyCheckPassed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    safetyFeedback: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Feedback from SafetyAgent',
    },
    copyPasteCheckPerformed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether copy-paste detection was performed (true = checked, false = skipped)',
    },
    copyPasteCheckResult: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Results from copy-paste detection analysis',
    },
  },
  {
    timestamps: true,
  }
);

WritingSubmission.associate = (models) => {
  WritingSubmission.belongsTo(models.User, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',
  });

  WritingSubmission.belongsTo(models.WritingPrompt, {
    foreignKey: 'promptId',
    onDelete: 'SET NULL',
  });

  WritingSubmission.hasMany(models.WritingSubmission, {
    foreignKey: 'originalSubmissionId',
    as: 'revisions',
  });
};

/**
 * Calculate credits earned from score
 */
WritingSubmission.prototype.calculateRewardCredits = function () {
  if (!this.score) return 0;

  if (this.score === 100) {
    return parseInt(process.env.BONUS_CREDITS_PERFECT_SCORE || 1000);
  }

  return 0;
};

module.exports = WritingSubmission;
