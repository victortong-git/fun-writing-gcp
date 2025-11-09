#!/usr/bin/env node

/**
 * Setup script to create user and admin accounts
 * Run with: node scripts/setup-victor-accounts.js
 */

require('dotenv').config({ path: '.env' });

const { v4: uuidv4 } = require('uuid');
const { User, Admin, sequelize } = require('../src/models');
const path = require('path');

async function setupAccounts() {
  try {
    console.log('🚀 Starting account setup...\n');

    // Test database connection
    console.log('📡 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');

    // Sync models
    console.log('📊 Syncing database models...');
    await sequelize.sync();
    console.log('✅ Models synced\n');

    const email = process.env.TEST_USER_EMAIL || 'demo@example.com';
    const userPassword = process.env.TEST_USER_PASSWORD || 'demoinitialpassword';
    const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'admininitialpassword';

    // Check if user exists
    console.log(`🔍 Checking for existing user account (${email})...`);
    let user = await User.findOne({ where: { email } });

    if (user) {
      console.log('✅ User account already exists');
      console.log(`   Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Credits: ${user.aiCredits}`);
      console.log(`   Trial Status: ${user.subscriptionStatus}`);
    } else {
      console.log(`📝 Creating user account for ${email}...`);

      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14);

      user = await User.create({
        id: uuidv4(),
        email,
        password: userPassword,
        name: 'Victor (Student)',
        age: 16,
        ageGroup: '16+',
        aiCredits: 3000,
        totalScore: 0,
        trialStartDate: new Date(),
        trialEndDate,
        subscriptionStatus: 'trial',
        isEmailVerified: true,
        isActive: true,
      });

      console.log('✅ User account created successfully');
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${userPassword}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Credits: ${user.aiCredits}`);
      console.log(`   Trial Ends: ${trialEndDate.toISOString().split('T')[0]}`);
    }

    console.log();

    // Check if admin exists
    console.log(`🔍 Checking for existing admin account (${email})...`);
    let admin = await Admin.findOne({ where: { email } });

    if (admin) {
      console.log('✅ Admin account already exists');
      console.log(`   Email: ${admin.email}`);
      console.log(`   ID: ${admin.id}`);
      console.log(`   Role: ${admin.role}`);
    } else {
      console.log(`📝 Creating admin account for ${email}...`);

      admin = await Admin.create({
        id: uuidv4(),
        email,
        password: adminPassword,
        name: 'Victor (Admin)',
        role: 'super_admin',
        isActive: true,
      });

      console.log('✅ Admin account created successfully');
      console.log(`   Email: ${admin.email}`);
      console.log(`   Password: ${adminPassword}`);
      console.log(`   ID: ${admin.id}`);
      console.log(`   Role: ${admin.role}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ Setup Complete!\n');
    console.log('📚 Accounts have been created with the following details:');
    console.log(`   User Email: ${email}`);
    console.log(`   Admin Email: ${email}`);
    console.log('⚠️  Passwords are auto-generated for security.');
    console.log('💡 Please change the default passwords after first login.');
    console.log('\n🔗 Login Endpoints:');
    console.log('   Student Login: POST /api/auth/login');
    console.log('   Admin Login: POST /api/auth/admin/login');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    if (error.original) {
      console.error('Database error:', error.original.message);
    }
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

setupAccounts();
