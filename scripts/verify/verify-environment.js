#!/usr/bin/env node

/**
 * Environment Variable Verification Script
 * 
 * Validates that all required environment variables are present and properly configured.
 * Run this before deployment to catch configuration issues.
 * 
 * Usage:
 *   node scripts/verify/verify-environment.js
 *   npm run verify:env
 */

const fs = require('fs');
const path = require('path');

// Load environment variables manually (without dotenv dependency)
const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key.trim()] = value.trim();
      }
    }
  });
}

const ENV_VARIABLES = [
  // Database
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL connection string',
    validator: (value) => value.startsWith('postgresql://'),
    validatorMessage: 'Must be a valid PostgreSQL connection string starting with postgresql://',
  },
  {
    name: 'TEST_DATABASE_URL',
    required: false,
    description: 'Test database connection string (optional)',
  },

  // API Security
  {
    name: 'INGEST_API_KEY',
    required: true,
    description: 'Static API key for webhook authentication',
    validator: (value) => value.length >= 32,
    validatorMessage: 'Should be at least 32 characters for security',
  },
  {
    name: 'INGEST_WEBHOOK_SECRET',
    required: true,
    description: 'Secret key for HMAC signature verification',
    validator: (value) => value.length >= 32,
    validatorMessage: 'Should be at least 32 characters for security',
  },

  // NextAuth
  {
    name: 'NEXTAUTH_SECRET',
    required: true,
    description: 'Secret key for NextAuth.js session encryption',
    validator: (value) => value.length >= 32,
    validatorMessage: 'Should be at least 32 characters for security',
  },
  {
    name: 'NEXTAUTH_URL',
    required: true,
    description: 'Canonical URL of the application',
    validator: (value) => value.startsWith('http://') || value.startsWith('https://'),
    validatorMessage: 'Must be a valid URL starting with http:// or https://',
  },

  // Admin Authentication
  {
    name: 'ADMIN_EMAIL',
    required: true,
    description: 'Default admin user email',
    validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    validatorMessage: 'Must be a valid email address',
  },
  {
    name: 'ADMIN_PASSWORD',
    required: true,
    description: 'Default admin user password',
    validator: (value) => value.length >= 8,
    validatorMessage: 'Should be at least 8 characters for security',
  },

  // Application
  {
    name: 'NEXT_PUBLIC_API_URL',
    required: true,
    description: 'Base URL for API calls',
    validator: (value) => value.startsWith('http://') || value.startsWith('https://'),
    validatorMessage: 'Must be a valid URL starting with http:// or https://',
  },
];

function validateEnvironment() {
  console.log('🔍 Validating Environment Variables...\n');

  const errors = [];
  const warnings = [];
  const info = [];

  // Check if .env file exists
  const envPath = path.join(__dirname, '../../.env');
  if (!fs.existsSync(envPath)) {
    errors.push('.env file not found. Copy .env.example to .env and configure it.');
  }

  // Validate each variable
  for (const envVar of ENV_VARIABLES) {
    const value = process.env[envVar.name];

    // Check if required variable is missing
    if (envVar.required && !value) {
      errors.push(`❌ Missing required: ${envVar.name}`);
      console.log(`   Description: ${envVar.description}`);
      continue;
    }

    // Skip validation if optional and not set
    if (!envVar.required && !value) {
      info.push(`ℹ️  Optional not set: ${envVar.name}`);
      continue;
    }

    // Run custom validator if present
    if (value && envVar.validator && !envVar.validator(value)) {
      const message = envVar.validatorMessage || 'Invalid format';
      errors.push(`❌ Invalid ${envVar.name}: ${message}`);
      continue;
    }

    // Variable is valid
    console.log(`✅ ${envVar.name}: Set and valid`);
  }

  console.log('');

  // Security warnings
  const nodeEnv = process.env.NODE_ENV || 'development';
  console.log(`Environment: ${nodeEnv}\n`);

  if (nodeEnv === 'production') {
    // Warn about default/weak passwords
    if (process.env.ADMIN_PASSWORD === 'admin123') {
      warnings.push('⚠️  Using default admin password. Change immediately!');
    }

    // Warn about HTTP in production
    if (process.env.NEXTAUTH_URL?.startsWith('http://')) {
      warnings.push('⚠️  NEXTAUTH_URL uses HTTP. Use HTTPS in production!');
    }

    if (process.env.NEXT_PUBLIC_API_URL?.startsWith('http://')) {
      warnings.push('⚠️  NEXT_PUBLIC_API_URL uses HTTP. Use HTTPS in production!');
    }

    // Warn about short secrets
    const secrets = ['INGEST_API_KEY', 'INGEST_WEBHOOK_SECRET', 'NEXTAUTH_SECRET'];
    for (const secret of secrets) {
      const value = process.env[secret];
      if (value && value.length < 32) {
        warnings.push(`⚠️  ${secret} is shorter than recommended 32 characters`);
      }
    }
  }

  // Display warnings
  if (warnings.length > 0) {
    console.log('⚠️  Warnings:');
    warnings.forEach((warning) => console.log(`   ${warning}`));
    console.log('');
  }

  // Display info
  if (info.length > 0) {
    console.log('ℹ️  Information:');
    info.forEach((item) => console.log(`   ${item}`));
    console.log('');
  }

  // Display errors
  if (errors.length > 0) {
    console.log('❌ Errors:');
    errors.forEach((error) => console.log(`   ${error}`));
    console.log('');
    console.log('Please check your .env file and ensure all required variables are set.');
    console.log('See .env.example for reference.\n');
    process.exit(1);
  }

  console.log('✅ All environment variables are valid!\n');

  // Display helpful tips
  console.log('💡 Tips:');
  console.log('   - Generate secrets: openssl rand -base64 32');
  console.log('   - Test database connection: npx prisma db pull');
  console.log('   - View all variables: cat .env');
  console.log('');
}

// Run validation
try {
  validateEnvironment();
} catch (error) {
  console.error('Error during validation:', error.message);
  process.exit(1);
}
