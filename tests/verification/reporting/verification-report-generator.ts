/**
 * Verification Report Generator
 * 
 * Creates comprehensive verification reports with detailed test results,
 * pass/fail statistics, error categorization, and actionable recommendations.
 */

import { 
  TestExecutionState, 
  TestResult, 
  VerificationReport, 
  TestResultAggregation,
  CategoryResult,
  PerformanceSummary,
  Recommendation,
  CriticalIssue,
  TestCategory,
  TestStatus,
  ErrorType
} from '../types/index';

export class VerificationReportGenerator {
  /**
   * Generate comprehensive verification report
   */
  generateReport(
    executionState: TestExecutionState,
    environment: string = 'test',
    schemaVersion: string = '1.0.0'
  ): VerificationReport {
    const summary = this.generateSummary(executionState);
    const sections = this.generateSections(executionState.results);
    const recommendations = this.generateRecommendations(executionState.results);
    const criticalIssues = this.identifyCriticalIssues(executionState.results);

    return {
      timestamp: new Date(),
      environment,
      schemaVersion,
      testSuiteVersion: '1.0.0',
      summary,
      sections,
      recommendations,
      criticalIssues
    };
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(executionState: TestExecutionState): TestResultAggregation {
    const results = executionState.results;
    const totalTests = results.length;
    const passedTests = results.filter(r => r.status === TestStatus.PASSED).length;
    const failedTests = results.filter(r => r.status === TestStatus.FAILED).length;
    const skippedTests = results.filter(r => r.status === TestStatus.SKIPPED).length;
    const warningTests = results.filter(r => r.status === TestStatus.WARNING).length;
    
    const executionTime = executionState.endTime 
      ? executionState.endTime.getTime() - executionState.startTime.getTime()
      : Date.now() - executionState.startTime.getTime();

    const overallStatus = this.determineOverallStatus(results);
    const categoryResults = this.generateCategoryResults(results);
    const criticalFailures = results.filter(r => 
      r.status === TestStatus.FAILED && r.verificationLevel === 'critical'
    );
    const performanceSummary = this.generatePerformanceSummary(results);

    return {
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      warningTests,
      executionTime,
      overallStatus,
      categoryResults,
      criticalFailures,
      performanceSummary
    };
  }

  /**
   * Generate category-specific results
   */
  private generateCategoryResults(results: TestResult[]): Record<TestCategory, CategoryResult> {
    const categories = Object.values(TestCategory);
    const categoryResults: Record<TestCategory, CategoryResult> = {} as any;

    for (const category of categories) {
      const categoryTests = results.filter(r => r.category === category);
      const totalTests = categoryTests.length;
      const passedTests = categoryTests.filter(r => r.status === TestStatus.PASSED).length;
      const failedTests = categoryTests.filter(r => r.status === TestStatus.FAILED).length;
      const averageExecutionTime = totalTests > 0 
        ? categoryTests.reduce((sum, test) => sum + test.duration, 0) / totalTests
        : 0;

      const status = failedTests > 0 ? TestStatus.FAILED : 
                    totalTests === 0 ? TestStatus.SKIPPED : TestStatus.PASSED;

      categoryResults[category] = {
        category,
        totalTests,
        passedTests,
        failedTests,
        averageExecutionTime,
        status
      };
    }

    return categoryResults;
  }

  /**
   * Generate performance summary
   */
  private generatePerformanceSummary(results: TestResult[]): PerformanceSummary {
    const performanceResults = results.filter(r => r.details.performanceMetrics);
    
    if (performanceResults.length === 0) {
      return {
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        slowestEndpoint: 'N/A',
        fastestEndpoint: 'N/A',
        cacheEffectiveness: 0
      };
    }

    const responseTimes = performanceResults
      .map(r => r.details.performanceMetrics?.responseTime || 0)
      .filter(time => time > 0)
      .sort((a, b) => a - b);

    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);
    
    const p95ResponseTime = responseTimes[p95Index] || 0;
    const p99ResponseTime = responseTimes[p99Index] || 0;

    // Find slowest and fastest endpoints
    const endpointTimes = performanceResults.map(r => ({
      endpoint: r.testName,
      time: r.details.performanceMetrics?.responseTime || 0
    }));

    const slowestEndpoint = endpointTimes.reduce((slowest, current) => 
      current.time > slowest.time ? current : slowest, 
      { endpoint: 'N/A', time: 0 }
    ).endpoint;

    const fastestEndpoint = endpointTimes.reduce((fastest, current) => 
      current.time < fastest.time && current.time > 0 ? current : fastest,
      { endpoint: 'N/A', time: Infinity }
    ).endpoint;

    // Calculate cache effectiveness
    const cacheResults = performanceResults.filter(r => 
      r.details.performanceMetrics?.cacheHitRate !== undefined
    );
    const cacheEffectiveness = cacheResults.length > 0
      ? cacheResults.reduce((sum, r) => sum + (r.details.performanceMetrics?.cacheHitRate || 0), 0) / cacheResults.length
      : 0;

    return {
      averageResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      slowestEndpoint,
      fastestEndpoint,
      cacheEffectiveness
    };
  }

