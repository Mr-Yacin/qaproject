/**
 * Cache testing utilities for API verification
 */

export interface CacheTestResult {
  testName: string;
  cacheHitRate: number;
  cacheMissRate: number;
  averageHitResponseTime: number;
  averageMissResponseTime: number;
  cacheEffectiveness: number; // Performance improvement ratio
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  measurements: CacheMeasurement[];
}

export interface CacheMeasurement {
  requestId: string;
  timestamp: number;
  responseTime: number;
  cacheStatus: 'HIT' | 'MISS' | 'STALE' | 'UNKNOWN';
  headers: Record<string, string>;
  url: string;
}

export interface CacheInvalidationTest {
  testName: string;
  beforeInvalidation: CacheMeasurement[];
  afterInvalidation: CacheMeasurement[];
  invalidationSuccessful: boolean;
  invalidationTime: number;
  cacheRecoveryTime?: number;
}

/**
 * Cache testing and validation utilities
 */
export class CacheTester {
  private measurements: CacheMeasurement[] = [];
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Test cache hit/miss rates for identical requests
   */
  async testCacheHitRate(
    endpoint: string,
    requestCount: number = 10,
    requestDelay: number = 100
  ): Promise<CacheTestResult> {
    const testName = `Cache Hit Rate Test - ${endpoint}`;
    const measurements: CacheMeasurement[] = [];
    
    // Make multiple identical requests
    for (let i = 0; i < requestCount; i++) {
      const measurement = await this.makeRequest(endpoint, `request-${i}`);
      measurements.push(measurement);
      
      if (i < requestCount - 1 && requestDelay > 0) {
        await this.delay(requestDelay);
      }
    }

    return this.analyzeCachePerformance(testName, measurements);
  }

  /**
   * Test cache effectiveness by comparing first request vs subsequent requests
   */
  async testCacheEffectiveness(
    endpoint: string,
    warmupRequests: number = 1,
    testRequests: number = 5
  ): Promise<CacheTestResult> {
    const testName = `Cache Effectiveness Test - ${endpoint}`;
    const measurements: CacheMeasurement[] = [];

    // Warmup requests to populate cache
    for (let i = 0; i < warmupRequests; i++) {
      const measurement = await this.makeRequest(endpoint, `warmup-${i}`);
      measurements.push(measurement);
      await this.delay(100); // Small delay between warmup requests
    }

    // Wait a bit to ensure cache is populated
    await this.delay(500);

    // Test requests that should hit cache
    for (let i = 0; i < testRequests; i++) {
      const measurement = await this.makeRequest(endpoint, `test-${i}`);
      measurements.push(measurement);
      await this.delay(50);
    }

    return this.analyzeCachePerformance(testName, measurements);
  }

  /**
   * Test cache invalidation functionality
   */
  async testCacheInvalidation(
    endpoint: string,
    invalidationEndpoint: string,
    invalidationPayload: any,
    headers: Record<string, string> = {}
  ): Promise<CacheInvalidationTest> {
    const testName = `Cache Invalidation Test - ${endpoint}`;
    
    // Step 1: Make requests to populate cache
    const beforeInvalidation: CacheMeasurement[] = [];
    for (let i = 0; i < 3; i++) {
      const measurement = await this.makeRequest(endpoint, `before-${i}`);
      beforeInvalidation.push(measurement);
      await this.delay(100);
    }

    // Step 2: Trigger cache invalidation
    const invalidationStart = performance.now();
    const invalidationResponse = await this.makeInvalidationRequest(
      invalidationEndpoint,
      invalidationPayload,
      headers
    );
    const invalidationTime = performance.now() - invalidationStart;

    // Step 3: Wait a bit for invalidation to propagate
    await this.delay(1000);

    // Step 4: Make requests after invalidation
    const afterInvalidation: CacheMeasurement[] = [];
    for (let i = 0; i < 3; i++) {
      const measurement = await this.makeRequest(endpoint, `after-${i}`);
      afterInvalidation.push(measurement);
      await this.delay(100);
    }

    // Analyze if invalidation was successful
    const invalidationSuccessful = this.analyzeInvalidationSuccess(
      beforeInvalidation,
      afterInvalidation
    );

    return {
      testName,
      beforeInvalidation,
      afterInvalidation,
      invalidationSuccessful,
      invalidationTime,
      cacheRecoveryTime: this.calculateCacheRecoveryTime(afterInvalidation)
    };
  }

  /**
   * Test cache behavior under concurrent load
   */
  async testCacheConcurrency(
    endpoint: string,
    concurrentRequests: number = 10
  ): Promise<CacheTestResult> {
    const testName = `Cache Concurrency Test - ${endpoint}`;
    
    // Make concurrent requests
    const promises = Array.from({ length: concurrentRequests }, (_, i) =>
      this.makeRequest(endpoint, `concurrent-${i}`)
    );

    const measurements = await Promise.all(promises);
    return this.analyzeCachePerformance(testName, measurements);
  }

