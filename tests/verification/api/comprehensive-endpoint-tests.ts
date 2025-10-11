import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestConfiguration, TestResult, TestResultAggregation, TestStatus, TestCategory, VerificationLevel, ErrorType } from '../types';
import { APIEndpointTester } from './endpoint-tests';
import { APIErrorHandlingTester } from './error-handling-tests';

/**
 * Comprehensive API Endpoint Functionality Verification
 * Orchestrates all API endpoint tests including success and error scenarios
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.2, 6.3, 6.4, 6.5
 */

export class ComprehensiveAPITester {
  private config: TestConfiguration;
  private endpointTester: APIEndpointTester;
  private errorTester: APIErrorHandlingTester;

  constructor(config: TestConfiguration) {
    this.config = config;
    this.endpointTester = new APIEndpointTester(config);
    this.errorTester = new APIErrorHandlingTester(config);
  }

  /**
   * Run all API endpoint functionality tests
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
   */
  async runAllEndpointTests(): Promise<TestResultAggregation> {
    const startTime = Date.now();
    const allResults: TestResult[] = [];

    try {
      console.log('Starting comprehensive API endpoint verification...');

      // Test GET /api/topics endpoint with all filter combinations
      console.log('Testing GET /api/topics endpoint...');
      const topicsResults = await this.endpointTester.testGetTopicsEndpoint();
      allResults.push(...topicsResults);

      // Test GET /api/topics/[slug] endpoint with various slugs
      console.log('Testing GET /api/topics/[slug] endpoint...');
      const topicBySlugResults = await this.endpointTester.testGetTopicBySlugEndpoint();
      allResults.push(...topicBySlugResults);

      // Test POST /api/ingest endpoint with valid and invalid payloads
      console.log('Testing POST /api/ingest endpoint...');
      const ingestResults = await this.endpointTester.testIngestEndpoint();
      allResults.push(...ingestResults);

      // Test POST /api/revalidate endpoint functionality
      console.log('Testing POST /api/revalidate endpoint...');
      const revalidateResults = await this.endpointTester.testRevalidateEndpoint();
      allResults.push(...revalidateResults);

      // Test error handling scenarios
      console.log('Testing error handling scenarios...');
      const errorResults = await this.runErrorHandlingTests();
      allResults.push(...errorResults);

      const totalDuration = Date.now() - startTime;
      const passedTests = allResults.filter(r => r.status === TestStatus.PASSED).length;
      const failedTests = allResults.filter(r => r.status === TestStatus.FAILED).length;
      const skippedTests = allResults.filter(r => r.status === TestStatus.SKIPPED).length;
      const warningTests = allResults.filter(r => r.status === TestStatus.WARNING).length;

      console.log(`API endpoint verification completed in ${totalDuration}ms`);
      console.log(`Passed: ${passedTests}, Failed: ${failedTests}, Total: ${allResults.length}`);

      return {
        totalTests: allResults.length,
        passedTests,
        failedTests,
        skippedTests,
        warningTests,
        executionTime: totalDuration,
        overallStatus: failedTests === 0 ? TestStatus.PASSED : TestStatus.FAILED,
        categoryResults: this.calculateCategoryResults(allResults),
        criticalFailures: allResults.filter(r => r.status === TestStatus.FAILED && r.verificationLevel === VerificationLevel.CRITICAL),
        performanceSummary: this.calculatePerformanceSummary(allResults),
      };
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      const passedTests = allResults.filter(r => r.status === TestStatus.PASSED).length;
      const failedTests = allResults.filter(r => r.status === TestStatus.FAILED).length;
      
      return {
        totalTests: allResults.length + 1,
        passedTests,
        failedTests: failedTests + 1,
        skippedTests: 0,
        warningTests: 0,
        executionTime: totalDuration,
        overallStatus: TestStatus.FAILED,
        categoryResults: this.calculateCategoryResults(allResults),
        criticalFailures: [],
        performanceSummary: this.calculatePerformanceSummary(allResults),
      };
    }
  }