  /**
   * Generate detailed sections for different test categories
   */
  private generateSections(results: TestResult[]) {
    return {
      apiEndpoints: this.generateEndpointResults(results),
      schemaCompatibility: this.generateSchemaResults(results),
      security: this.generateSecurityResults(results),
      performance: this.generatePerformanceResults(results),
      dataIntegrity: this.generateIntegrityResults(results),
      backwardCompatibility: this.generateCompatibilityResults(results)
    };
  }

  /**
   * Generate API endpoint test results
   */
  private generateEndpointResults(results: TestResult[]) {
    const endpointTests = results.filter(r => r.category === TestCategory.API_ENDPOINTS);
    
    const endpoints = endpointTests.map(test => ({
      endpoint: test.details.request?.url || test.testName,
      method: test.details.request?.method || 'GET',
      status: test.status,
      responseTime: test.details.performanceMetrics?.responseTime || test.duration,
      statusCode: test.details.response?.status || 0,
      schemaValid: !test.details.validationErrors || test.details.validationErrors.length === 0,
      authenticationWorking: test.error?.type !== ErrorType.AUTHENTICATION_ERROR
    }));

    return {
      endpoints,
      totalEndpoints: endpoints.length,
      workingEndpoints: endpoints.filter(e => e.status === TestStatus.PASSED).length,
      brokenEndpoints: endpoints.filter(e => e.status === TestStatus.FAILED).length
    };
  }

  /**
   * Generate schema compatibility results
   */
  private generateSchemaResults(results: TestResult[]) {
    const schemaTests = results.filter(r => r.category === TestCategory.SCHEMA_COMPATIBILITY);
    
    const newFieldsWorking = schemaTests
      .filter(t => t.testName.includes('new-field') || t.testName.includes('seo') || t.testName.includes('thumbnail'))
      .every(t => t.status === TestStatus.PASSED);

    const databaseQueriesWorking = schemaTests
      .filter(t => t.testName.includes('database') || t.testName.includes('query'))
      .every(t => t.status === TestStatus.PASSED);

    const indexPerformance = schemaTests
      .filter(t => t.testName.includes('index') || t.testName.includes('performance'))
      .every(t => t.status === TestStatus.PASSED);

    const constraintsValid = schemaTests
      .filter(t => t.testName.includes('constraint') || t.testName.includes('validation'))
      .every(t => t.status === TestStatus.PASSED);

    const migrationIssues = schemaTests
      .filter(t => t.status === TestStatus.FAILED)
      .map(t => t.error?.message || 'Unknown schema issue');

    return {
      newFieldsWorking,
      databaseQueriesWorking,
      indexPerformance,
      constraintsValid,
      migrationIssues
    };
  }

