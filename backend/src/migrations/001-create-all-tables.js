'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Create Users table
     */
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      role: {
        type: Sequelize.ENUM('student', 'parent', 'school', 'super_admin'),
        defaultValue: 'student',
      },
      age: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      ageGroup: {
        type: Sequelize.ENUM('3-5', '5-7', '7-11', '11-14', '14-16', '16+'),
        allowNull: true,
      },
      avatar: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      totalScore: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      aiCredits: {
        type: Sequelize.INTEGER,
        defaultValue: 3000,
      },
      level: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      streak: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      subscriptionStatus: {
        type: Sequelize.ENUM('trial', 'active', 'inactive', 'cancelled'),
        defaultValue: 'trial',
      },
      trialStartDate: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      trialEndDate: {
        type: Sequelize.DATE,
      },
      isEmailVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      emailVerificationToken: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      lastActiveDate: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Create index on email for faster lookups
    await queryInterface.addIndex('Users', ['email'], { unique: true });

    /**
     * Create Admins table
     */
    await queryInterface.createTable('Admins', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      role: {
        type: Sequelize.ENUM('super_admin', 'admin', 'content_manager'),
        defaultValue: 'admin',
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      lastLoginDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('Admins', ['email'], { unique: true });

    /**
     * Create WritingPrompts table
     */
    await queryInterface.createTable('WritingPrompts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      prompt: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      instructions: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      theme: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      ageGroup: {
        type: Sequelize.ENUM('3-5', '5-7', '7-11', '11-14', '14-16', '16+'),
        allowNull: false,
      },
      difficulty: {
        type: Sequelize.ENUM('easy', 'medium', 'hard'),
        defaultValue: 'medium',
      },
      wordCountMin: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      wordCountMax: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      wordCountTarget: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      timeLimit: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
      },
      rubric: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      category: {
        type: Sequelize.ENUM('practice', 'quiz', 'assessment'),
        defaultValue: 'practice',
      },
      maxAttempts: {
        type: Sequelize.INTEGER,
        defaultValue: 3,
      },
      passingScore: {
        type: Sequelize.INTEGER,
        defaultValue: 70,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Admins',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    /**
     * Create WritingSubmissions table
     */
    await queryInterface.createTable('WritingSubmissions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      promptId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'WritingPrompts',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      promptTitle: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      theme: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      promptType: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      promptDifficulty: {
        type: Sequelize.ENUM('easy', 'medium', 'hard'),
        allowNull: true,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      wordCount: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      timeSpent: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('submitted', 'reviewing', 'reviewed', 'revised'),
        defaultValue: 'submitted',
      },
      score: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: { min: 0, max: 100 },
      },
      feedback: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      ageGroup: {
        type: Sequelize.ENUM('3-5', '5-7', '7-11', '11-14', '14-16', '16+'),
        allowNull: true,
      },
      difficulty: {
        type: Sequelize.ENUM('easy', 'medium', 'hard'),
        allowNull: true,
      },
      submissionNumber: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      originalSubmissionId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'WritingSubmissions',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      submissionType: {
        type: Sequelize.ENUM('practice', 'quiz', 'assessment'),
        defaultValue: 'practice',
      },
      attemptNumber: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      maxAttempts: {
        type: Sequelize.INTEGER,
        defaultValue: 3,
      },
      timeLimitSeconds: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      mediaUrls: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      creditsUsed: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      safetyCheckPassed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      safetyFeedback: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Create indexes for faster queries
    await queryInterface.addIndex('WritingSubmissions', ['userId']);
    await queryInterface.addIndex('WritingSubmissions', ['promptId']);

    /**
     * Create GeneratedMedia table
     */
    await queryInterface.createTable('GeneratedMedias', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      submissionId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'WritingSubmissions',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      mediaType: {
        type: Sequelize.ENUM('image', 'video'),
        allowNull: false,
      },
      imagePrompt: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      imageUrl: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      videoPrompt: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      videoUrl: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      selectedImageUrl: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      voiceOverScript: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      generationStatus: {
        type: Sequelize.ENUM('pending', 'generating', 'completed', 'failed'),
        defaultValue: 'pending',
      },
      generationError: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      creditsUsed: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('GeneratedMedias', ['submissionId']);
    await queryInterface.addIndex('GeneratedMedias', ['userId']);

    /**
     * Create UserAchievements table
     */
    await queryInterface.createTable('UserAchievements', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      achievementId: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      achievementName: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      icon: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      unlockedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      progress: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      isUnlocked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      rarity: {
        type: Sequelize.ENUM('common', 'rare', 'epic', 'legendary'),
        defaultValue: 'common',
      },
      creditsReward: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('UserAchievements', ['userId']);
    await queryInterface.addIndex('UserAchievements', ['achievementId']);
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order
    await queryInterface.dropTable('UserAchievements', { cascade: true });
    await queryInterface.dropTable('GeneratedMedias', { cascade: true });
    await queryInterface.dropTable('WritingSubmissions', { cascade: true });
    await queryInterface.dropTable('WritingPrompts', { cascade: true });
    await queryInterface.dropTable('Admins', { cascade: true });
    await queryInterface.dropTable('Users', { cascade: true });
  },
};
