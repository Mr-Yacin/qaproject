#!/usr/bin/env node

/**
 * Simple script to run performance and cache verification tests
 * This demonstrates the performance testing utilities in action
 */

import { 
  PerformanceBenchmark, 
  ThroughputTester, 
  PerformanceValidator,
  MemoryMonitor
} from './utils/performance';
import { CacheTester, CachePerformanceAnalyzer } from './utils/cache';
import { DEFAULT_PERFORMANCE_THRESHOLDS, getEnvironmentThresholds } from './config/performance';
import { TestConfigUtils } from './utils';

async function runPerformanceDemo() {
  console.log('🚀 Performance and Cache Testing Demo\n');
  
  const apiBaseUrl = TestConfigUtils.getApiBaseUrl();
  const memoryMonitor = new MemoryMonitor();
  
  console.log(`Testing API at: ${apiBaseUrl}`);
  console.log(`Initial memory: ${MemoryMonitor.formatMemoryUsage(memoryMonitor.measure())}\n`);

  // 1. Basic Response Time Test
  console.log('📊 Testing Response Times...');
  const benchmark = new PerformanceBenchmark('GET /api/topics Demo');
  
  try {
    const measurements = [];
    for (let i = 0; i < 5; i++) {
      const { measurement } = await benchmark.measure(async () => {
        const response = await fetch(`${apiBaseUrl}/api/topics?limit=5`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      });
      measurements.push(measurement);
      process.stdout.write('.');
    }
    
    const stats = benchmark.calculateStatistics();
    console.log(`\n✅ Response Time Results:
    - Average: ${stats.average.toFixed(2)}ms
    - Min: ${stats.min.toFixed(2)}ms
    - Max: ${stats.max.toFixed(2)}ms
    - P95: ${stats.p95.toFixed(2)}ms\n`);
    
  } catch (error) {
    console.log(`\n❌ Response time test failed: ${error}\n`);
  }

  // 2. Throughput Test
  console.log('🔄 Testing Throughput...');
  const throughputTester = new ThroughputTester({
    duration: 5000, // 5 seconds
    concurrency: 3,  // Low concurrency for demo
    rampUpTime: 1000
  });

  try {
    const result = await throughputTester.runTest(async () => {
      const response = await fetch(`${apiBaseUrl}/api/topics?limit=3`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    }, (completed, total) => {
      if (completed % 20 === 0) {
        process.stdout.write('.');
      }
    });

    console.log(`\n✅ Throughput Results:
    - Requests/second: ${result.throughput.toFixed(2)}
    - Total requests: ${result.totalRequests}
    - Success rate: ${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%
    - Average response time: ${result.statistics.average.toFixed(2)}ms\n`);
    
  } catch (error) {
    console.log(`\n❌ Throughput test failed: ${error}\n`);
  }

  // 3. Cache Testing
  console.log('💾 Testing Cache Behavior...');
  const cacheTester = new CacheTester(apiBaseUrl);

  try {
    const cacheResult = await cacheTester.testCacheHitRate('/api/topics?limit=3', 6, 200);
    
    console.log(`✅ Cache Results:
    - Hit rate: ${(cacheResult.cacheHitRate * 100).toFixed(1)}%
    - Miss rate: ${(cacheResult.cacheMissRate * 100).toFixed(1)}%
    - Average hit time: ${cacheResult.averageHitResponseTime.toFixed(2)}ms
    - Average miss time: ${cacheResult.averageMissResponseTime.toFixed(2)}ms
    - Cache effectiveness: ${cacheResult.cacheEffectiveness.toFixed(2)}x\n`);
    
    // Generate cache analysis
    const analysis = CachePerformanceAnalyzer.analyzeCachePerformance([cacheResult]);
    console.log(`📈 Cache Analysis:
    - Overall hit rate: ${(analysis.overallCacheHitRate * 100).toFixed(1)}%
    - Performance improvement: ${analysis.averagePerformanceImprovement.toFixed(2)}x`);
    
    if (analysis.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      analysis.recommendations.forEach(rec => console.log(`   - ${rec}`));
    }
    
  } catch (error) {
    console.log(`\n❌ Cache test failed: ${error}\n`);
  }

  // 4. Performance Validation
  console.log('\n🎯 Performance Validation...');
  const thresholds = getEnvironmentThresholds(DEFAULT_PERFORMANCE_THRESHOLDS, 'development');
  const validator = new PerformanceValidator(thresholds);
  
  console.log(`Performance Thresholds (Development):
  - Max response time: ${thresholds.maxResponseTime}ms
  - Min throughput: ${thresholds.minThroughput} req/s
  - Max error rate: ${(thresholds.maxErrorRate * 100).toFixed(1)}%\n`);

  // 5. Memory Usage Summary
  const finalMemory = memoryMonitor.measure();
  const memoryDelta = memoryMonitor.getDelta();
  
  console.log(`🧠 Memory Usage Summary:
  - Initial: ${MemoryMonitor.formatMemoryUsage(memoryMonitor.getMeasurements()[0].usage)}
  - Final: ${MemoryMonitor.formatMemoryUsage(finalMemory)}
  - Delta: ${MemoryMonitor.formatMemoryUsage(memoryDelta)}`);

  console.log('\n✨ Performance testing demo completed!');
}

// Run the demo
if (require.main === module) {
  runPerformanceDemo().catch(error => {
    console.error('Demo failed:', error);
    process.exit(1);
  });
}

export { runPerformanceDemo };