  /**
   * Generate security test results
   */
  private generateSecurityResults(results: TestResult[]) {
    const securityTests = results.filter(r => r.category === TestCategory.SECURITY);
    
    const hmacAuthenticationWorking = securityTests
      .filter(t => t.testName.includes('hmac') || t.testName.includes('authentication'))
      .every(t => t.status === TestStatus.PASSED);

    const signatureValidationWorking = securityTests
      .filter(t => t.testName.includes('signature'))
      .every(t => t.status === TestStatus.PASSED);

    const replayAttackPrevention = securityTests
      .filter(t => t.testName.includes('replay'))
      .every(t => t.status === TestStatus.PASSED);

    const inputValidationWorking = securityTests
      .filter(t => t.testName.includes('input') || t.testName.includes('validation'))
      .every(t => t.status === TestStatus.PASSED);

    const vulnerabilities = securityTests
      .filter(t => t.status === TestStatus.FAILED)
      .map(t => ({
        type: t.error?.type || 'unknown',
        severity: t.verificationLevel as 'low' | 'medium' | 'high' | 'critical',
        description: t.error?.message || 'Security vulnerability detected',
        endpoint: t.details.request?.url,
        recommendation: this.getSecurityRecommendation(t)
      }));

    return {
      hmacAuthenticationWorking,
      signatureValidationWorking,
      replayAttackPrevention,
      inputValidationWorking,
      vulnerabilities
    };
  }

  /**
   * Generate performance test results
   */
  private generatePerformanceResults(results: TestResult[]) {
    const performanceTests = results.filter(r => r.category === TestCategory.PERFORMANCE);
    
    const responseTimesAcceptable = performanceTests
      .filter(t => t.details.performanceMetrics?.responseTime)
      .every(t => (t.details.performanceMetrics?.responseTime || 0) < 500);

    const cacheWorking = performanceTests
      .filter(t => t.testName.includes('cache'))
      .every(t => t.status === TestStatus.PASSED);

    const databasePerformance = performanceTests
      .filter(t => t.testName.includes('database'))
      .every(t => t.status === TestStatus.PASSED);

    const memoryUsageNormal = performanceTests
      .filter(t => t.details.performanceMetrics?.memoryUsage)
      .every(t => (t.details.performanceMetrics?.memoryUsage || 0) < 1000);

    const bottlenecks = performanceTests
      .filter(t => t.status === TestStatus.FAILED || t.status === TestStatus.WARNING)
      .map(t => ({
        component: t.testName,
        issue: t.error?.message || 'Performance issue detected',
        impact: t.verificationLevel as 'low' | 'medium' | 'high',
        recommendation: this.getPerformanceRecommendation(t)
      }));

    return {
      responseTimesAcceptable,
      cacheWorking,
      databasePerformance,
      memoryUsageNormal,
      bottlenecks
    };
  }

  /**
   * Generate data integrity results
   */
  private generateIntegrityResults(results: TestResult[]) {
    const integrityTests = results.filter(r => r.category === TestCategory.DATA_INTEGRITY);
    
    const adminApiConsistency = integrityTests
      .filter(t => t.testName.includes('admin') || t.testName.includes('consistency'))
      .every(t => t.status === TestStatus.PASSED);

    const dataConsistency = integrityTests
      .filter(t => t.testName.includes('data'))
      .every(t => t.status === TestStatus.PASSED);

    const newFieldsIntegrated = integrityTests
      .filter(t => t.testName.includes('new-field') || t.testName.includes('seo'))
      .every(t => t.status === TestStatus.PASSED);

    const crossReferenceValid = integrityTests
      .filter(t => t.testName.includes('reference') || t.testName.includes('relationship'))
      .every(t => t.status === TestStatus.PASSED);

    const inconsistencies = integrityTests
      .filter(t => t.status === TestStatus.FAILED)
      .map(t => ({
        type: 'data_inconsistency',
        description: t.error?.message || 'Data inconsistency detected',
        affectedData: t.testName,
        severity: t.verificationLevel as 'low' | 'medium' | 'high'
      }));

    return {
      adminApiConsistency,
      dataConsistency,
      newFieldsIntegrated,
      crossReferenceValid,
      inconsistencies
    };
  }

