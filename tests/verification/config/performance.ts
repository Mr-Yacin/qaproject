/**
 * Performance test configuration
 */

import { PerformanceThresholds, ThroughputTestConfig } from '../utils/performance';

/**
 * Default performance thresholds for API endpoints
 */
export const DEFAULT_PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  maxResponseTime: 500, // 500ms for P95
  minThroughput: 10, // 10 requests per second minimum
  maxErrorRate: 0.01, // 1% error rate maximum
  maxMemoryUsage: 100 * 1024 * 1024 // 100MB maximum memory increase
};

/**
 * Performance thresholds for different endpoint types
 */
export const ENDPOINT_THRESHOLDS: Record<string, PerformanceThresholds> = {
  // Simple GET endpoints should be fast
  'GET /api/topics': {
    maxResponseTime: 200,
    minThroughput: 50,
    maxErrorRate: 0.005,
    maxMemoryUsage: 50 * 1024 * 1024
  },
  
  // Individual topic retrieval with relations
  'GET /api/topics/[slug]': {
    maxResponseTime: 300,
    minThroughput: 30,
    maxErrorRate: 0.01,
    maxMemoryUsage: 75 * 1024 * 1024
  },
  
  // Content ingestion is more complex
  'POST /api/ingest': {
    maxResponseTime: 1000,
    minThroughput: 5,
    maxErrorRate: 0.02,
    maxMemoryUsage: 150 * 1024 * 1024
  },
  
  // Cache revalidation
  'POST /api/revalidate': {
    maxResponseTime: 800,
    minThroughput: 8,
    maxErrorRate: 0.01,
    maxMemoryUsage: 100 * 1024 * 1024
  }
};

/**
 * Throughput test configurations for different scenarios
 */
export const THROUGHPUT_TEST_CONFIGS: Record<string, ThroughputTestConfig> = {
  // Quick smoke test
  quick: {
    duration: 10000, // 10 seconds
    concurrency: 5,
    rampUpTime: 2000,
    requestDelay: 100
  },
  
  // Standard load test
  standard: {
    duration: 30000, // 30 seconds
    concurrency: 10,
    rampUpTime: 5000,
    requestDelay: 50
  },
  
  // Stress test
  stress: {
    duration: 60000, // 1 minute
    concurrency: 20,
    rampUpTime: 10000,
    requestDelay: 25
  },
  
  // Burst test (high concurrency, short duration)
  burst: {
    duration: 5000, // 5 seconds
    concurrency: 50,
    rampUpTime: 1000,
    requestDelay: 10
  }
};

/**
 * Test scenarios for different API endpoints
 */
export interface PerformanceTestScenario {
  name: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  thresholds: PerformanceThresholds;
  throughputConfig: ThroughputTestConfig;
}

export const PERFORMANCE_TEST_SCENARIOS: PerformanceTestScenario[] = [
  {
    name: 'topics-list-no-filters',
    description: 'GET /api/topics without filters',
    endpoint: '/api/topics',
    method: 'GET',
    thresholds: ENDPOINT_THRESHOLDS['GET /api/topics'],
    throughputConfig: THROUGHPUT_TEST_CONFIGS.standard
  },
  {
    name: 'topics-list-with-filters',
    description: 'GET /api/topics with tag and locale filters',
    endpoint: '/api/topics?tags=technology&locale=en&limit=10',
    method: 'GET',
    thresholds: ENDPOINT_THRESHOLDS['GET /api/topics'],
    throughputConfig: THROUGHPUT_TEST_CONFIGS.standard
  },
  {
    name: 'topic-by-slug',
    description: 'GET /api/topics/[slug] for individual topic',
    endpoint: '/api/topics/test-topic-1',
    method: 'GET',
    thresholds: ENDPOINT_THRESHOLDS['GET /api/topics/[slug]'],
    throughputConfig: THROUGHPUT_TEST_CONFIGS.standard
  },
  {
    name: 'ingest-endpoint',
    description: 'POST /api/ingest with valid payload',
    endpoint: '/api/ingest',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.TEST_API_KEY || 'test-api-key'
    },
    body: {
      slug: 'perf-test-topic',
      title: 'Performance Test Topic',
      locale: 'en',
      tags: ['performance', 'testing'],
      mainQuestion: 'How fast is this API?',
      article: {
        content: 'This is a performance test article.',
        status: 'PUBLISHED'
      },
      faqItems: [
        {
          question: 'Is this fast?',
          answer: 'We are testing to find out.',
          order: 1
        }
      ]
    },
    thresholds: ENDPOINT_THRESHOLDS['POST /api/ingest'],
    throughputConfig: THROUGHPUT_TEST_CONFIGS.quick // Use quick config for write operations
  },
  {
    name: 'revalidate-endpoint',
    description: 'POST /api/revalidate to clear cache',
    endpoint: '/api/revalidate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.TEST_API_KEY || 'test-api-key'
    },
    body: {
      tags: ['performance']
    },
    thresholds: ENDPOINT_THRESHOLDS['POST /api/revalidate'],
    throughputConfig: THROUGHPUT_TEST_CONFIGS.quick
  }
];

/**
 * Environment-specific performance configurations
 */
export const ENVIRONMENT_CONFIGS = {
  development: {
    // More lenient thresholds for development
    thresholdMultiplier: 2.0,
    enableMemoryMonitoring: true,
    enableDetailedLogging: true
  },
  
  test: {
    // Standard thresholds for testing
    thresholdMultiplier: 1.0,
    enableMemoryMonitoring: true,
    enableDetailedLogging: false
  },
  
  production: {
    // Strict thresholds for production
    thresholdMultiplier: 0.8,
    enableMemoryMonitoring: false,
    enableDetailedLogging: false
  }
};

/**
 * Get environment-adjusted thresholds
 */
export function getEnvironmentThresholds(
  baseThresholds: PerformanceThresholds,
  environment: keyof typeof ENVIRONMENT_CONFIGS = 'test'
): PerformanceThresholds {
  const config = ENVIRONMENT_CONFIGS[environment];
  const multiplier = config.thresholdMultiplier;
  
  return {
    maxResponseTime: baseThresholds.maxResponseTime * multiplier,
    minThroughput: baseThresholds.minThroughput / multiplier,
    maxErrorRate: baseThresholds.maxErrorRate * multiplier,
    maxMemoryUsage: baseThresholds.maxMemoryUsage ? baseThresholds.maxMemoryUsage * multiplier : undefined
  };
}