/**
 * Performance benchmarking utilities for API verification
 */

export interface PerformanceMeasurement {
  startTime: number;
  endTime: number;
  duration: number;
  memoryUsage?: NodeJS.MemoryUsage;
}

export interface BenchmarkResult {
  testName: string;
  measurements: PerformanceMeasurement[];
  statistics: {
    min: number;
    max: number;
    average: number;
    median: number;
    p95: number;
    p99: number;
  };
  throughput: number;
  errorRate: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
}

export interface PerformanceThresholds {
  maxResponseTime: number;
  minThroughput: number;
  maxErrorRate: number;
  maxMemoryUsage?: number;
}

export interface ThroughputTestConfig {
  duration: number; // Test duration in milliseconds
  concurrency: number; // Number of concurrent requests
  rampUpTime?: number; // Time to ramp up to full concurrency
  requestDelay?: number; // Delay between requests in ms
}

/**
 * Performance measurement and benchmarking utilities
 */
export class PerformanceBenchmark {
  private measurements: PerformanceMeasurement[] = [];
  private testName: string;
  private startTime: number = 0;

  constructor(testName: string) {
    this.testName = testName;
  }

  /**
   * Start measuring performance
   */
  start(): void {
    this.startTime = performance.now();
  }

  /**
   * End measurement and record result
   */
  end(): PerformanceMeasurement {
    const endTime = performance.now();
    const measurement: PerformanceMeasurement = {
      startTime: this.startTime,
      endTime,
      duration: endTime - this.startTime,
      memoryUsage: process.memoryUsage()
    };
    
    this.measurements.push(measurement);
    return measurement;
  }

  /**
   * Measure a function execution
   */
  async measure<T>(fn: () => Promise<T>): Promise<{ result: T; measurement: PerformanceMeasurement }> {
    this.start();
    try {
      const result = await fn();
      const measurement = this.end();
      return { result, measurement };
    } catch (error) {
      const measurement = this.end();
      throw error;
    }
  }

  /**
   * Get all measurements
   */
  getMeasurements(): PerformanceMeasurement[] {
    return [...this.measurements];
  }

  /**
   * Calculate statistics from measurements
   */
  calculateStatistics(): BenchmarkResult['statistics'] {
    if (this.measurements.length === 0) {
      throw new Error('No measurements available');
    }

    const durations = this.measurements.map(m => m.duration).sort((a, b) => a - b);
    const sum = durations.reduce((acc, val) => acc + val, 0);

    return {
      min: durations[0],
      max: durations[durations.length - 1],
      average: sum / durations.length,
      median: this.calculatePercentile(durations, 50),
      p95: this.calculatePercentile(durations, 95),
      p99: this.calculatePercentile(durations, 99)
    };
  }

  /**
   * Calculate percentile from sorted array
   */
  private calculatePercentile(sortedArray: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sortedArray[lower];
    }
    
    const weight = index - lower;
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  /**
   * Reset measurements
   */
  reset(): void {
    this.measurements = [];
  }
}

/**
 * Throughput testing utilities
 */
export class ThroughputTester {
  private config: ThroughputTestConfig;
  private results: Array<{ success: boolean; duration: number; error?: string }> = [];

  constructor(config: ThroughputTestConfig) {
    this.config = config;
  }

  /**
   * Run throughput test
   */
  async runTest<T>(
    testFunction: () => Promise<T>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<BenchmarkResult> {
    const startTime = Date.now();
    const endTime = startTime + this.config.duration;
    const promises: Promise<void>[] = [];
    let requestCount = 0;

    // Create concurrent workers
    for (let i = 0; i < this.config.concurrency; i++) {
      promises.push(this.runWorker(testFunction, endTime, () => {
        requestCount++;
        if (onProgress) {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / this.config.duration, 1);
          onProgress(Math.floor(progress * 100), 100);
        }
      }));
    }

    // Wait for all workers to complete
    await Promise.all(promises);

    const totalDuration = Date.now() - startTime;
    const successfulRequests = this.results.filter(r => r.success).length;
    const failedRequests = this.results.length - successfulRequests;

    // Calculate statistics
    const durations = this.results
      .filter(r => r.success)
      .map(r => r.duration)
      .sort((a, b) => a - b);

    const statistics = durations.length > 0 ? {
      min: durations[0],
      max: durations[durations.length - 1],
      average: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      median: this.calculatePercentile(durations, 50),
      p95: this.calculatePercentile(durations, 95),
      p99: this.calculatePercentile(durations, 99)
    } : {
      min: 0, max: 0, average: 0, median: 0, p95: 0, p99: 0
    };

    return {
      testName: `Throughput Test (${this.config.concurrency} concurrent)`,
      measurements: this.results.map(r => ({
        startTime: 0,
        endTime: r.duration,
        duration: r.duration
      })),
      statistics,
      throughput: (successfulRequests / totalDuration) * 1000, // requests per second
      errorRate: failedRequests / this.results.length,
      totalRequests: this.results.length,
      successfulRequests,
      failedRequests
    };
  }

