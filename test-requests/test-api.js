#!/usr/bin/env node

/**
 * API Testing Script for Q&A Article FAQ API
 * 
 * This script provides utilities to test the API endpoints with proper HMAC authentication.
 * 
 * Usage:
 *   node test-api.js ingest [file]
 *   node test-api.js revalidate [file]
 *   node test-api.js get-topic <slug>
 *   node test-api.js list-topics [options]
 * 
 * Environment Variables:
 *   API_URL - Base URL of the API (default: http://localhost:3000)
 *   INGEST_API_KEY - API key for authentication
 *   INGEST_WEBHOOK_SECRET - Secret for HMAC signature generation
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const API_KEY = process.env.INGEST_API_KEY || 'your-api-key-here';
const WEBHOOK_SECRET = process.env.INGEST_WEBHOOK_SECRET || 'your-webhook-secret-here';

/**
 * Generate HMAC-SHA256 signature for request authentication
 * @param {string} timestamp - Unix timestamp in milliseconds
 * @param {string} body - Raw request body
 * @returns {string} HMAC signature
 */
function generateSignature(timestamp, body) {
  const message = `${timestamp}.${body}`;
  return crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(message)
    .digest('hex');
}

/**
 * Make an authenticated POST request
 * @param {string} endpoint - API endpoint path
 * @param {object} payload - Request payload
 * @returns {Promise<object>} Response data
 */
async function authenticatedPost(endpoint, payload) {
  const timestamp = Date.now().toString();
  const body = JSON.stringify(payload);
  const signature = generateSignature(timestamp, body);

  const url = `${API_URL}${endpoint}`;
  
  console.log(`\n📤 POST ${url}`);
  console.log(`Headers:`);
  console.log(`  x-api-key: ${API_KEY}`);
  console.log(`  x-timestamp: ${timestamp}`);
  console.log(`  x-signature: ${signature}`);
  console.log(`Body: ${body.substring(0, 100)}${body.length > 100 ? '...' : ''}\n`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'x-timestamp': timestamp,
        'x-signature': signature,
      },
      body: body,
    });

    const responseData = await response.json();
    
    console.log(`📥 Response Status: ${response.status}`);
    console.log(`Response Body:`, JSON.stringify(responseData, null, 2));
    
    return { status: response.status, data: responseData };
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    throw error;
  }
}

/**
 * Make a GET request
 * @param {string} endpoint - API endpoint path with query params
 * @returns {Promise<object>} Response data
 */
async function get(endpoint) {
  const url = `${API_URL}${endpoint}`;
  
  console.log(`\n📤 GET ${url}\n`);

  try {
    const response = await fetch(url);
    const responseData = await response.json();
    
    console.log(`📥 Response Status: ${response.status}`);
    console.log(`Response Body:`, JSON.stringify(responseData, null, 2));
    
    return { status: response.status, data: responseData };
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    throw error;
  }
}

/**
 * Test POST /api/ingest endpoint
 * @param {string} filePath - Path to JSON payload file
 */
async function testIngest(filePath = 'ingest-example.json') {
  console.log(`\n🧪 Testing POST /api/ingest`);
  console.log(`Using payload from: ${filePath}`);
  
  const fullPath = path.join(__dirname, filePath);
  const payload = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  
  await authenticatedPost('/api/ingest', payload);
}

/**
 * Test POST /api/revalidate endpoint
 * @param {string} filePath - Path to JSON payload file
 */
async function testRevalidate(filePath = 'revalidate-example.json') {
  console.log(`\n🧪 Testing POST /api/revalidate`);
  console.log(`Using payload from: ${filePath}`);
  
  const fullPath = path.join(__dirname, filePath);
  const payload = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  
  await authenticatedPost('/api/revalidate', payload);
}

/**
 * Test GET /api/topics/[slug] endpoint
 * @param {string} slug - Topic slug
 */
async function testGetTopic(slug) {
  console.log(`\n🧪 Testing GET /api/topics/${slug}`);
  
  await get(`/api/topics/${slug}`);
}

/**
 * Test GET /api/topics endpoint
 * @param {object} options - Query parameters
 */
async function testListTopics(options = {}) {
  console.log(`\n🧪 Testing GET /api/topics`);
  
  const params = new URLSearchParams();
  if (options.locale) params.append('locale', options.locale);
  if (options.tag) params.append('tag', options.tag);
  if (options.page) params.append('page', options.page);
  if (options.limit) params.append('limit', options.limit);
  
  const queryString = params.toString();
  const endpoint = queryString ? `/api/topics?${queryString}` : '/api/topics';
  
  await get(endpoint);
}

/**
 * Display usage information
 */
function showHelp() {
  console.log(`
API Testing Script for Q&A Article FAQ API

Usage:
  node test-api.js <command> [options]

Commands:
  ingest [file]              Test POST /api/ingest
                             Default file: ingest-example.json
                             
  revalidate [file]          Test POST /api/revalidate
                             Default file: revalidate-example.json
                             
  get-topic <slug>           Test GET /api/topics/[slug]
                             Example: node test-api.js get-topic how-to-reset-password
                             
  list-topics [options]      Test GET /api/topics
                             Options: --locale=en --tag=security --page=1 --limit=20
                             Example: node test-api.js list-topics --locale=en --tag=security

Environment Variables:
  API_URL                    Base URL of the API (default: http://localhost:3000)
  INGEST_API_KEY            API key for authentication
  INGEST_WEBHOOK_SECRET     Secret for HMAC signature generation

Examples:
  # Test ingestion with default example
  node test-api.js ingest
  
  # Test ingestion with custom file
  node test-api.js ingest my-custom-payload.json
  
  # Test revalidation
  node test-api.js revalidate
  
  # Get a specific topic
  node test-api.js get-topic how-to-reset-password
  
  # List all topics
  node test-api.js list-topics
  
  # List topics with filters
  node test-api.js list-topics --locale=en --tag=authentication --page=1 --limit=10
`);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    return;
  }

  const command = args[0];

  try {
    switch (command) {
      case 'ingest':
        await testIngest(args[1]);
        break;
        
      case 'revalidate':
        await testRevalidate(args[1]);
        break;
        
      case 'get-topic':
        if (!args[1]) {
          console.error('❌ Error: slug is required for get-topic command');
          console.log('Usage: node test-api.js get-topic <slug>');
          process.exit(1);
        }
        await testGetTopic(args[1]);
        break;
        
      case 'list-topics': {
        const options = {};
        args.slice(1).forEach(arg => {
          const [key, value] = arg.replace('--', '').split('=');
          if (value) options[key] = value;
        });
        await testListTopics(options);
        break;
      }
        
      default:
        console.error(`❌ Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(`\n❌ Test failed:`, error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

// Export functions for use as module
module.exports = {
  generateSignature,
  authenticatedPost,
  get,
  testIngest,
  testRevalidate,
  testGetTopic,
  testListTopics,
};
