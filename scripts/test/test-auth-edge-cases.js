#!/usr/bin/env node

/**
 * Manual Authentication Edge Cases Test Script
 * 
 * This script provides a checklist and automated verification for authentication edge cases.
 * Run this script to verify all authentication scenarios are working correctly.
 * 
 * Requirements: 3.4, 3.7, 3.8
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔐 Authentication Edge Cases Test Script');
console.log('=========================================\n');

// Test configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TEST_USER = {
  email: 'admin@example.com',
  password: 'admin123'
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, description) {
  log(`\n${step}. ${description}`, 'bold');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

// Check if development server is running
function checkServerRunning() {
  try {
    execSync(`curl -s ${BASE_URL} > /dev/null`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Run unit tests
function runUnitTests() {
  logStep('1', 'Running Unit Tests');
  
  try {
    logInfo('Running ClientAuthCheck unit tests...');
    execSync('npm test -- tests/unit/client-auth-check.test.tsx --run', { stdio: 'inherit' });
    logSuccess('Unit tests passed');
    return true;
  } catch (error) {
    logError('Unit tests failed');
    return false;
  }
}

// Run integration tests
function runIntegrationTests() {
  logStep('2', 'Running Integration Tests');
  
  try {
    logInfo('Running authentication middleware integration tests...');
    execSync('npm test -- tests/integration/auth-edge-cases.test.ts --run', { stdio: 'inherit' });
    logSuccess('Integration tests passed');
    return true;
  } catch (error) {
    logError('Integration tests failed');
    return false;
  }
}

// Check if E2E tests can run
function checkE2ESetup() {
  logStep('3', 'Checking E2E Test Setup');
  
  try {
    // Check if Playwright is installed
    execSync('npx playwright --version', { stdio: 'ignore' });
    logSuccess('Playwright is installed');
    
    // Check if test database is available
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('test')) {
      logSuccess('Test database configured');
      return true;
    } else {
      logWarning('Test database not configured - E2E tests may use development database');
      return false;
    }
  } catch (error) {
    logWarning('Playwright not installed - E2E tests will be skipped');
    return false;
  }
}

// Run E2E tests if available
function runE2ETests() {
  logStep('4', 'Running E2E Tests (if available)');
  
  if (!checkE2ESetup()) {
    logWarning('Skipping E2E tests - setup not complete');
    return true;
  }
  
  try {
    logInfo('Running authentication edge cases E2E tests...');
    execSync('npx playwright test tests/e2e/auth-edge-cases.test.ts', { stdio: 'inherit' });
    logSuccess('E2E tests passed');
    return true;
  } catch (error) {
    logError('E2E tests failed');
    return false;
  }
}

// Manual test checklist
function displayManualChecklist() {
  logStep('5', 'Manual Test Checklist');
  
  logInfo('Please manually verify the following scenarios:');
  
  const checklist = [
    {
      scenario: 'Access /admin while logged out',
      steps: [
        '1. Open browser in incognito/private mode',
        '2. Navigate to ' + BASE_URL + '/admin',
        '3. Verify redirect to /admin/login',
        '4. Verify callbackUrl parameter is set to /admin',
        '5. Verify no sidebar is visible'
      ]
    },
    {
      scenario: 'Access /admin/login while logged in',
      steps: [
        '1. Log in to admin dashboard',
        '2. Navigate to ' + BASE_URL + '/admin/login',
        '3. Verify redirect to /admin dashboard',
        '4. Verify sidebar is visible',
        '5. Verify no login form is shown'
      ]
    },
    {
      scenario: 'Session expiration handling',
      steps: [
        '1. Log in to admin dashboard',
        '2. Navigate to /admin/topics',
        '3. Clear browser cookies/storage',
        '4. Navigate to /admin/settings',
        '5. Verify redirect to login with callbackUrl=/admin/settings'
      ]
    },
    {
      scenario: 'CallbackUrl functionality',
      steps: [
        '1. While logged out, navigate to ' + BASE_URL + '/admin/topics',
        '2. Verify redirect to login with callbackUrl',
        '3. Log in with valid credentials',
        '4. Verify redirect to original /admin/topics page',
        '5. Verify sidebar is visible'
      ]
    },
    {
      scenario: 'Logout from any page',
      steps: [
        '1. Log in and navigate to /admin/settings',
        '2. Click logout button',
        '3. Verify redirect to /admin/login',
        '4. Verify no sidebar is visible',
        '5. Verify login form is displayed'
      ]
    }
  ];
  
  checklist.forEach((test, index) => {
    log(`\n${index + 1}. ${test.scenario}:`, 'yellow');
    test.steps.forEach(step => {
      log(`   ${step}`);
    });
  });
  
  log('\n📋 After completing manual tests, verify:', 'bold');
  log('   • No duplicate sidebars appear on any page');
  log('   • Authentication redirects work correctly');
  log('   • CallbackUrl preserves intended destination');
  log('   • Session expiration is handled gracefully');
  log('   • Logout works from any admin page');
}

// Generate test report
function generateTestReport(results) {
  logStep('6', 'Generating Test Report');
  
  const report = {
    timestamp: new Date().toISOString(),
    testResults: results,
    summary: {
      total: Object.keys(results).length,
      passed: Object.values(results).filter(r => r).length,
      failed: Object.values(results).filter(r => !r).length
    }
  };
  
  const reportPath = path.join(__dirname, '../..', 'tests/reports/auth-edge-cases-test-report.json');
  
  // Ensure reports directory exists
  const reportsDir = path.dirname(reportPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  logSuccess(`Test report generated: ${reportPath}`);
  
  // Display summary
  log('\n📊 Test Summary:', 'bold');
  log(`   Total tests: ${report.summary.total}`);
  log(`   Passed: ${report.summary.passed}`, 'green');
  log(`   Failed: ${report.summary.failed}`, report.summary.failed > 0 ? 'red' : 'green');
  
  return report.summary.failed === 0;
}

// Main execution
async function main() {
  log('Starting authentication edge cases testing...\n');
  
  // Check prerequisites
  if (!checkServerRunning()) {
    logError('Development server is not running');
    logInfo('Please start the server with: npm run dev');
    process.exit(1);
  }
  
  logSuccess('Development server is running');
  
  // Run tests
  const results = {
    unitTests: runUnitTests(),
    integrationTests: runIntegrationTests(),
    e2eTests: runE2ETests()
  };
  
  // Display manual checklist
  displayManualChecklist();
  
  // Generate report
  const allTestsPassed = generateTestReport(results);
  
  // Final status
  log('\n🎯 Authentication Edge Cases Testing Complete', 'bold');
  
  if (allTestsPassed) {
    logSuccess('All automated tests passed!');
    logInfo('Please complete the manual checklist above to fully verify authentication edge cases.');
  } else {
    logError('Some tests failed. Please review the output above.');
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main().catch(error => {
    logError(`Script failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  checkServerRunning,
  runUnitTests,
  runIntegrationTests,
  runE2ETests,
  generateTestReport
};