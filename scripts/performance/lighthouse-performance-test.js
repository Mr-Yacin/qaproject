/**
 * Lighthouse Performance Testing Script
 * Tests performance, accessibility, best practices, and SEO scores
 * Requirements: 10.3, 10.7
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Pages to test
const PAGES_TO_TEST = [
  { url: '/', name: 'Homepage' },
  { url: '/topics', name: 'Topics Listing' },
  // Add a real topic slug here after creating test data
  // { url: '/topics/test-topic', name: 'Topic Detail' },
  { url: '/search', name: 'Search Page' },
];

// Lighthouse configuration
const lighthouseConfig = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    formFactor: 'desktop',
    throttling: {
      rttMs: 40,
      throughputKbps: 10 * 1024,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
  },
};

// Mobile configuration
const mobileConfig = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    formFactor: 'mobile',
    throttling: {
      rttMs: 150,
      throughputKbps: 1.6 * 1024,
      cpuSlowdownMultiplier: 4,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
    screenEmulation: {
      mobile: true,
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      disabled: false,
    },
  },
};

async function runLighthouse(url, config, name) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = {
    logLevel: 'info',
    output: 'json',
    port: chrome.port,
  };

  try {
    const runnerResult = await lighthouse(url, options, config);
    await chrome.kill();

    const { lhr } = runnerResult;
    
    return {
      name,
      url,
      scores: {
        performance: Math.round(lhr.categories.performance.score * 100),
        accessibility: Math.round(lhr.categories.accessibility.score * 100),
        bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
        seo: Math.round(lhr.categories.seo.score * 100),
      },
      metrics: {
        firstContentfulPaint: lhr.audits['first-contentful-paint'].numericValue,
        largestContentfulPaint: lhr.audits['largest-contentful-paint'].numericValue,
        totalBlockingTime: lhr.audits['total-blocking-time'].numericValue,
        cumulativeLayoutShift: lhr.audits['cumulative-layout-shift'].numericValue,
        speedIndex: lhr.audits['speed-index'].numericValue,
        timeToInteractive: lhr.audits['interactive'].numericValue,
      },
      fullReport: lhr,
    };
  } catch (error) {
    await chrome.kill();
    throw error;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Lighthouse Performance Tests...\n');
  console.log(`Testing URL: ${BASE_URL}\n`);

  const results = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    desktop: [],
    mobile: [],
  };

  // Test desktop
  console.log('📊 Running Desktop Tests...\n');
  for (const page of PAGES_TO_TEST) {
    const url = `${BASE_URL}${page.url}`;
    console.log(`Testing: ${page.name} (${url})`);
    
    try {
      const result = await runLighthouse(url, lighthouseConfig, page.name);
      results.desktop.push(result);
      
      console.log(`  Performance: ${result.scores.performance}/100`);
      console.log(`  Accessibility: ${result.scores.accessibility}/100`);
      console.log(`  Best Practices: ${result.scores.bestPractices}/100`);
      console.log(`  SEO: ${result.scores.seo}/100\n`);
    } catch (error) {
      console.error(`  ❌ Error testing ${page.name}:`, error.message);
      console.log('');
    }
  }

  // Test mobile
  console.log('📱 Running Mobile Tests...\n');
  for (const page of PAGES_TO_TEST) {
    const url = `${BASE_URL}${page.url}`;
    console.log(`Testing: ${page.name} (${url})`);
    
    try {
      const result = await runLighthouse(url, mobileConfig, page.name);
      results.mobile.push(result);
      
      console.log(`  Performance: ${result.scores.performance}/100`);
      console.log(`  Accessibility: ${result.scores.accessibility}/100`);
      console.log(`  Best Practices: ${result.scores.bestPractices}/100`);
      console.log(`  SEO: ${result.scores.seo}/100\n`);
    } catch (error) {
      console.error(`  ❌ Error testing ${page.name}:`, error.message);
      console.log('');
    }
  }

  // Save results
  const resultsDir = path.join(__dirname, '..', 'test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const resultsFile = path.join(resultsDir, `lighthouse-${Date.now()}.json`);
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\n✅ Results saved to: ${resultsFile}\n`);

  // Generate summary
  generateSummary(results);

  // Check if performance meets requirements
  checkRequirements(results);

  return results;
}

function generateSummary(results) {
  console.log('📈 Performance Summary\n');
  console.log('='.repeat(80));
  console.log('\nDesktop Results:');
  console.log('-'.repeat(80));
  
  results.desktop.forEach(result => {
    console.log(`\n${result.name}:`);
    console.log(`  Performance:     ${result.scores.performance}/100 ${getScoreEmoji(result.scores.performance)}`);
    console.log(`  Accessibility:   ${result.scores.accessibility}/100 ${getScoreEmoji(result.scores.accessibility)}`);
    console.log(`  Best Practices:  ${result.scores.bestPractices}/100 ${getScoreEmoji(result.scores.bestPractices)}`);
    console.log(`  SEO:             ${result.scores.seo}/100 ${getScoreEmoji(result.scores.seo)}`);
    console.log(`\n  Core Web Vitals:`);
    console.log(`    FCP: ${(result.metrics.firstContentfulPaint / 1000).toFixed(2)}s`);
    console.log(`    LCP: ${(result.metrics.largestContentfulPaint / 1000).toFixed(2)}s`);
    console.log(`    TBT: ${result.metrics.totalBlockingTime.toFixed(0)}ms`);
    console.log(`    CLS: ${result.metrics.cumulativeLayoutShift.toFixed(3)}`);
  });

  console.log('\n\nMobile Results:');
  console.log('-'.repeat(80));
  
  results.mobile.forEach(result => {
    console.log(`\n${result.name}:`);
    console.log(`  Performance:     ${result.scores.performance}/100 ${getScoreEmoji(result.scores.performance)}`);
    console.log(`  Accessibility:   ${result.scores.accessibility}/100 ${getScoreEmoji(result.scores.accessibility)}`);
    console.log(`  Best Practices:  ${result.scores.bestPractices}/100 ${getScoreEmoji(result.scores.bestPractices)}`);
    console.log(`  SEO:             ${result.scores.seo}/100 ${getScoreEmoji(result.scores.seo)}`);
    console.log(`\n  Core Web Vitals:`);
    console.log(`    FCP: ${(result.metrics.firstContentfulPaint / 1000).toFixed(2)}s`);
    console.log(`    LCP: ${(result.metrics.largestContentfulPaint / 1000).toFixed(2)}s`);
    console.log(`    TBT: ${result.metrics.totalBlockingTime.toFixed(0)}ms`);
    console.log(`    CLS: ${result.metrics.cumulativeLayoutShift.toFixed(3)}`);
  });

  console.log('\n' + '='.repeat(80) + '\n');
}

function getScoreEmoji(score) {
  if (score >= 90) return '✅';
  if (score >= 50) return '⚠️';
  return '❌';
}

function checkRequirements(results) {
  console.log('🎯 Requirements Check (Requirement 10.3, 10.7)\n');
  console.log('Target: Performance score >= 90\n');

  let allPassed = true;

  console.log('Desktop Performance:');
  results.desktop.forEach(result => {
    const passed = result.scores.performance >= 90;
    allPassed = allPassed && passed;
    console.log(`  ${passed ? '✅' : '❌'} ${result.name}: ${result.scores.performance}/100`);
  });

  console.log('\nMobile Performance:');
  results.mobile.forEach(result => {
    const passed = result.scores.performance >= 90;
    allPassed = allPassed && passed;
    console.log(`  ${passed ? '✅' : '❌'} ${result.name}: ${result.scores.performance}/100`);
  });

  console.log('\n' + '='.repeat(80));
  if (allPassed) {
    console.log('\n✅ All pages meet the performance requirement (>= 90)!\n');
  } else {
    console.log('\n⚠️  Some pages do not meet the performance requirement.\n');
    console.log('Consider optimizing:');
    console.log('  - Image sizes and formats');
    console.log('  - JavaScript bundle size');
    console.log('  - CSS optimization');
    console.log('  - Server response times');
    console.log('  - Caching strategies\n');
  }
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

module.exports = { runAllTests, runLighthouse };
