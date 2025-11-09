'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add copy-paste detection columns to WritingSubmissions table
     */
    await queryInterface.addColumn('WritingSubmissions', 'copyPasteCheckPerformed', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      comment: 'Whether copy-paste detection was performed (true = checked, false = skipped)',
      allowNull: false,
    });

    await queryInterface.addColumn('WritingSubmissions', 'copyPasteCheckResult', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Results from copy-paste detection analysis',
    });

    console.log('✓ Added copy-paste detection columns to WritingSubmissions table');
  },

  async down(queryInterface, Sequelize) {
    /**
     * Remove copy-paste detection columns from WritingSubmissions table
     */
    await queryInterface.removeColumn('WritingSubmissions', 'copyPasteCheckPerformed');
    await queryInterface.removeColumn('WritingSubmissions', 'copyPasteCheckResult');

    console.log('✓ Removed copy-paste detection columns from WritingSubmissions table');
  },
};