  /**
   * Make a request and measure cache performance
   */
  private async makeRequest(endpoint: string, requestId: string): Promise<CacheMeasurement> {
    const url = `${this.baseUrl}${endpoint}`;
    const startTime = performance.now();
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Cache-Tester/1.0'
        }
      });

      const responseTime = performance.now() - startTime;
      const headers: Record<string, string> = {};
      
      // Collect relevant headers
      response.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });

      const cacheStatus = this.determineCacheStatus(headers);

      return {
        requestId,
        timestamp: Date.now(),
        responseTime,
        cacheStatus,
        headers,
        url
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      
      return {
        requestId,
        timestamp: Date.now(),
        responseTime,
        cacheStatus: 'UNKNOWN',
        headers: {},
        url
      };
    }
  }

  /**
   * Make cache invalidation request
   */
  private async makeInvalidationRequest(
    endpoint: string,
    payload: any,
    headers: Record<string, string>
  ): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(payload)
    });
  }

  /**
   * Determine cache status from response headers
   */
  private determineCacheStatus(headers: Record<string, string>): CacheMeasurement['cacheStatus'] {
    // Check Next.js cache headers
    const cacheControl = headers['cache-control'] || '';
    const xNextjsCache = headers['x-nextjs-cache'] || '';
    const age = headers['age'];
    const etag = headers['etag'];
    const lastModified = headers['last-modified'];

    // Next.js specific cache indicators
    if (xNextjsCache === 'HIT') return 'HIT';
    if (xNextjsCache === 'MISS') return 'MISS';
    if (xNextjsCache === 'STALE') return 'STALE';

    // Standard cache indicators
    if (age && parseInt(age) > 0) return 'HIT';
    if (cacheControl.includes('max-age=0') || cacheControl.includes('no-cache')) return 'MISS';
    
    // If we have cache-related headers but can't determine status
    if (etag || lastModified || cacheControl) return 'UNKNOWN';
    
    return 'MISS'; // Default assumption
  }

  /**
   * Analyze cache performance from measurements
   */
  private analyzeCachePerformance(testName: string, measurements: CacheMeasurement[]): CacheTestResult {
    const cacheHits = measurements.filter(m => m.cacheStatus === 'HIT');
    const cacheMisses = measurements.filter(m => m.cacheStatus === 'MISS');
    
    const cacheHitRate = cacheHits.length / measurements.length;
    const cacheMissRate = cacheMisses.length / measurements.length;
    
    const averageHitResponseTime = cacheHits.length > 0
      ? cacheHits.reduce((sum, m) => sum + m.responseTime, 0) / cacheHits.length
      : 0;
    
    const averageMissResponseTime = cacheMisses.length > 0
      ? cacheMisses.reduce((sum, m) => sum + m.responseTime, 0) / cacheMisses.length
      : 0;
    
    // Calculate cache effectiveness (how much faster cache hits are)
    const cacheEffectiveness = averageMissResponseTime > 0 && averageHitResponseTime > 0
      ? averageMissResponseTime / averageHitResponseTime
      : 1;

    return {
      testName,
      cacheHitRate,
      cacheMissRate,
      averageHitResponseTime,
      averageMissResponseTime,
      cacheEffectiveness,
      totalRequests: measurements.length,
      cacheHits: cacheHits.length,
      cacheMisses: cacheMisses.length,
      measurements
    };
  }

  /**
   * Analyze if cache invalidation was successful
   */
  private analyzeInvalidationSuccess(
    beforeInvalidation: CacheMeasurement[],
    afterInvalidation: CacheMeasurement[]
  ): boolean {
    // Check if response times increased after invalidation (indicating cache miss)
    const avgBefore = beforeInvalidation.reduce((sum, m) => sum + m.responseTime, 0) / beforeInvalidation.length;
    const avgAfter = afterInvalidation.slice(0, 1).reduce((sum, m) => sum + m.responseTime, 0); // First request after invalidation
    
    // If first request after invalidation is significantly slower, invalidation likely worked
    const significantIncrease = avgAfter > avgBefore * 1.5;
    
    // Also check cache status headers
    const firstAfterInvalidation = afterInvalidation[0];
    const cacheStatusIndicatesInvalidation = firstAfterInvalidation?.cacheStatus === 'MISS';
    
    return significantIncrease || cacheStatusIndicatesInvalidation;
  }

  /**
   * Calculate how long it takes for cache to recover after invalidation
   */
  private calculateCacheRecoveryTime(afterInvalidation: CacheMeasurement[]): number | undefined {
    if (afterInvalidation.length < 2) return undefined;
    
    const firstRequest = afterInvalidation[0];
    const subsequentHit = afterInvalidation.find(m => m.cacheStatus === 'HIT');
    
    if (subsequentHit) {
      return subsequentHit.timestamp - firstRequest.timestamp;
    }
    
    return undefined;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reset measurements
   */
  reset(): void {
    this.measurements = [];
  }

  /**
   * Get all measurements
   */
  getMeasurements(): CacheMeasurement[] {
    return [...this.measurements];
  }
}

