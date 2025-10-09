/**
 * Script to test cache revalidation flow
 * Requirements: 10.2, 10.7
 * 
 * This script simulates the cache revalidation process
 * Note: Requires the server to be running
 */

const crypto = require('crypto');

// Configuration
const API_KEY = process.env.NEXT_PUBLIC_INGEST_API_KEY || 'test-api-key';
const WEBHOOK_SECRET = process.env.NEXT_PUBLIC_INGEST_WEBHOOK_SECRET || 'test-webhook-secret';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/**
 * Generate HMAC signature for authentication
 */
function generateSignature(timestamp, body) {
  const message = `${timestamp}.${JSON.stringify(body)}`;
  return crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(message)
    .digest('hex');
}

/**
 * Test revalidation endpoint
 */
async function testRevalidation(tag) {
  console.log(`\n🔄 Testing revalidation for tag: ${tag}`);
  
  const timestamp = Date.now().toString();
  const body = { tag };
  const signature = generateSignature(timestamp, body);
  
  try {
    const response = await fetch(`${BASE_URL}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'x-timestamp': timestamp,
        'x-signature': signature,
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`  ✓ Revalidation successful`);
      console.log(`  Response:`, data);
      return true;
    } else {
      console.log(`  ✗ Revalidation failed`);
      console.log(`  Status: ${response.status}`);
      console.log(`  Error:`, data);
      return false;
    }
  } catch (error) {
    console.log(`  ✗ Request failed`);
    console.log(`  Error: ${error.message}`);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🧪 Cache Revalidation Test Suite\n');
  console.log('Configuration:');
  console.log(`  Base URL: ${BASE_URL}`);
  console.log(`  API Key: ${API_KEY.substring(0, 10)}...`);
  console.log(`  Webhook Secret: ${WEBHOOK_SECRET.substring(0, 10)}...`);
  
  // Check if server is running
  console.log('\n📡 Checking if server is running...');
  try {
    const response = await fetch(BASE_URL);
    if (response.ok) {
      console.log('  ✓ Server is running');
    } else {
      console.log('  ⚠️  Server returned non-200 status');
    }
  } catch (error) {
    console.log('  ✗ Server is not running');
    console.log('  Please start the server with: npm run dev');
    process.exit(1);
  }
  
  // Test 1: Revalidate 'topics' tag
  const test1 = await testRevalidation('topics');
  
  // Test 2: Revalidate specific topic
  const test2 = await testRevalidation('topic:example-slug');
  
  // Test 3: Invalid signature (should fail)
  console.log('\n🔒 Testing security (invalid signature)');
  try {
    const timestamp = Date.now().toString();
    const body = { tag: 'topics' };
    const invalidSignature = 'invalid-signature';
    
    const response = await fetch(`${BASE_URL}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'x-timestamp': timestamp,
        'x-signature': invalidSignature,
      },
      body: JSON.stringify(body),
    });
    
    if (response.status === 401) {
      console.log('  ✓ Security validation working (rejected invalid signature)');
    } else {
      console.log('  ✗ Security validation failed (accepted invalid signature)');
    }
  } catch (error) {
    console.log('  ✗ Security test failed:', error.message);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  if (test1 && test2) {
    console.log('✅ All cache revalidation tests passed!\n');
    console.log('Cache revalidation is working correctly.');
    console.log('\nTo verify cache behavior:');
    console.log('1. Visit a topic page in your browser');
    console.log('2. Edit the topic in the admin dashboard');
    console.log('3. Refresh the topic page - you should see the updates');
  } else {
    console.log('❌ Some cache revalidation tests failed\n');
    console.log('Please check:');
    console.log('1. Server is running (npm run dev)');
    console.log('2. Environment variables are set correctly');
    console.log('3. API key and webhook secret match');
  }
}

// Run tests
runTests().catch(console.error);
