#!/usr/bin/env node

/**
 * Mobile Sidebar Functionality Test Script
 * 
 * This script runs comprehensive tests for mobile sidebar functionality
 * including viewport changes, state persistence, and user interactions.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Mobile Sidebar Functionality Test');
console.log('=====================================\n');

// Test configuration
const testConfig = {
  testFile: 'tests/e2e/mobile-sidebar-puppeteer.test.ts',
  reportDir: 'tests/reports',
  reportFile: 'mobile-sidebar-test-results.md'
};

// Ensure reports directory exists
if (!fs.existsSync(testConfig.reportDir)) {
  fs.mkdirSync(testConfig.reportDir, { recursive: true });
}

const reportPath = path.join(testConfig.reportDir, testConfig.reportFile);

function runCommand(command, description) {
  console.log(`📋 ${description}`);
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      timeout: 120000 // 2 minute timeout
    });
    console.log('✅ Success\n');
    return { success: true, output };
  } catch (error) {
    console.log(`❌ Failed: ${error.message}\n`);
    return { success: false, error: error.message, output: error.stdout || '' };
  }
}

function generateReport(results) {
  const timestamp = new Date().toISOString();
  
  let report = `# Mobile Sidebar Functionality Test Results\n\n`;
  report += `**Generated:** ${timestamp}\n\n`;
  report += `## Test Summary\n\n`;
  
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  
  report += `- **Total Tests:** ${totalTests}\n`;
  report += `- **Passed:** ${passedTests}\n`;
  report += `- **Failed:** ${failedTests}\n`;
  report += `- **Success Rate:** ${((passedTests / totalTests) * 100).toFixed(1)}%\n\n`;
  
  report += `## Test Details\n\n`;
  
  results.forEach((result, index) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    report += `### ${index + 1}. ${result.description}\n\n`;
    report += `**Status:** ${status}\n\n`;
    
    if (result.output) {
      report += `**Output:**\n\`\`\`\n${result.output}\n\`\`\`\n\n`;
    }
    
    if (result.error) {
      report += `**Error:**\n\`\`\`\n${result.error}\n\`\`\`\n\n`;
    }
  });
  
  report += `## Test Requirements Verification\n\n`;
  report += `This test suite verifies the following requirements:\n\n`;
  report += `- **Requirement 4.5:** Mobile sidebar state persistence during navigation\n`;
  report += `- **Requirement 4.6:** Mobile sidebar toggle functionality\n\n`;
  
  report += `### Mobile Sidebar Functionality Checklist\n\n`;
  report += `- [${results[0]?.success ? 'x' : ' '}] Mobile menu button appears on mobile viewport\n`;
  report += `- [${results[1]?.success ? 'x' : ' '}] Mobile sidebar toggles open and closed\n`;
  report += `- [${results[2]?.success ? 'x' : ' '}] Sidebar closes when clicking overlay\n`;
  report += `- [${results[3]?.success ? 'x' : ' '}] Sidebar state maintained during navigation (open)\n`;
  report += `- [${results[4]?.success ? 'x' : ' '}] Sidebar state maintained during navigation (closed)\n`;
  report += `- [${results[5]?.success ? 'x' : ' '}] Sidebar closes when navigating via sidebar links\n`;
  report += `- [${results[6]?.success ? 'x' : ' '}] Works across different mobile viewport sizes\n`;
  report += `- [${results[7]?.success ? 'x' : ' '}] Mobile menu button hidden on desktop\n`;
  report += `- [${results[8]?.success ? 'x' : ' '}] Proper focus management\n`;
  report += `- [${results[9]?.success ? 'x' : ' '}] Handles rapid toggle clicks\n\n`;
  
  if (failedTests === 0) {
    report += `## ✅ All Tests Passed!\n\n`;
    report += `Mobile sidebar functionality is working correctly across all test scenarios.\n`;
  } else {
    report += `## ⚠️ Issues Found\n\n`;
    report += `${failedTests} test(s) failed. Please review the failed tests and fix the issues.\n`;
  }
  
  return report;
}

async function main() {
  const results = [];
  
  console.log('🚀 Starting mobile sidebar functionality tests...\n');
  
  // Check if test file exists
  if (!fs.existsSync(testConfig.testFile)) {
    console.log(`❌ Test file not found: ${testConfig.testFile}`);
    process.exit(1);
  }
  
  // Check if development server is running
  console.log('📦 Checking if development server is available...');
  try {
    const testResult = runCommand('curl -f http://localhost:3000/admin/login || echo "Server not running"', 'Checking server availability');
    if (!testResult.success || testResult.output.includes('Server not running')) {
      console.log('⚠️ Development server not running. Please start with "npm run dev" first.\n');
    }
  } catch (error) {
    console.log('⚠️ Could not check server status, continuing anyway...\n');
  }
  
  // Run the mobile sidebar tests
  const testResult = runCommand(
    `npm test ${testConfig.testFile}`,
    'Running mobile sidebar functionality tests'
  );
  
  results.push({
    description: 'Mobile Sidebar E2E Tests',
    success: testResult.success,
    output: testResult.output,
    error: testResult.error
  });
  
  // Generate and save report
  console.log('📊 Generating test report...');
  const report = generateReport(results);
  fs.writeFileSync(reportPath, report);
  console.log(`✅ Report saved to: ${reportPath}\n`);
  
  // Display summary
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  
  console.log('📋 Test Summary:');
  console.log(`   Total: ${totalTests}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${failedTests}`);
  console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);
  
  if (failedTests > 0) {
    console.log('❌ Some tests failed. Check the report for details.');
    process.exit(1);
  } else {
    console.log('✅ All mobile sidebar functionality tests passed!');
  }
}

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the main function
main().catch((error) => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});