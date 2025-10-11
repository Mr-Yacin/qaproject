/**
 * Test Result Aggregator
 * 
 * Aggregates and analyzes test results to provide meaningful statistics,
 * trends, and insights for verification reporting.
 */

import { 
  TestResult, 
  TestExecutionState, 
  TestStatus, 
  TestCategory, 
  VerificationLevel,
  ErrorType,
  PerformanceMetrics
} from '../types/index';

export class TestResultAggregator {
  /**
   * Aggregate results by category
   */
  aggregateByCategory(results: TestResult[]): Map<TestCategory, CategoryAggregation> {
    const aggregation = new Map<TestCategory, CategoryAggregation>();
    
    // Initialize all categories
    Object.values(TestCategory).forEach(category => {
      aggregation.set(category, {
        category,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        warningTests: 0,
        averageExecutionTime: 0,
        totalExecutionTime: 0,
        successRate: 0,
        results: []
      });
    });
    
    // Aggregate results
    results.forEach(result => {
      const categoryAgg = aggregation.get(result.category)!;
      categoryAgg.totalTests++;
      categoryAgg.results.push(result);
      categoryAgg.totalExecutionTime += result.duration;
      
      switch (result.status) {
        case TestStatus.PASSED:
          categoryAgg.passedTests++;
          break;
        case TestStatus.FAILED:
          categoryAgg.failedTests++;
          break;
        case TestStatus.SKIPPED:
          categoryAgg.skippedTests++;
          break;
        case TestStatus.WARNING:
          categoryAgg.warningTests++;
          break;
      }
    });
    
    // Calculate derived metrics
    aggregation.forEach(categoryAgg => {
      if (categoryAgg.totalTests > 0) {
        categoryAgg.averageExecutionTime = categoryAgg.totalExecutionTime / categoryAgg.totalTests;
        categoryAgg.successRate = (categoryAgg.passedTests / categoryAgg.totalTests) * 100;
      }
    });
    
    return aggregation;
  }

  /**
   * Aggregate results by verification level
   */
  aggregateByVerificationLevel(results: TestResult[]): Map<VerificationLevel, LevelAggregation> {
    const aggregation = new Map<VerificationLevel, LevelAggregation>();
    
    // Initialize all levels
    Object.values(VerificationLevel).forEach(level => {
      aggregation.set(level, {
        level,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        warningTests: 0,
        successRate: 0,
        results: []
      });
    });
    
    // Aggregate results
    results.forEach(result => {
      const levelAgg = aggregation.get(result.verificationLevel)!;
      levelAgg.totalTests++;
      levelAgg.results.push(result);
      
      switch (result.status) {
        case TestStatus.PASSED:
          levelAgg.passedTests++;
          break;
        case TestStatus.FAILED:
          levelAgg.failedTests++;
          break;
        case TestStatus.SKIPPED:
          levelAgg.skippedTests++;
          break;
        case TestStatus.WARNING:
          levelAgg.warningTests++;
          break;
      }
    });
    
    // Calculate success rates
    aggregation.forEach(levelAgg => {
      if (levelAgg.totalTests > 0) {
        levelAgg.successRate = (levelAgg.passedTests / levelAgg.totalTests) * 100;
      }
    });
    
    return aggregation;
  }

  /**
   * Aggregate error statistics
   */
  aggregateErrors(results: TestResult[]): ErrorAggregation {
    const failedResults = results.filter(r => r.status === TestStatus.FAILED && r.error);
    const errorsByType = new Map<ErrorType, number>();
    const errorsByCategory = new Map<TestCategory, number>();
    const criticalErrors: TestResult[] = [];
    
    failedResults.forEach(result => {
      if (result.error) {
        // Count by error type
        const currentCount = errorsByType.get(result.error.type) || 0;
        errorsByType.set(result.error.type, currentCount + 1);
        
        // Count by category
        const categoryCount = errorsByCategory.get(result.category) || 0;
        errorsByCategory.set(result.category, categoryCount + 1);
        
        // Track critical errors
        if (result.verificationLevel === VerificationLevel.CRITICAL) {
          criticalErrors.push(result);
        }
      }
    });
    
    return {
      totalErrors: failedResults.length,
      errorsByType,
      errorsByCategory,
      criticalErrors,
      mostCommonErrorType: this.getMostCommonKey(errorsByType),
      mostProblematicCategory: this.getMostCommonKey(errorsByCategory)
    };
  }

