# Performance and Cache Verification

This document describes the performance and cache verification implementation for the API verification system.

## Overview

The performance and cache verification system provides comprehensive testing capabilities for:

- **Response Time Benchmarking**: Measure API endpoint response times and validate against thresholds
- **Throughput Testing**: Test API performance under concurrent load
- **Cache Effectiveness**: Validate cache hit rates and performance improvements
- **Cache Invalidation**: Test cache revalidation functionality
- **Database Performance**: Verify query performance with new indexes
- **Memory Monitoring**: Track memory usage during performance tests

## Components

### 1. Performance Utilities (`utils/performance.ts`)

#### PerformanceBenchmark
Measures individual request performance and calculates statistics.

```typescript
const benchmark = new PerformanceBenchmark('Test Name');
const { result, measurement } = await benchmark.measure(async () => {
  // Your API call here
  return fetch('/api/endpoint');
});
const stats = benchmark.calculateStatistics();
```

#### ThroughputTester
Tests API performance under concurrent load.

```typescript
const tester = new ThroughputTester({
  duration: 30000,    // 30 seconds
  concurrency: 10,    // 10 concurrent users
  rampUpTime: 5000    // 5 second ramp-up
});

const result = await tester.runTest(async () => {
  return fetch('/api/endpoint');
});
```

#### PerformanceValidator
Validates performance results against configurable thresholds.

```typescript
const validator = new PerformanceValidator({
  maxResponseTime: 500,  // 500ms P95
  minThroughput: 10,     // 10 req/s minimum
  maxErrorRate: 0.01     // 1% error rate max
});

const validation = validator.validate(benchmarkResult);
```

#### MemoryMonitor
Tracks memory usage during test execution.

```typescript
const monitor = new MemoryMonitor();
const initialMemory = monitor.measure();
// ... run tests ...
const finalMemory = monitor.measure();
const delta = monitor.getDelta();
```

### 2. Cache Testing Utilities (`utils/cache.ts`)

#### CacheTester
Tests cache behavior and effectiveness.

```typescript
const cacheTester = new CacheTester('http://localhost:3000');

// Test cache hit rates
const hitRateResult = await cacheTester.testCacheHitRate('/api/topics', 10, 100);

// Test cache effectiveness
const effectivenessResult = await cacheTester.testCacheEffectiveness('/api/topics');

// Test cache invalidation
const invalidationResult = await cacheTester.testCacheInvalidation(
  '/api/topics',
  '/api/revalidate',
  { tags: ['all'] },
  { 'X-API-Key': 'your-api-key' }
);
```

#### CachePerformanceAnalyzer
Analyzes cache performance across multiple tests and generates reports.

```typescript
const analysis = CachePerformanceAnalyzer.analyzeCachePerformance(cacheResults);
const report = CachePerformanceAnalyzer.generateReport(cacheResults);
```

### 3. Configuration (`config/performance.ts`)

#### Performance Thresholds
Environment-specific performance expectations:

```typescript
const thresholds = {
  'GET /api/topics': {
    maxResponseTime: 200,
    minThroughput: 50,
    maxErrorRate: 0.005
  },
  'POST /api/ingest': {
    maxResponseTime: 1000,
    minThroughput: 5,
    maxErrorRate: 0.02
  }
};
```

#### Test Scenarios
Pre-configured test scenarios for different endpoints:

```typescript
const scenarios = [
  {
    name: 'topics-list-no-filters',
    endpoint: '/api/topics',
    method: 'GET',
    thresholds: ENDPOINT_THRESHOLDS['GET /api/topics']
  }
];
```

## Usage

### Running Performance Tests

```bash
# Run all performance and cache tests
npm test -- performance-cache-verification.test.ts --run

# Run the demo script
npx tsx tests/verification/run-performance-tests.ts
```

### Test Structure

The main test file (`performance-cache-verification.test.ts`) includes:

1. **Response Time Benchmarking**
   - GET /api/topics performance
   - GET /api/topics/[slug] performance  
   - POST /api/ingest performance

2. **Throughput Testing**
   - Single endpoint throughput
   - Concurrent request performance

3. **Cache Effectiveness Testing**
   - Cache hit rate validation
   - Cache effectiveness measurement
   - Concurrent cache behavior

4. **Cache Invalidation Testing**
   - Revalidation functionality
   - Cache recovery time

5. **Database Query Performance**
   - Index performance validation
   - Complex query testing

6. **Memory Usage Monitoring**
   - Memory leak detection
   - Resource usage tracking

7. **Performance Analysis and Reporting**
   - Comprehensive analysis
   - Recommendation generation

## Environment Considerations

### Development Environment
- More lenient thresholds (2x multiplier)
- Detailed logging enabled
- Memory monitoring enabled

### Test Environment  
- Standard thresholds
- Basic logging
- Focus on functionality over strict performance

### Production Environment
- Strict thresholds (0.8x multiplier)
- Minimal logging
- Performance-focused validation

## Cache Behavior Analysis

The system analyzes cache behavior by:

1. **Header Inspection**: Checking Next.js cache headers (`x-nextjs-cache`, `age`, etc.)
2. **Response Time Comparison**: Comparing first vs. subsequent request times
3. **Hit Rate Calculation**: Measuring cache effectiveness over multiple requests
4. **Invalidation Validation**: Verifying cache clears after revalidation

## Performance Metrics

### Response Time Metrics
- **Average**: Mean response time
- **P95**: 95th percentile response time
- **P99**: 99th percentile response time
- **Min/Max**: Fastest and slowest responses

### Throughput Metrics
- **Requests/Second**: Sustained request rate
- **Concurrent Performance**: Performance under load
- **Error Rate**: Percentage of failed requests
- **Success Rate**: Percentage of successful requests

### Cache Metrics
- **Hit Rate**: Percentage of requests served from cache
- **Miss Rate**: Percentage of requests requiring fresh data
- **Effectiveness**: Performance improvement ratio (miss time / hit time)
- **Recovery Time**: Time to repopulate cache after invalidation

## Troubleshooting

### Common Issues

1. **Low Cache Hit Rates**
   - Check cache configuration
   - Verify cache headers
   - Review TTL settings

2. **High Response Times**
   - Check database indexes
   - Review query optimization
   - Validate server resources

3. **Authentication Failures**
   - Verify API keys in test environment
   - Check HMAC signature generation
   - Validate request headers

### Test Environment Limitations

- Cache may not be configured optimally
- Database may not have production-like data
- Network conditions may vary
- Authentication may not be fully configured

The tests are designed to be lenient in test environments while still validating core functionality.

## Integration

This performance verification system integrates with:

- **Vitest**: Test framework and runner
- **Next.js**: Cache header detection
- **Prisma**: Database performance monitoring
- **Node.js**: Memory usage tracking

## Future Enhancements

Potential improvements include:

- **Real-time Monitoring**: Continuous performance tracking
- **Alerting System**: Automated performance degradation alerts
- **Historical Tracking**: Performance trend analysis
- **Load Testing**: Extended stress testing capabilities
- **Custom Metrics**: Application-specific performance indicators