  /**
   * Generate backward compatibility results
   */
  private generateCompatibilityResults(results: TestResult[]) {
    const compatibilityTests = results.filter(r => r.category === TestCategory.BACKWARD_COMPATIBILITY);
    
    const existingParametersWork = compatibilityTests
      .filter(t => t.testName.includes('parameter'))
      .every(t => t.status === TestStatus.PASSED);

    const responseStructureUnchanged = compatibilityTests
      .filter(t => t.testName.includes('response') || t.testName.includes('structure'))
      .every(t => t.status === TestStatus.PASSED);

    const authenticationBackwardCompatible = compatibilityTests
      .filter(t => t.testName.includes('auth'))
      .every(t => t.status === TestStatus.PASSED);

    const breakingChanges = compatibilityTests
      .filter(t => t.status === TestStatus.FAILED)
      .map(t => ({
        type: 'api_change',
        description: t.error?.message || 'Breaking change detected',
        affectedEndpoints: [t.details.request?.url || t.testName],
        migrationRequired: t.verificationLevel === 'critical',
        recommendation: this.getCompatibilityRecommendation(t)
      }));

    return {
      existingParametersWork,
      responseStructureUnchanged,
      authenticationBackwardCompatible,
      breakingChanges
    };
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(results: TestResult[]): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const failedTests = results.filter(r => r.status === TestStatus.FAILED);
    
    // Group failed tests by category
    const failuresByCategory = failedTests.reduce((acc, test) => {
      if (!acc[test.category]) {
        acc[test.category] = [];
      }
      acc[test.category].push(test);
      return acc;
    }, {} as Record<TestCategory, TestResult[]>);

    // Generate category-specific recommendations
    for (const [category, failures] of Object.entries(failuresByCategory)) {
      const recommendation = this.generateCategoryRecommendation(
        category as TestCategory, 
        failures
      );
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    // Add general recommendations
    if (failedTests.length > 0) {
      recommendations.push({
        category: TestCategory.API_ENDPOINTS,
        priority: 'high',
        title: 'Address Test Failures',
        description: `${failedTests.length} tests failed during verification. Review and fix issues before deployment.`,
        actionItems: [
          'Review failed test details and error messages',
          'Fix underlying issues causing test failures',
          'Re-run verification tests to confirm fixes',
          'Update documentation if API changes are required'
        ],
        estimatedEffort: '2-4 hours'
      });
    }

    return recommendations;
  }

  /**
   * Identify critical issues requiring immediate attention
   */
  private identifyCriticalIssues(results: TestResult[]): CriticalIssue[] {
    const criticalFailures = results.filter(r => 
      r.status === TestStatus.FAILED && r.verificationLevel === 'critical'
    );

    return criticalFailures.map(test => ({
      title: `Critical Test Failure: ${test.testName}`,
      description: test.error?.message || 'Critical test failed without specific error message',
      impact: 'System functionality may be compromised',
      affectedComponents: [test.category],
      immediateAction: this.getImmediateAction(test),
      rollbackRequired: this.shouldRollback(test)
    }));
  }

  /**
   * Determine overall test status
   */
  private determineOverallStatus(results: TestResult[]): TestStatus {
    const criticalFailures = results.filter(r => 
      r.status === TestStatus.FAILED && r.verificationLevel === 'critical'
    );
    
    if (criticalFailures.length > 0) {
      return TestStatus.FAILED;
    }
    
    const anyFailures = results.some(r => r.status === TestStatus.FAILED);
    if (anyFailures) {
      return TestStatus.WARNING;
    }
    
    return TestStatus.PASSED;
  }

  /**
   * Generate category-specific recommendation
   */
  private generateCategoryRecommendation(
    category: TestCategory, 
    failures: TestResult[]
  ): Recommendation | null {
    const categoryRecommendations = {
      [TestCategory.API_ENDPOINTS]: {
        title: 'Fix API Endpoint Issues',
        description: 'API endpoints are not functioning correctly',
        actionItems: [
          'Check API route handlers for errors',
          'Verify request/response schemas',
          'Test endpoints manually with valid requests'
        ]
      },
      [TestCategory.SCHEMA_COMPATIBILITY]: {
        title: 'Resolve Database Schema Issues',
        description: 'Database schema changes are causing compatibility problems',
        actionItems: [
          'Review Prisma schema changes',
          'Check database migrations',
          'Verify index performance'
        ]
      },
      [TestCategory.AUTHENTICATION]: {
        title: 'Fix Authentication Problems',
        description: 'Authentication mechanisms are not working properly',
        actionItems: [
          'Verify HMAC signature generation',
          'Check authentication middleware',
          'Test with valid credentials'
        ]
      },
      [TestCategory.PERFORMANCE]: {
        title: 'Address Performance Issues',
        description: 'System performance does not meet requirements',
        actionItems: [
          'Optimize slow database queries',
          'Review caching strategy',
          'Check for memory leaks'
        ]
      },
      [TestCategory.DATA_INTEGRITY]: {
        title: 'Fix Data Integrity Problems',
        description: 'Data consistency issues detected between admin and API',
        actionItems: [
          'Verify data synchronization',
          'Check admin interface operations',
          'Test data flow end-to-end'
        ]
      },
      [TestCategory.BACKWARD_COMPATIBILITY]: {
        title: 'Resolve Compatibility Issues',
        description: 'Changes have broken backward compatibility',
        actionItems: [
          'Review API changes for breaking modifications',
          'Add compatibility layers if needed',
          'Update API versioning strategy'
        ]
      }
    };

    const template = categoryRecommendations[category];
    if (!template) return null;

    return {
      category,
      priority: failures.some(f => f.verificationLevel === 'critical') ? 'critical' : 'high',
      title: template.title,
      description: template.description,
      actionItems: template.actionItems,
      estimatedEffort: this.estimateEffort(failures.length)
    };
  }

  /**
   * Get security-specific recommendation
   */
  private getSecurityRecommendation(test: TestResult): string {
    if (test.testName.includes('hmac')) {
      return 'Verify HMAC signature generation and validation logic';
    }
    if (test.testName.includes('replay')) {
      return 'Implement proper timestamp validation and nonce tracking';
    }
    return 'Review security implementation and test with various attack vectors';
  }

  /**
   * Get performance-specific recommendation
   */
  private getPerformanceRecommendation(test: TestResult): string {
    if (test.testName.includes('cache')) {
      return 'Optimize caching strategy and verify cache invalidation';
    }
    if (test.testName.includes('database')) {
      return 'Add database indexes and optimize query performance';
    }
    return 'Profile application performance and identify bottlenecks';
  }

  /**
   * Get compatibility-specific recommendation
   */
  private getCompatibilityRecommendation(test: TestResult): string {
    return 'Maintain backward compatibility or provide migration path for existing clients';
  }

  /**
   * Get immediate action for critical issue
   */
  private getImmediateAction(test: TestResult): string {
    if (test.category === TestCategory.SECURITY) {
      return 'Disable affected endpoints until security issue is resolved';
    }
    if (test.category === TestCategory.API_ENDPOINTS) {
      return 'Investigate API endpoint failure and fix immediately';
    }
    return 'Review test failure and determine if rollback is necessary';
  }

  /**
   * Determine if rollback is required
   */
  private shouldRollback(test: TestResult): boolean {
    return test.verificationLevel === 'critical' && 
           (test.category === TestCategory.SECURITY || 
            test.category === TestCategory.API_ENDPOINTS);
  }

  /**
   * Estimate effort based on number of failures
   */
  private estimateEffort(failureCount: number): string {
    if (failureCount <= 2) return '1-2 hours';
    if (failureCount <= 5) return '2-4 hours';
    if (failureCount <= 10) return '4-8 hours';
    return '1-2 days';
  }
}