  /**
   * Aggregate performance metrics
   */
  aggregatePerformance(results: TestResult[]): PerformanceAggregation {
    const performanceResults = results.filter(r => r.details.performanceMetrics);
    
    if (performanceResults.length === 0) {
      return {
        totalMeasurements: 0,
        averageResponseTime: 0,
        medianResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        averageThroughput: 0,
        averageCacheHitRate: 0,
        slowestTests: [],
        fastestTests: []
      };
    }
    
    const responseTimes = performanceResults
      .map(r => r.details.performanceMetrics!.responseTime)
      .filter(time => time > 0)
      .sort((a, b) => a - b);
    
    const throughputs = performanceResults
      .map(r => r.details.performanceMetrics!.throughput)
      .filter(t => t !== undefined && t > 0) as number[];
    
    const cacheHitRates = performanceResults
      .map(r => r.details.performanceMetrics!.cacheHitRate)
      .filter(rate => rate !== undefined) as number[];
    
    // Calculate percentiles
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);
    const medianIndex = Math.floor(responseTimes.length * 0.5);
    
    // Find slowest and fastest tests
    const testsWithTimes = performanceResults.map(r => ({
      testName: r.testName,
      responseTime: r.details.performanceMetrics!.responseTime
    })).sort((a, b) => b.responseTime - a.responseTime);
    
    return {
      totalMeasurements: responseTimes.length,
      averageResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
      medianResponseTime: responseTimes[medianIndex] || 0,
      p95ResponseTime: responseTimes[p95Index] || 0,
      p99ResponseTime: responseTimes[p99Index] || 0,
      minResponseTime: responseTimes[0] || 0,
      maxResponseTime: responseTimes[responseTimes.length - 1] || 0,
      averageThroughput: throughputs.length > 0 
        ? throughputs.reduce((sum, t) => sum + t, 0) / throughputs.length 
        : 0,
      averageCacheHitRate: cacheHitRates.length > 0
        ? cacheHitRates.reduce((sum, rate) => sum + rate, 0) / cacheHitRates.length
        : 0,
      slowestTests: testsWithTimes.slice(0, 5),
      fastestTests: testsWithTimes.slice(-5).reverse()
    };
  }

  /**
   * Calculate test execution trends
   */
  calculateTrends(currentResults: TestResult[], previousResults?: TestResult[]): TrendAnalysis {
    if (!previousResults || previousResults.length === 0) {
      return {
        hasComparison: false,
        successRateChange: 0,
        executionTimeChange: 0,
        newFailures: [],
        resolvedFailures: [],
        regressions: [],
        improvements: []
      };
    }
    
    const currentStats = this.calculateBasicStats(currentResults);
    const previousStats = this.calculateBasicStats(previousResults);
    
    const successRateChange = currentStats.successRate - previousStats.successRate;
    const executionTimeChange = currentStats.averageExecutionTime - previousStats.averageExecutionTime;
    
    // Find new and resolved failures
    const currentFailures = new Set(
      currentResults.filter(r => r.status === TestStatus.FAILED).map(r => r.testName)
    );
    const previousFailures = new Set(
      previousResults.filter(r => r.status === TestStatus.FAILED).map(r => r.testName)
    );
    
    const newFailures = Array.from(currentFailures).filter(name => !previousFailures.has(name));
    const resolvedFailures = Array.from(previousFailures).filter(name => !currentFailures.has(name));
    
    // Find performance regressions and improvements
    const regressions: string[] = [];
    const improvements: string[] = [];
    
    currentResults.forEach(currentResult => {
      const previousResult = previousResults.find(r => r.testName === currentResult.testName);
      if (previousResult && 
          currentResult.details.performanceMetrics && 
          previousResult.details.performanceMetrics) {
        
        const currentTime = currentResult.details.performanceMetrics.responseTime;
        const previousTime = previousResult.details.performanceMetrics.responseTime;
        const changePercent = ((currentTime - previousTime) / previousTime) * 100;
        
        if (changePercent > 20) { // 20% slower
          regressions.push(currentResult.testName);
        } else if (changePercent < -20) { // 20% faster
          improvements.push(currentResult.testName);
        }
      }
    });
    
    return {
      hasComparison: true,
      successRateChange,
      executionTimeChange,
      newFailures,
      resolvedFailures,
      regressions,
      improvements
    };
  }

  /**
   * Generate test coverage analysis
   */
  analyzeCoverage(results: TestResult[]): CoverageAnalysis {
    const categoryAggregation = this.aggregateByCategory(results);
    const levelAggregation = this.aggregateByVerificationLevel(results);
    
    const categoryCoverage = new Map<TestCategory, number>();
    categoryAggregation.forEach((agg, category) => {
      categoryCoverage.set(category, agg.totalTests);
    });
    
    const levelCoverage = new Map<VerificationLevel, number>();
    levelAggregation.forEach((agg, level) => {
      levelCoverage.set(level, agg.totalTests);
    });
    
    // Find gaps (categories/levels with no tests)
    const missingCategories = Object.values(TestCategory).filter(
      category => (categoryCoverage.get(category) || 0) === 0
    );
    
    const missingLevels = Object.values(VerificationLevel).filter(
      level => (levelCoverage.get(level) || 0) === 0
    );
    
    return {
      totalTests: results.length,
      categoryCoverage,
      levelCoverage,
      missingCategories,
      missingLevels,
      coverageScore: this.calculateCoverageScore(categoryCoverage, levelCoverage)
    };
  }

  /**
   * Calculate basic statistics
   */
  private calculateBasicStats(results: TestResult[]): BasicStats {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.status === TestStatus.PASSED).length;
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    const averageExecutionTime = totalTests > 0 
      ? results.reduce((sum, r) => sum + r.duration, 0) / totalTests 
      : 0;
    
    return {
      totalTests,
      passedTests,
      successRate,
      averageExecutionTime
    };
  }

  /**
   * Get most common key from a map
   */
  private getMostCommonKey<T>(map: Map<T, number>): T | undefined {
    let maxCount = 0;
    let mostCommon: T | undefined;
    
    map.forEach((count, key) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = key;
      }
    });
    
    return mostCommon;
  }

  /**
   * Calculate coverage score (0-100)
   */
  private calculateCoverageScore(
    categoryCoverage: Map<TestCategory, number>,
    levelCoverage: Map<VerificationLevel, number>
  ): number {
    const totalCategories = Object.values(TestCategory).length;
    const totalLevels = Object.values(VerificationLevel).length;
    
    const coveredCategories = Array.from(categoryCoverage.values()).filter(count => count > 0).length;
    const coveredLevels = Array.from(levelCoverage.values()).filter(count => count > 0).length;
    
    const categoryScore = (coveredCategories / totalCategories) * 50;
    const levelScore = (coveredLevels / totalLevels) * 50;
    
    return categoryScore + levelScore;
  }
}

