#!/usr/bin/env node

/**
 * Run migration 004 - Add profilePictureUrl column to Users table
 * This script can be run directly to apply the migration
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

async function runMigration() {
  console.log('🔄 Running migration 004: Add profilePictureUrl column');

  const dialectOptions = {};

  // Add SSL if connecting to external host (not Cloud SQL socket)
  if (process.env.DB_HOST && !process.env.DB_HOST.startsWith('/cloudsql')) {
    dialectOptions.ssl = {
      require: true,
      rejectUnauthorized: false
    };
  }

  const sequelize = new Sequelize(
    process.env.DB_NAME || 'fun_writing_prod',
    process.env.DB_USER || 'funwriting',
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      dialectOptions,
      logging: console.log,
    }
  );

  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established');

    // Add profilePictureUrl column
    await sequelize.query(`
      ALTER TABLE "Users"
      ADD COLUMN IF NOT EXISTS "profilePictureUrl" VARCHAR(500);
    `);
    console.log('✓ Added profilePictureUrl column');

    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigration();
