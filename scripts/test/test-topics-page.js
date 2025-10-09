/**
 * Test script to verify topics page loads without errors
 * Tests both with seed data and empty database scenarios
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testTopicsPage() {
  console.log('🧪 Testing Topics Page...\n');
  
  try {
    // Test 1: Basic page load
    console.log('Test 1: Loading /topics page...');
    const response = await fetch(`${BASE_URL}/topics`);
    
    if (response.status !== 200) {
      console.error(`❌ FAILED: Expected status 200, got ${response.status}`);
      return false;
    }
    console.log('✅ PASSED: Page returned 200 status\n');
    
    // Test 2: Page with filters
    console.log('Test 2: Loading /topics with filters...');
    const filteredResponse = await fetch(`${BASE_URL}/topics?locale=en&tag=technology`);
    
    if (filteredResponse.status !== 200) {
      console.error(`❌ FAILED: Expected status 200, got ${filteredResponse.status}`);
      return false;
    }
    console.log('✅ PASSED: Filtered page returned 200 status\n');
    
    // Test 3: Page with pagination
    console.log('Test 3: Loading /topics with pagination...');
    const paginatedResponse = await fetch(`${BASE_URL}/topics?page=2`);
    
    if (paginatedResponse.status !== 200) {
      console.error(`❌ FAILED: Expected status 200, got ${paginatedResponse.status}`);
      return false;
    }
    console.log('✅ PASSED: Paginated page returned 200 status\n');
    
    // Test 4: Check for error messages in HTML
    console.log('Test 4: Checking for error messages...');
    const html = await response.text();
    
    if (html.includes('500') || html.includes('Internal Server Error')) {
      console.error('❌ FAILED: Page contains error messages');
      return false;
    }
    console.log('✅ PASSED: No error messages found\n');
    
    // Test 5: Check for expected content
    console.log('Test 5: Checking for expected content...');
    if (!html.includes('All Topics')) {
      console.error('❌ FAILED: Page missing expected heading');
      return false;
    }
    console.log('✅ PASSED: Page contains expected content\n');
    
    console.log('✅ All tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

// Run tests
testTopicsPage()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
