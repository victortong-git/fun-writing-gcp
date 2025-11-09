const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('student', 'parent', 'school', 'super_admin'),
      defaultValue: 'student',
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ageGroup: {
      type: DataTypes.ENUM('3-5', '5-7', '7-11', '11-14', '14-16', '16+'),
      allowNull: true,
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    profilePictureUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    totalScore: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    aiCredits: {
      type: DataTypes.INTEGER,
      defaultValue: 3000, // Starting credits for all new users
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    streak: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    subscriptionStatus: {
      type: DataTypes.ENUM('trial', 'active', 'inactive', 'cancelled'),
      defaultValue: 'trial',
    },
    trialStartDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    trialEndDate: {
      type: DataTypes.DATE,
      defaultValue: () => {
        const date = new Date();
        date.setDate(date.getDate() + 14); // 14-day trial
        return date;
      },
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    emailVerificationToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    lastActiveDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        const salt = await bcrypt.genSalt(6);
        user.password = await bcrypt.hash(user.password, salt);
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(6);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

/**
 * Check if password matches
 */
User.prototype.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

/**
 * Get user without sensitive data
 */
User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  delete values.emailVerificationToken;
  return values;
};

/**
 * Calculate current level based on total score (300 points = 1 level)
 */
User.prototype.updateLevel = function () {
  this.level = Math.floor(this.totalScore / 300) + 1;
};

/**
 * Deduct credits for media generation
 */
User.prototype.deductCredits = async function (amount) {
  if (this.aiCredits < amount) {
    throw new Error('Insufficient credits');
  }
  this.aiCredits -= amount;
  await this.save();
};

/**
 * Add credits (for rewards)
 */
User.prototype.addCredits = async function (amount) {
  this.aiCredits += amount;
  await this.save();
};

/**
 * Check if trial is still active
 */
User.prototype.isTrialActive = function () {
  return new Date(this.trialEndDate) > new Date();
};

module.exports = User;
