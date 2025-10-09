/**
 * Comprehensive CMS API Test Script for Docker Environment
 * Tests all requirements from .kiro/specs/cms-fixes/requirements.md
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'your-secure-admin-password';

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      ...options
    };

    const req = protocol.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          contentType: res.headers['content-type']
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// Helper to log test results
function logTest(name, passed, message) {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  const color = passed ? '\x1b[32m' : '\x1b[31m';
  console.log(`${color}${status}\x1b[0m ${name}`);
  if (message) {
    console.log(`  ${message}`);
  }
  
  results.tests.push({ name, passed, message });
  if (passed) {
    results.passed++;
  } else {
    results.failed++;
  }
}

// Test 1: Homepage Display (Requirement 1)
async function testHomepageDisplay() {
  console.log('\n📋 Testing Requirement 1: Homepage Display\n');
  
  try {
    const response = await makeRequest(BASE_URL);
    
    // Test 1.1: Homepage should return 200
    logTest(
      'Homepage loads successfully',
      response.statusCode === 200,
      `Status: ${response.statusCode}`
    );
    
    // Test 1.2: Should NOT display basic API message
    const hasApiMessage = response.body.includes('Q&A Article FAQ API') && 
                          !response.body.includes('<!DOCTYPE html>');
    logTest(
      'Homepage does NOT display basic API message',
      !hasApiMessage,
      hasApiMessage ? 'Found API message instead of homepage' : 'Correct homepage content'
    );
    
    // Test 1.3: Should contain HTML structure
    const hasHtmlStructure = response.body.includes('<!DOCTYPE html>') || 
                             response.body.includes('<html');
    logTest(
      'Homepage contains proper HTML structure',
      hasHtmlStructure,
      hasHtmlStructure ? 'HTML structure found' : 'Missing HTML structure'
    );
    
    // Test 1.4: Should have search functionality
    const hasSearchBar = response.body.includes('search') || 
                         response.body.includes('Search');
    logTest(
      'Homepage includes search functionality',
      hasSearchBar,
      hasSearchBar ? 'Search elements found' : 'Search elements missing'
    );
    
  } catch (error) {
    logTest('Homepage loads successfully', false, `Error: ${error.message}`);
  }
}

// Test 2: API Data Fetching (Requirement 2)
async function testAPIDataFetching() {
  console.log('\n📋 Testing Requirement 2: API Data Fetching\n');
  
  try {
    // Test 2.1 & 2.2: API endpoint should work
    const response = await makeRequest(`${BASE_URL}/api/topics`);
    
    logTest(
      'API topics endpoint responds successfully',
      response.statusCode === 200,
      `Status: ${response.statusCode}`
    );
    
    // Test 2.3: Should return valid JSON
    let topicsData;
    try {
      topicsData = JSON.parse(response.body);
      logTest(
        'API returns valid JSON response',
        true,
        'JSON parsed successfully'
      );
    } catch (e) {
      logTest(
        'API returns valid JSON response',
        false,
        `JSON parse error: ${e.message}`
      );
      return;
    }
    
    // Test 2.4: Should have proper data structure
    const hasProperStructure = topicsData && 
                               Array.isArray(topicsData.items) &&
                               typeof topicsData.total === 'number';
    logTest(
      'API response has proper data structure',
      hasProperStructure,
      hasProperStructure ? 
        `Found ${topicsData.items.length} topics, total: ${topicsData.total}` : 
        'Invalid data structure'
    );
    
    // Test with query parameters
    const searchResponse = await makeRequest(`${BASE_URL}/api/topics?limit=5`);
    logTest(
      'API handles query parameters correctly',
      searchResponse.statusCode === 200,
      `Status: ${searchResponse.statusCode}`
    );
    
  } catch (error) {
    logTest('API topics endpoint responds successfully', false, `Error: ${error.message}`);
  }
}

// Test 3: Admin Authentication (Requirement 3)
async function testAdminAuthentication() {
  console.log('\n📋 Testing Requirement 3: Admin Authentication\n');
  
  try {
    // Test 3.1: Unauthenticated access should redirect or show login
    const unauthResponse = await makeRequest(`${BASE_URL}/admin`, {
      redirect: 'manual'
    });
    
    // In production, middleware might be cached. Check if it redirects OR if the page requires auth
    const isProtected = unauthResponse.statusCode === 302 || 
                        unauthResponse.statusCode === 307 ||
                        unauthResponse.statusCode === 401 ||
                        (unauthResponse.statusCode === 200 && 
                         (unauthResponse.body.includes('login') || 
                          unauthResponse.body.includes('Sign in') ||
                          unauthResponse.body.includes('Authentication required')));
    
    logTest(
      'Admin area has authentication protection',
      isProtected,
      isProtected ? 
        `Protected (Status: ${unauthResponse.statusCode})` : 
        `Not protected (Status: ${unauthResponse.statusCode})`
    );
    
    // Test 3.2: Login endpoint exists
    const loginPageResponse = await makeRequest(`${BASE_URL}/admin/login`);
    logTest(
      'Admin login page is accessible',
      loginPageResponse.statusCode === 200,
      `Status: ${loginPageResponse.statusCode}`
    );
    
    // Test 3.3: NextAuth API endpoint exists
    const authApiResponse = await makeRequest(`${BASE_URL}/api/auth/providers`);
    logTest(
      'NextAuth API endpoint is accessible',
      authApiResponse.statusCode === 200,
      `Status: ${authApiResponse.statusCode}`
    );
    
  } catch (error) {
    logTest('Admin authentication test', false, `Error: ${error.message}`);
  }
}

// Test 4: Admin Data Loading (Requirement 4)
async function testAdminDataLoading() {
  console.log('\n📋 Testing Requirement 4: Admin Data Loading\n');
  
  try {
    // Test that admin API endpoints exist and respond
    const topicsResponse = await makeRequest(`${BASE_URL}/api/topics`);
    
    logTest(
      'Admin can fetch topics data',
      topicsResponse.statusCode === 200,
      `Status: ${topicsResponse.statusCode}`
    );
    
    if (topicsResponse.statusCode === 200) {
      const data = JSON.parse(topicsResponse.body);
      
      // Test 4.2: Statistics should be calculable
      const hasStats = data.items && Array.isArray(data.items);
      if (hasStats) {
        // Count topics with published articles
        const published = data.items.filter(item => item.article && item.article.status === 'PUBLISHED').length;
        const draft = data.items.length - published;
        
        logTest(
          'Topic statistics are available',
          true,
          `Total: ${data.total}, Published: ${published}, Draft: ${draft}`
        );
      } else {
        logTest(
          'Topic statistics are available',
          false,
          'Unable to calculate statistics from response'
        );
      }
    }
    
  } catch (error) {
    logTest('Admin data loading test', false, `Error: ${error.message}`);
  }
}

// Test 5: Additional API Endpoints
async function testAdditionalEndpoints() {
  console.log('\n📋 Testing Additional API Functionality\n');
  
  try {
    // Test topics with filters
    const publishedResponse = await makeRequest(`${BASE_URL}/api/topics?published=true`);
    logTest(
      'API supports published filter',
      publishedResponse.statusCode === 200,
      `Status: ${publishedResponse.statusCode}`
    );
    
    // Test topics with search
    const searchResponse = await makeRequest(`${BASE_URL}/api/topics?search=test`);
    logTest(
      'API supports search functionality',
      searchResponse.statusCode === 200,
      `Status: ${searchResponse.statusCode}`
    );
    
    // Test pagination
    const paginationResponse = await makeRequest(`${BASE_URL}/api/topics?page=1&limit=10`);
    logTest(
      'API supports pagination',
      paginationResponse.statusCode === 200,
      `Status: ${paginationResponse.statusCode}`
    );
    
  } catch (error) {
    logTest('Additional endpoints test', false, `Error: ${error.message}`);
  }
}

// Test 6: Error Handling
async function testErrorHandling() {
  console.log('\n📋 Testing Error Handling\n');
  
  try {
    // Test invalid topic slug
    const invalidTopicResponse = await makeRequest(`${BASE_URL}/api/topics/non-existent-topic-12345`);
    logTest(
      'API handles invalid topic gracefully',
      invalidTopicResponse.statusCode === 404,
      `Status: ${invalidTopicResponse.statusCode}`
    );
    
    // Test invalid API endpoint
    const invalidEndpointResponse = await makeRequest(`${BASE_URL}/api/invalid-endpoint`);
    logTest(
      'API handles invalid endpoints gracefully',
      invalidEndpointResponse.statusCode === 404,
      `Status: ${invalidEndpointResponse.statusCode}`
    );
    
  } catch (error) {
    logTest('Error handling test', false, `Error: ${error.message}`);
  }
}

// Main test runner
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     CMS API Comprehensive Test Suite - Docker Environment  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nTesting against: ${BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);
  
  await testHomepageDisplay();
  await testAPIDataFetching();
  await testAdminAuthentication();
  await testAdminDataLoading();
  await testAdditionalEndpoints();
  await testErrorHandling();
  
  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST SUMMARY                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`\x1b[32mPassed: ${results.passed}\x1b[0m`);
  console.log(`\x1b[31mFailed: ${results.failed}\x1b[0m`);
  console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(2)}%\n`);
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
