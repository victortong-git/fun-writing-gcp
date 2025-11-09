/**
 * Migration Script: Add Writing Types to WritingPrompt Table
 *
 * This script adds the 'type' column to the WritingPrompts table
 * to support multiple writing types (creative, persuasive, descriptive, etc.)
 */

const sequelize = require('../src/config/database');
const { QueryTypes } = require('sequelize');

async function migrate() {
  try {
    console.log('🔄 Running migration: Add writing types support...\n');

    // Check if type column already exists
    const result = await sequelize.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_name = 'WritingPrompts' AND column_name = 'type'`,
      { type: QueryTypes.SELECT }
    );

    if (result.length > 0) {
      console.log('✅ Type column already exists. Skipping migration.\n');
      process.exit(0);
    }

    // Add type column
    console.log('📝 Adding type column to WritingPrompts table...');
    await sequelize.query(
      `ALTER TABLE "WritingPrompts"
       ADD COLUMN type VARCHAR(50) DEFAULT 'creative'`
    );
    console.log('✅ Type column added\n');

    // Create ENUM type if it doesn't exist
    console.log('📝 Creating ENUM type for writing types...');
    try {
      await sequelize.query(
        `CREATE TYPE enum_WritingPrompts_type AS ENUM(
          'creative', 'persuasive', 'descriptive', 'narrative', 'informative', 'poems'
        )`
      );
      console.log('✅ ENUM type created\n');
    } catch (err) {
      console.log('ℹ️ ENUM type already exists\n');
    }

    // Alter column to use ENUM
    console.log('📝 Converting type column to ENUM...');
    try {
      await sequelize.query(
        `ALTER TABLE "WritingPrompts"
         ALTER COLUMN type TYPE enum_WritingPrompts_type USING type::text::enum_WritingPrompts_type`
      );
      console.log('✅ Type column converted to ENUM\n');
    } catch (err) {
      console.log('⚠️ Could not convert to ENUM (might already be ENUM)', err.message, '\n');
    }

    // Make theme nullable (if not already)
    console.log('📝 Making theme column nullable...');
    await sequelize.query(
      `ALTER TABLE "WritingPrompts"
       ALTER COLUMN theme DROP NOT NULL`
    );
    console.log('✅ Theme column is now nullable\n');

    console.log('✅ Migration completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    if (error.original) {
      console.error('Original error:', error.original.message);
    }
    process.exit(1);
  }
}

migrate();
