'use strict';

/**
 * Migration: Add indexes for gallery queries
 * Optimizes fetching user's generated media with associated submission data
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add index on userId in generated_media for fast user gallery queries
    await queryInterface.addIndex('generated_media', ['user_id'], {
      name: 'idx_generated_media_user_id'
    });

    // Add composite index on userId and createdAt for sorted gallery queries
    await queryInterface.addIndex('generated_media', ['user_id', 'created_at'], {
      name: 'idx_generated_media_user_created'
    });

    // Add index on submissionId for fast joins with writing_submissions
    await queryInterface.addIndex('generated_media', ['submission_id'], {
      name: 'idx_generated_media_submission_id'
    });

    console.log('✅ Gallery indexes added successfully');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes in reverse order
    await queryInterface.removeIndex('generated_media', 'idx_generated_media_submission_id');
    await queryInterface.removeIndex('generated_media', 'idx_generated_media_user_created');
    await queryInterface.removeIndex('generated_media', 'idx_generated_media_user_id');

    console.log('✅ Gallery indexes removed successfully');
  }
};