  /**
   * Run all error handling tests
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
   */
  private async runErrorHandlingTests(): Promise<TestResult[]> {
    const allResults: TestResult[] = [];

    // Test 400 error responses
    const error400Results = await this.errorTester.test400ErrorResponses();
    allResults.push(...error400Results);

    // Test 401 error responses
    const error401Results = await this.errorTester.test401ErrorResponses();
    allResults.push(...error401Results);

    // Test 404 error responses
    const error404Results = await this.errorTester.test404ErrorResponses();
    allResults.push(...error404Results);

    // Test 500 error responses
    const error500Results = await this.errorTester.test500ErrorResponses();
    allResults.push(...error500Results);

    return allResults;
  }

  /**
   * Calculate category results for aggregation
   */
  private calculateCategoryResults(results: TestResult[]): Record<TestCategory, any> {
    const categoryResults: Record<TestCategory, any> = {} as any;
    
    Object.values(TestCategory).forEach(category => {
      const categoryTests = results.filter(r => r.category === category);
      const passed = categoryTests.filter(r => r.status === TestStatus.PASSED).length;
      const failed = categoryTests.filter(r => r.status === TestStatus.FAILED).length;
      const avgTime = categoryTests.length > 0 
        ? categoryTests.reduce((sum, r) => sum + r.duration, 0) / categoryTests.length 
        : 0;
      
      categoryResults[category] = {
        category,
        totalTests: categoryTests.length,
        passedTests: passed,
        failedTests: failed,
        averageExecutionTime: avgTime,
        status: failed === 0 ? TestStatus.PASSED : TestStatus.FAILED,
      };
    });
    
    return categoryResults;
  }

  /**
   * Calculate performance summary
   */
  private calculatePerformanceSummary(results: TestResult[]): any {
    const responseTimes = results
      .map(r => r.details.response?.responseTime)
      .filter(t => t !== undefined) as number[];
    
    if (responseTimes.length === 0) {
      return {
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        slowestEndpoint: 'N/A',
        fastestEndpoint: 'N/A',
        cacheEffectiveness: 0,
      };
    }
    
    responseTimes.sort((a, b) => a - b);
    const avg = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);
    
    return {
      averageResponseTime: avg,
      p95ResponseTime: responseTimes[p95Index] || 0,
      p99ResponseTime: responseTimes[p99Index] || 0,
      slowestEndpoint: 'N/A',
      fastestEndpoint: 'N/A',
      cacheEffectiveness: 0,
    };
  }

  /**
   * Generate a summary report of all test results
   */
  generateSummaryReport(result: TestResultAggregation): string {
    const report = [
      '='.repeat(80),
      'API ENDPOINT FUNCTIONALITY VERIFICATION REPORT',
      '='.repeat(80),
      '',
      `Overall Status: ${result.overallStatus === TestStatus.PASSED ? 'PASS' : 'FAIL'}`,
      `Total Tests: ${result.totalTests}`,
      `Passed: ${result.passedTests}`,
      `Failed: ${result.failedTests}`,
      `Execution Time: ${result.executionTime}ms`,
      '',
      'TEST RESULTS BY CATEGORY:',
      '-'.repeat(40),
    ];

    // Show category results
    for (const [category, categoryResult] of Object.entries(result.categoryResults)) {
      const status = categoryResult.status === TestStatus.PASSED ? 'PASS' : 'FAIL';
      report.push(`${category}: ${status} (${categoryResult.passedTests}/${categoryResult.totalTests})`);
    }

    if (result.failedTests > 0) {
      report.push('', 'FAILED TESTS DETAILS:', '-'.repeat(40));
      
      result.criticalFailures.forEach(test => {
        report.push(`❌ ${test.testName}`);
        report.push(`   Error: ${test.error?.message || 'Unknown error'}`);
        report.push(`   Duration: ${test.duration}ms`);
        if (test.details) {
          report.push(`   Details: ${JSON.stringify(test.details, null, 2)}`);
        }
        report.push('');
      });
    }

    report.push('='.repeat(80));
    
    return report.join('\n');
  }

  /**
   * Validate that all required endpoints are working
   */
  validateCriticalEndpoints(result: TestResultAggregation): {
    allCriticalPassing: boolean;
    criticalFailures: string[];
  } {
    const criticalFailures: string[] = [];
    
    // Check if there are any critical failures
    if (result.criticalFailures.length > 0) {
      result.criticalFailures.forEach(failure => {
        if (failure.testName.includes('GET /api/topics')) {
          criticalFailures.push('GET /api/topics');
        } else if (failure.testName.includes('POST /api/ingest')) {
          criticalFailures.push('POST /api/ingest');
        } else if (failure.testName.includes('POST /api/revalidate')) {
          criticalFailures.push('POST /api/revalidate');
        }
      });
    }

    return {
      allCriticalPassing: criticalFailures.length === 0,
      criticalFailures: [...new Set(criticalFailures)], // Remove duplicates
    };
  }
}

