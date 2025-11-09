const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GeneratedMedia = sequelize.define(
  'GeneratedMedia',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    submissionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'WritingSubmissions',
        key: 'id',
      },
      onDelete: 'CASCADE',
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
    mediaType: {
      type: DataTypes.ENUM('image', 'video'),
      allowNull: false,
    },
    imagePrompt: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'The prompt used to generate the image',
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    videoPrompt: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    videoUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    selectedImageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Which image the user selected for video generation',
    },
    voiceOverScript: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    generationStatus: {
      type: DataTypes.ENUM('pending', 'generating', 'completed', 'failed'),
      defaultValue: 'pending',
    },
    generationError: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    creditsUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    timestamps: true,
  }
);

GeneratedMedia.associate = (models) => {
  GeneratedMedia.belongsTo(models.WritingSubmission, {
    foreignKey: 'submissionId',
    onDelete: 'CASCADE',
  });

  GeneratedMedia.belongsTo(models.User, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',
  });
};

module.exports = GeneratedMedia;