  /**
   * Worker function for concurrent execution
   */
  private async runWorker<T>(
    testFunction: () => Promise<T>,
    endTime: number,
    onRequest: () => void
  ): Promise<void> {
    while (Date.now() < endTime) {
      const startTime = performance.now();
      
      try {
        await testFunction();
        const duration = performance.now() - startTime;
        this.results.push({ success: true, duration });
      } catch (error) {
        const duration = performance.now() - startTime;
        this.results.push({ 
          success: false, 
          duration, 
          error: error instanceof Error ? error.message : String(error)
        });
      }

      onRequest();

      // Add delay if configured
      if (this.config.requestDelay && this.config.requestDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, this.config.requestDelay));
      }
    }
  }

  /**
   * Calculate percentile from sorted array
   */
  private calculatePercentile(sortedArray: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sortedArray[lower];
    }
    
    const weight = index - lower;
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  /**
   * Reset results
   */
  reset(): void {
    this.results = [];
  }
}

/**
 * Performance threshold validator
 */
export class PerformanceValidator {
  private thresholds: PerformanceThresholds;

  constructor(thresholds: PerformanceThresholds) {
    this.thresholds = thresholds;
  }

  /**
   * Validate benchmark results against thresholds
   */
  validate(result: BenchmarkResult): {
    passed: boolean;
    violations: Array<{
      metric: string;
      actual: number;
      threshold: number;
      message: string;
    }>;
  } {
    const violations: Array<{
      metric: string;
      actual: number;
      threshold: number;
      message: string;
    }> = [];

    // Check response time
    if (result.statistics.p95 > this.thresholds.maxResponseTime) {
      violations.push({
        metric: 'p95ResponseTime',
        actual: result.statistics.p95,
        threshold: this.thresholds.maxResponseTime,
        message: `P95 response time (${result.statistics.p95.toFixed(2)}ms) exceeds threshold (${this.thresholds.maxResponseTime}ms)`
      });
    }

    // Check throughput
    if (result.throughput < this.thresholds.minThroughput) {
      violations.push({
        metric: 'throughput',
        actual: result.throughput,
        threshold: this.thresholds.minThroughput,
        message: `Throughput (${result.throughput.toFixed(2)} req/s) below threshold (${this.thresholds.minThroughput} req/s)`
      });
    }

    // Check error rate
    if (result.errorRate > this.thresholds.maxErrorRate) {
      violations.push({
        metric: 'errorRate',
        actual: result.errorRate,
        threshold: this.thresholds.maxErrorRate,
        message: `Error rate (${(result.errorRate * 100).toFixed(2)}%) exceeds threshold (${(this.thresholds.maxErrorRate * 100).toFixed(2)}%)`
      });
    }

    return {
      passed: violations.length === 0,
      violations
    };
  }

  /**
   * Update thresholds
   */
  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }
}

/**
 * Memory usage monitoring utilities
 */
export class MemoryMonitor {
  private baseline: NodeJS.MemoryUsage;
  private measurements: Array<{ timestamp: number; usage: NodeJS.MemoryUsage }> = [];

  constructor() {
    this.baseline = process.memoryUsage();
  }

  /**
   * Take a memory measurement
   */
  measure(): NodeJS.MemoryUsage {
    const usage = process.memoryUsage();
    this.measurements.push({
      timestamp: Date.now(),
      usage
    });
    return usage;
  }

  /**
   * Get memory usage delta from baseline
   */
  getDelta(): NodeJS.MemoryUsage {
    const current = process.memoryUsage();
    return {
      rss: current.rss - this.baseline.rss,
      heapTotal: current.heapTotal - this.baseline.heapTotal,
      heapUsed: current.heapUsed - this.baseline.heapUsed,
      external: current.external - this.baseline.external,
      arrayBuffers: current.arrayBuffers - this.baseline.arrayBuffers
    };
  }

  /**
   * Get all measurements
   */
  getMeasurements(): Array<{ timestamp: number; usage: NodeJS.MemoryUsage }> {
    return [...this.measurements];
  }

  /**
   * Reset measurements and baseline
   */
  reset(): void {
    this.baseline = process.memoryUsage();
    this.measurements = [];
  }

  /**
   * Format memory usage for display
   */
  static formatMemoryUsage(usage: NodeJS.MemoryUsage): string {
    const formatBytes = (bytes: number): string => {
      const mb = bytes / 1024 / 1024;
      return `${mb.toFixed(2)} MB`;
    };

    return [
      `RSS: ${formatBytes(usage.rss)}`,
      `Heap Total: ${formatBytes(usage.heapTotal)}`,
      `Heap Used: ${formatBytes(usage.heapUsed)}`,
      `External: ${formatBytes(usage.external)}`,
      `Array Buffers: ${formatBytes(usage.arrayBuffers)}`
    ].join(', ');
  }
}