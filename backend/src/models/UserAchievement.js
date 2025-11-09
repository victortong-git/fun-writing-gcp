const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserAchievement = sequelize.define(
  'UserAchievement',
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
    achievementId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Unique achievement identifier (e.g., first_submission, perfect_score)',
    },
    achievementName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Display name of achievement',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    icon: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'URL to achievement icon/badge',
    },
    unlockedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: 'When the achievement was earned',
    },
    progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Progress towards achievement (0-100) if not yet unlocked',
    },
    isUnlocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    rarity: {
      type: DataTypes.ENUM('common', 'rare', 'epic', 'legendary'),
      defaultValue: 'common',
      comment: 'Rarity level for display',
    },
    creditsReward: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Bonus credits given when achievement is unlocked',
    },
  },
  {
    timestamps: true,
  }
);

UserAchievement.associate = (models) => {
  UserAchievement.belongsTo(models.User, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',
  });
};

module.exports = UserAchievement;