// Aggregation result interfaces
export interface CategoryAggregation {
  category: TestCategory;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  warningTests: number;
  averageExecutionTime: number;
  totalExecutionTime: number;
  successRate: number;
  results: TestResult[];
}

export interface LevelAggregation {
  level: VerificationLevel;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  warningTests: number;
  successRate: number;
  results: TestResult[];
}

export interface ErrorAggregation {
  totalErrors: number;
  errorsByType: Map<ErrorType, number>;
  errorsByCategory: Map<TestCategory, number>;
  criticalErrors: TestResult[];
  mostCommonErrorType?: ErrorType;
  mostProblematicCategory?: TestCategory;
}

export interface PerformanceAggregation {
  totalMeasurements: number;
  averageResponseTime: number;
  medianResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  averageThroughput: number;
  averageCacheHitRate: number;
  slowestTests: Array<{ testName: string; responseTime: number }>;
  fastestTests: Array<{ testName: string; responseTime: number }>;
}

export interface TrendAnalysis {
  hasComparison: boolean;
  successRateChange: number;
  executionTimeChange: number;
  newFailures: string[];
  resolvedFailures: string[];
  regressions: string[];
  improvements: string[];
}

export interface CoverageAnalysis {
  totalTests: number;
  categoryCoverage: Map<TestCategory, number>;
  levelCoverage: Map<VerificationLevel, number>;
  missingCategories: TestCategory[];
  missingLevels: VerificationLevel[];
  coverageScore: number;
}

interface BasicStats {
  totalTests: number;
  passedTests: number;
  successRate: number;
  averageExecutionTime: number;
}