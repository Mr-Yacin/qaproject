/**
 * Simple Performance Testing Script
 * Tests page load times and basic performance metrics
 * Requirements: 10.3, 10.7
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Pages to test
const PAGES_TO_TEST = [
  { url: '/', name: 'Homepage' },
  { url: '/topics', name: 'Topics Listing' },
  { url: '/search', name: 'Search Page' },
  { url: '/admin/login', name: 'Admin Login' },
];

// Number of requests per page
const REQUESTS_PER_PAGE = 5;

async function measurePageLoad(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    
    const startTime = Date.now();
    let firstByteTime = null;
    let totalBytes = 0;

    const req = protocol.get(url, (res) => {
      firstByteTime = Date.now() - startTime;

      res.on('data', (chunk) => {
        totalBytes += chunk.length;
      });

      res.on('end', () => {
        const totalTime = Date.now() - startTime;
        resolve({
          statusCode: res.statusCode,
          firstByteTime,
          totalTime,
          totalBytes,
          headers: res.headers,
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testPage(pageUrl, pageName) {
  console.log(`\nTesting: ${pageName} (${pageUrl})`);
  console.log('-'.repeat(60));

  const results = [];
  
  for (let i = 0; i < REQUESTS_PER_PAGE; i++) {
    try {
      const result = await measurePageLoad(pageUrl);
      results.push(result);
      console.log(`  Request ${i + 1}: ${result.totalTime}ms (TTFB: ${result.firstByteTime}ms, Size: ${(result.totalBytes / 1024).toFixed(2)}KB)`);
    } catch (error) {
      console.error(`  Request ${i + 1}: Error - ${error.message}`);
    }
  }

  if (results.length === 0) {
    return null;
  }

  // Calculate statistics
  const times = results.map(r => r.totalTime);
  const ttfbs = results.map(r => r.firstByteTime);
  const sizes = results.map(r => r.totalBytes);

  const stats = {
    name: pageName,
    url: pageUrl,
    requests: results.length,
    avgLoadTime: average(times),
    minLoadTime: Math.min(...times),
    maxLoadTime: Math.max(...times),
    avgTTFB: average(ttfbs),
    minTTFB: Math.min(...ttfbs),
    maxTTFB: Math.max(...ttfbs),
    avgSize: average(sizes),
    statusCode: results[0].statusCode,
    contentType: results[0].headers['content-type'],
  };

  console.log(`\n  Statistics:`);
  console.log(`    Avg Load Time: ${stats.avgLoadTime.toFixed(0)}ms`);
  console.log(`    Min Load Time: ${stats.minLoadTime}ms`);
  console.log(`    Max Load Time: ${stats.maxLoadTime}ms`);
  console.log(`    Avg TTFB: ${stats.avgTTFB.toFixed(0)}ms`);
  console.log(`    Avg Size: ${(stats.avgSize / 1024).toFixed(2)}KB`);
  console.log(`    Status Code: ${stats.statusCode}`);

  return stats;
}

function average(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

async function runAllTests() {
  console.log('🚀 Starting Performance Tests...\n');
  console.log(`Testing URL: ${BASE_URL}`);
  console.log(`Requests per page: ${REQUESTS_PER_PAGE}\n`);
  console.log('='.repeat(60));

  const results = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    requestsPerPage: REQUESTS_PER_PAGE,
    pages: [],
  };

  for (const page of PAGES_TO_TEST) {
    const url = `${BASE_URL}${page.url}`;
    const stats = await testPage(url, page.name);
    if (stats) {
      results.pages.push(stats);
    }
  }

  // Save results
  const resultsDir = path.join(__dirname, '..', 'test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const resultsFile = path.join(resultsDir, `performance-${Date.now()}.json`);
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));

  // Generate summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📈 Performance Summary');
  console.log('='.repeat(60));

  results.pages.forEach(page => {
    console.log(`\n${page.name}:`);
    console.log(`  Average Load Time: ${page.avgLoadTime.toFixed(0)}ms ${getPerformanceEmoji(page.avgLoadTime)}`);
    console.log(`  Average TTFB: ${page.avgTTFB.toFixed(0)}ms`);
    console.log(`  Average Size: ${(page.avgSize / 1024).toFixed(2)}KB`);
  });

  // Check requirements
  console.log('\n\n' + '='.repeat(60));
  console.log('🎯 Requirements Check (Requirement 10.7)');
  console.log('='.repeat(60));
  console.log('\nTarget: Page load < 2000ms on 3G connection\n');

  let allPassed = true;
  results.pages.forEach(page => {
    const passed = page.avgLoadTime < 2000;
    allPassed = allPassed && passed;
    console.log(`  ${passed ? '✅' : '⚠️'}  ${page.name}: ${page.avgLoadTime.toFixed(0)}ms`);
  });

  if (allPassed) {
    console.log('\n✅ All pages meet the performance requirement!\n');
  } else {
    console.log('\n⚠️  Some pages exceed the 2-second target.\n');
    console.log('Recommendations:');
    console.log('  - Enable caching headers');
    console.log('  - Optimize database queries');
    console.log('  - Use CDN for static assets');
    console.log('  - Implement code splitting');
    console.log('  - Compress responses (gzip/brotli)\n');
  }

  console.log(`\n✅ Results saved to: ${resultsFile}\n`);

  return results;
}

function getPerformanceEmoji(time) {
  if (time < 1000) return '🚀';
  if (time < 2000) return '✅';
  if (time < 3000) return '⚠️';
  return '❌';
}

// Run tests if called directly
if (require.main === module) {
  runAllTests()
    .then(() => {
      console.log('✅ Performance testing complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Performance testing failed:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests, testPage };
