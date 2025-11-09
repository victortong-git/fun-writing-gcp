const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WritingPrompt = sequelize.define(
  'WritingPrompt',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    prompt: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    instructions: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Array of 3-5 guiding instructions',
    },
    type: {
      type: DataTypes.ENUM('creative', 'persuasive', 'descriptive', 'narrative', 'informative', 'poems'),
      defaultValue: 'creative',
      comment: 'Writing type: creative, persuasive, descriptive, narrative, informative, or poems',
    },
    theme: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'e.g., Fairy Tale, Hero Quest, Mystery, etc. (mainly for creative)',
    },
    ageGroup: {
      type: DataTypes.ENUM('3-5', '5-7', '7-11', '11-14', '14-16', '16+'),
      allowNull: false,
    },
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard'),
      defaultValue: 'medium',
    },
    wordCountMin: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    wordCountMax: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    wordCountTarget: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Recommended word count',
    },
    timeLimit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Time limit in minutes',
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    rubric: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Scoring criteria',
    },
    category: {
      type: DataTypes.ENUM('practice', 'quiz', 'assessment'),
      defaultValue: 'practice',
    },
    maxAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
    },
    passingScore: {
      type: DataTypes.INTEGER,
      defaultValue: 70,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Admin who created this prompt',
    },
  },
  {
    timestamps: true,
  }
);

WritingPrompt.associate = (models) => {
  WritingPrompt.hasMany(models.WritingSubmission, {
    foreignKey: 'promptId',
    onDelete: 'SET NULL',
  });
};

module.exports = WritingPrompt;