/**
 * Vitest test suite for API endpoint functionality
 */
describe('API Endpoint Functionality Verification', () => {
  let tester: ComprehensiveAPITester;
  let config: TestConfiguration;

  beforeAll(async () => {
    // Load test configuration
    config = {
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
      timeout: 30000,
      retries: 3,
      parallelExecution: false,
      performanceThresholds: {
        maxResponseTime: 5000,
        minThroughput: 10,
        maxErrorRate: 0.05,
        maxMemoryUsage: 1024,
        minCacheHitRate: 0.8,
      },
      securitySettings: {
        enableReplayAttackTests: true,
        enableInputFuzzingTests: false,
        maxTimestampSkew: 300000, // 5 minutes
        enableVulnerabilityScanning: false,
      },
      reportingOptions: {
        generateDetailedReport: true,
        includePerformanceGraphs: false,
        exportFormats: ['json'],
        notificationSettings: {
          enableEmailNotifications: false,
          emailRecipients: [],
          criticalIssueThreshold: 1,
        },
      },
    };

    tester = new ComprehensiveAPITester(config);
  });

  it('should verify all API endpoints function correctly', async () => {
    const result = await tester.runAllEndpointTests();
    
    // Generate and log the report
    const report = tester.generateSummaryReport(result);
    console.log('\n' + report);

    // Validate critical endpoints
    const criticalValidation = tester.validateCriticalEndpoints(result);
    
    if (!criticalValidation.allCriticalPassing) {
      console.error('Critical endpoint failures:', criticalValidation.criticalFailures);
    }

    // The test passes if all tests pass
    expect(result.overallStatus).toBe(TestStatus.PASSED);
    expect(result.failedTests).toBe(0);
    expect(criticalValidation.allCriticalPassing).toBe(true);
  }, 60000); // 60 second timeout for comprehensive testing

  it('should validate response schemas for all endpoints', async () => {
    // This test focuses specifically on schema validation
    const result = await tester.runAllEndpointTests();
    
    // Check that all schema validation tests passed
    const schemaValidationTests = result.criticalFailures.filter(r => 
      r.testName.includes('schema') || 
      r.details?.validationErrors
    );

    const failedSchemaTests = schemaValidationTests.filter(r => r.status === TestStatus.FAILED);
    
    if (failedSchemaTests.length > 0) {
      console.error('Schema validation failures:');
      failedSchemaTests.forEach(test => {
        console.error(`- ${test.testName}: ${test.error}`);
        if (test.details?.validationErrors) {
          console.error(`  Validation errors: ${JSON.stringify(test.details.validationErrors, null, 2)}`);
        }
      });
    }

    expect(failedSchemaTests.length).toBe(0);
  }, 30000);

  it('should handle all error scenarios correctly', async () => {
    // This test focuses specifically on error handling
    const errorResults = await tester['runErrorHandlingTests']();
    
    const failedErrorTests = errorResults.filter(r => r.status === TestStatus.FAILED);
    
    if (failedErrorTests.length > 0) {
      console.error('Error handling test failures:');
      failedErrorTests.forEach(test => {
        console.error(`- ${test.testName}: ${test.error}`);
      });
    }

    expect(failedErrorTests.length).toBe(0);
  }, 30000);
});