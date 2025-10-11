#!/usr/bin/env node

/**
 * API Endpoint Verification Test Runner
 * Standalone script to run API endpoint functionality tests
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { ComprehensiveAPITester } from './api/comprehensive-endpoint-tests';
import { TestConfiguration } from './types';

async function runEndpointVerification() {
  console.log('🚀 Starting API Endpoint Functionality Verification');
  console.log('=' .repeat(60));

  // Load configuration from environment variables
  const config: TestConfiguration = {
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
    authCredentials: {
      apiKey: process.env.TEST_API_KEY || '',
      webhookSecret: process.env.TEST_WEBHOOK_SECRET || '',
    },
    testDataSets: [],
    performanceThresholds: {
      maxResponseTime: 5000,
      minThroughput: 10,
      maxErrorRate: 0.05,
    },
    securitySettings: {
      enableReplayAttackTests: true,
      enableInputFuzzingTests: false,
      maxTimestampSkew: 300000, // 5 minutes
    },
  };

  // Validate configuration
  if (!config.authCredentials.apiKey) {
    console.error('❌ TEST_API_KEY environment variable is required');
    process.exit(1);
  }

  if (!config.authCredentials.webhookSecret) {
    console.error('❌ TEST_WEBHOOK_SECRET environment variable is required');
    process.exit(1);
  }

  console.log(`📡 API Base URL: ${config.apiBaseUrl}`);
  console.log(`🔑 API Key: ${config.authCredentials.apiKey.substring(0, 8)}...`);
  console.log('');

  try {
    // Initialize the tester
    const tester = new ComprehensiveAPITester(config);

    // Run all endpoint tests
    const result = await tester.runAllEndpointTests();

    // Generate and display the report
    const report = tester.generateSummaryReport(result);
    console.log(report);

    // Validate critical endpoints
    const criticalValidation = tester.validateCriticalEndpoints(result);

    if (result.success && criticalValidation.allCriticalPassing) {
      console.log('✅ All API endpoint tests passed successfully!');
      process.exit(0);
    } else {
      console.log('❌ Some API endpoint tests failed.');
      
      if (!criticalValidation.allCriticalPassing) {
        console.log('🚨 Critical endpoint failures detected:');
        criticalValidation.criticalFailures.forEach(endpoint => {
          console.log(`   - ${endpoint}`);
        });
      }
      
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Verification failed with error:');
    console.error(error instanceof Error ? error.message : 'Unknown error');
    console.error('');
    
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Run the verification if this script is executed directly
if (require.main === module) {
  runEndpointVerification().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { runEndpointVerification };