/**
 * Cache performance analyzer
 */
export class CachePerformanceAnalyzer {
  /**
   * Analyze cache performance across multiple test results
   */
  static analyzeCachePerformance(results: CacheTestResult[]): {
    overallCacheHitRate: number;
    averagePerformanceImprovement: number;
    recommendations: string[];
    issues: Array<{
      severity: 'low' | 'medium' | 'high';
      message: string;
      metric: string;
      value: number;
    }>;
  } {
    const totalRequests = results.reduce((sum, r) => sum + r.totalRequests, 0);
    const totalHits = results.reduce((sum, r) => sum + r.cacheHits, 0);
    
    const overallCacheHitRate = totalRequests > 0 ? totalHits / totalRequests : 0;
    
    const effectivenessValues = results
      .filter(r => r.cacheEffectiveness > 1)
      .map(r => r.cacheEffectiveness);
    
    const averagePerformanceImprovement = effectivenessValues.length > 0
      ? effectivenessValues.reduce((sum, v) => sum + v, 0) / effectivenessValues.length
      : 1;

    const recommendations: string[] = [];
    const issues: Array<{
      severity: 'low' | 'medium' | 'high';
      message: string;
      metric: string;
      value: number;
    }> = [];

    // Analyze cache hit rate
    if (overallCacheHitRate < 0.5) {
      issues.push({
        severity: 'high',
        message: 'Cache hit rate is below 50%, indicating poor cache effectiveness',
        metric: 'cacheHitRate',
        value: overallCacheHitRate
      });
      recommendations.push('Review cache configuration and TTL settings');
      recommendations.push('Consider implementing cache warming strategies');
    } else if (overallCacheHitRate < 0.8) {
      issues.push({
        severity: 'medium',
        message: 'Cache hit rate could be improved',
        metric: 'cacheHitRate',
        value: overallCacheHitRate
      });
      recommendations.push('Optimize cache key strategies');
    }

    // Analyze performance improvement
    if (averagePerformanceImprovement < 2) {
      issues.push({
        severity: 'medium',
        message: 'Cache performance improvement is less than 2x',
        metric: 'performanceImprovement',
        value: averagePerformanceImprovement
      });
      recommendations.push('Review cache storage backend performance');
      recommendations.push('Consider implementing more aggressive caching strategies');
    }

    // Check for inconsistent cache behavior
    const hitRateVariance = this.calculateVariance(results.map(r => r.cacheHitRate));
    if (hitRateVariance > 0.1) {
      issues.push({
        severity: 'medium',
        message: 'Inconsistent cache hit rates across different endpoints',
        metric: 'hitRateVariance',
        value: hitRateVariance
      });
      recommendations.push('Standardize cache configuration across endpoints');
    }

    return {
      overallCacheHitRate,
      averagePerformanceImprovement,
      recommendations,
      issues
    };
  }

  /**
   * Calculate variance of an array of numbers
   */
  private static calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * Generate cache performance report
   */
  static generateReport(results: CacheTestResult[]): string {
    const analysis = this.analyzeCachePerformance(results);
    
    let report = '# Cache Performance Report\n\n';
    
    report += '## Summary\n';
    report += `- Overall Cache Hit Rate: ${(analysis.overallCacheHitRate * 100).toFixed(2)}%\n`;
    report += `- Average Performance Improvement: ${analysis.averagePerformanceImprovement.toFixed(2)}x\n`;
    report += `- Total Tests: ${results.length}\n\n`;
    
    report += '## Test Results\n';
    results.forEach(result => {
      report += `### ${result.testName}\n`;
      report += `- Cache Hit Rate: ${(result.cacheHitRate * 100).toFixed(2)}%\n`;
      report += `- Cache Miss Rate: ${(result.cacheMissRate * 100).toFixed(2)}%\n`;
      report += `- Average Hit Response Time: ${result.averageHitResponseTime.toFixed(2)}ms\n`;
      report += `- Average Miss Response Time: ${result.averageMissResponseTime.toFixed(2)}ms\n`;
      report += `- Cache Effectiveness: ${result.cacheEffectiveness.toFixed(2)}x\n`;
      report += `- Total Requests: ${result.totalRequests}\n\n`;
    });
    
    if (analysis.issues.length > 0) {
      report += '## Issues Found\n';
      analysis.issues.forEach(issue => {
        report += `- **${issue.severity.toUpperCase()}**: ${issue.message} (${issue.metric}: ${issue.value.toFixed(3)})\n`;
      });
      report += '\n';
    }
    
    if (analysis.recommendations.length > 0) {
      report += '## Recommendations\n';
      analysis.recommendations.forEach(rec => {
        report += `- ${rec}\n`;
      });
      report += '\n';
    }
    
    return report;
  }
}