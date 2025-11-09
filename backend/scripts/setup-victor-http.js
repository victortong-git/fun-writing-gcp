#!/usr/bin/env node

/**
 * Setup script to create user and admin accounts via HTTP requests
 * Run with: node scripts/setup-victor-http.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3088';

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data),
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function setupAccounts() {
  console.log('🚀 Setting up accounts via API...\n');

  try {
    // Setup test user
    console.log('📝 Creating student account...');
    const userRes = await makeRequest('POST', '/api/auth/setup-test-user');

    if (userRes.status === 200 || userRes.status === 201) {
      console.log('✅ Student account created/verified');
      if (userRes.data.user) {
        console.log(`   Email: ${userRes.data.user.email}`);
        console.log(`   Credits: ${userRes.data.user.aiCredits}`);
        console.log(`   Status: ${userRes.data.user.subscriptionStatus}`);
      }
      if (userRes.data.credentials) {
        console.log(`   Password: ${userRes.data.credentials.password}`);
      }
    } else {
      console.error('❌ Failed to create student account:', userRes.data);
    }

    console.log();

    // Setup test admin
    console.log('📝 Creating admin account...');
    const adminRes = await makeRequest('POST', '/api/auth/setup-test-admin');

    if (adminRes.status === 200 || adminRes.status === 201) {
      console.log('✅ Admin account created/verified');
      if (adminRes.data.admin) {
        console.log(`   Email: ${adminRes.data.admin.email}`);
        console.log(`   Role: ${adminRes.data.admin.role}`);
      }
      if (adminRes.data.credentials) {
        console.log(`   Password: ${adminRes.data.credentials.password}`);
      }
    } else {
      console.error('❌ Failed to create admin account:', adminRes.data);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ Setup Complete!\n');
    console.log('📚 Accounts have been created. Check credentials in response above.');
    console.log('\n🔗 Login Endpoints:');
    console.log('   Student Login: POST /api/auth/login');
    console.log('   Admin Login: POST /api/auth/admin/login');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupAccounts();
