/**
 * Test script to verify homepage functionality
 * Tests: Homepage display, API fetching, and data loading
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function testHomepage() {
  console.log('🧪 Testing Homepage Display\n');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Homepage loads
    console.log('\n✓ Test 1: Homepage loads at root URL');
    const homeResponse = await makeRequest('/');
    
    if (homeResponse.statusCode !== 200) {
      console.error(`❌ FAIL: Expected status 200, got ${homeResponse.statusCode}`);
      return false;
    }
    console.log(`  ✓ Status: ${homeResponse.statusCode}`);
    
    // Test 2: Verify homepage content
    console.log('\n✓ Test 2: Verify homepage content');
    const hasHero = homeResponse.body.includes('Welcome to Q&A CMS');
    const hasSearchBar = homeResponse.body.includes('Search for topics');
    const hasFeaturedSection = homeResponse.body.includes('Featured Topics') || homeResponse.body.includes('No topics available yet');
    
    if (!hasHero) {
      console.error('  ❌ FAIL: Hero section not found');
      return false;
    }
    console.log('  ✓ Hero section present');
    
    if (!hasSearchBar) {
      console.error('  ❌ FAIL: Search bar not found');
      return false;
    }
    console.log('  ✓ Search bar present');
    
    if (!hasFeaturedSection) {
      console.error('  ❌ FAIL: Featured topics section not found');
      return false;
    }
    console.log('  ✓ Featured topics section present');
    
    // Test 3: API endpoint works
    console.log('\n✓ Test 3: API endpoint responds');
    const apiResponse = await makeRequest('/api/topics?limit=6');
    
    if (apiResponse.statusCode !== 200) {
      console.error(`  ❌ FAIL: API returned status ${apiResponse.statusCode}`);
      console.error(`  Response: ${apiResponse.body}`);
      return false;
    }
    console.log(`  ✓ API Status: ${apiResponse.statusCode}`);
    
    const apiData = JSON.parse(apiResponse.body);
    console.log(`  ✓ Topics found: ${apiData.items?.length || 0}`);
    console.log(`  ✓ Total topics: ${apiData.pagination?.total || 0}`);
    
    // Test 4: Check for old conflicting page
    console.log('\n✓ Test 4: Verify old API message is not displayed');
    const hasOldContent = homeResponse.body.includes('Q&A Article FAQ API');
    
    if (hasOldContent) {
      console.error('  ❌ FAIL: Old API message still present');
      return false;
    }
    console.log('  ✓ Old API message not present');
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests passed!');
    console.log('\nHomepage is working correctly:');
    console.log('  • Hero section displays');
    console.log('  • Search bar is present');
    console.log('  • Featured topics section renders');
    console.log('  • API fetching works');
    console.log('  • No conflicting content');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Make sure the development server is running:');
      console.error('   npm run dev');
    }
    
    return false;
  }
}

// Run tests
testHomepage().then(success => {
  process.exit(success ? 0 : 1);
});
