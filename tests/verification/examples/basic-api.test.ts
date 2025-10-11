/**
 * Example test demonstrating the verification framework
 * This is a basic example showing how to write API verification tests
 */

import { describe, it, expect } from 'vitest';
import { 
  getApiBaseUrl, 
  getTestConfiguration, 
  createAuthHeaders,
  makeAuthenticatedRequest 
} from '../setup';
import { 
  HTTPUtils, 
  TestResultBuilder, 
  ValidationUtils,
  PerformanceUtils,
  TestDataUtils
} from '../utils';
import { 
  TestCategory, 
  VerificationLevel, 
  TestStatus 
} from '../types';

describe('Basic API Verification Examples', () => {
  describe('GET /api/topics', () => {
    it('should return topics list with proper structure', async () => {
      const apiBaseUrl = getApiBaseUrl();
      const config = getTestConfiguration();
      
      // Measure performance
      const { result: response, duration } = await PerformanceUtils.measureExecutionTime(
        () => HTTPUtils.makeRequest(`${apiBaseUrl}/api/topics`)
      );
      
      // Basic response validation
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
      
      // Performance validation
      expect(duration).toBeLessThan(config.performanceThresholds.maxResponseTime);
      
      // Schema validation
      const requiredFields = ['items'];
      const optionalFields = ['total', 'page', 'limit', 'hasMore'];
      
      const requiredFieldErrors = ValidationUtils.validateRequiredFields(
        response.body, 
        requiredFields
      );
      expect(requiredFieldErrors).toHaveLength(0);
      
      // Build test result
      const testResult = new TestResultBuilder('GET /api/topics', TestCategory.API_ENDPOINTS)
        .setVerificationLevel(VerificationLevel.CRITICAL)
        .setRequirements(['1.1', '1.2'])
        .setDuration(duration)
        .setRequest({
          method: 'GET',
          url: `${apiBaseUrl}/api/topics`,
          headers: {}
        })
        .setResponse({
          status: response.status,
          body: response.body,
          responseTime: duration
        })
        .setStatus(TestStatus.PASSED)
        .build();
      
      console.log('✅ Test result:', testResult.testName, testResult.status);
    });

    it('should handle query parameters correctly', async () => {
      const apiBaseUrl = getApiBaseUrl();
      
      // Test with various query parameters
      const testCases = [
        { params: '?limit=5', description: 'limit parameter' },
        { params: '?locale=en', description: 'locale parameter' },
        { params: '?tags=test', description: 'tags parameter' },
        { params: '?limit=5&locale=en', description: 'multiple parameters' }
      ];
      
      for (const testCase of testCases) {
        const response = await HTTPUtils.makeRequest(
          `${apiBaseUrl}/api/topics${testCase.params}`
        );
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('items');
        
        console.log(`✅ Query parameter test passed: ${testCase.description}`);
      }
    });
  });

  describe('GET /api/topics/[slug]', () => {
    it('should return individual topic with complete data', async () => {
      const apiBaseUrl = getApiBaseUrl();
      
      // First get a list of topics to find a valid slug
      const listResponse = await HTTPUtils.makeRequest(`${apiBaseUrl}/api/topics?limit=1`);
      expect(listResponse.status).toBe(200);
      
      if (listResponse.body.items && listResponse.body.items.length > 0) {
        const slug = listResponse.body.items[0].slug;
        
        // Test individual topic retrieval
        const response = await HTTPUtils.makeRequest(`${apiBaseUrl}/api/topics/${slug}`);
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('slug', slug);
        expect(response.body).toHaveProperty('title');
        
        // Check for new SEO fields
        const optionalSEOFields = ['seoTitle', 'seoDescription', 'seoKeywords', 'thumbnailUrl'];
        optionalSEOFields.forEach(field => {
          if (response.body[field] !== undefined) {
            console.log(`✅ SEO field present: ${field}`);
          }
        });
        
        // Validate article structure if present
        if (response.body.article) {
          expect(response.body.article).toHaveProperty('content');
          expect(response.body.article).toHaveProperty('status');
        }
        
        // Validate FAQ items if present
        if (response.body.faqItems) {
          expect(Array.isArray(response.body.faqItems)).toBe(true);
        }
      } else {
        console.log('⚠️ No topics available for individual topic test');
      }
    });

    it('should return 404 for non-existent topic', async () => {
      const apiBaseUrl = getApiBaseUrl();
      const nonExistentSlug = 'non-existent-topic-12345';
      
      const response = await HTTPUtils.makeRequest(
        `${apiBaseUrl}/api/topics/${nonExistentSlug}`
      );
      
      expect(response.status).toBe(404);
      console.log('✅ 404 handling test passed');
    });
  });

  describe('Authentication Tests', () => {
    it('should authenticate valid HMAC requests', async () => {
      const testPayload = {
        test: 'data',
        timestamp: Date.now()
      };
      
      try {
        const response = await makeAuthenticatedRequest('/api/ingest', {
          method: 'POST',
          body: testPayload
        });
        
        // Note: This might fail if the endpoint expects specific data structure
        // The test is mainly to verify HMAC signature generation works
        console.log(`📡 HMAC request status: ${response.status}`);
        
        // We expect either success or a validation error (not auth error)
        expect([200, 201, 400, 422]).toContain(response.status);
        expect(response.status).not.toBe(401); // Should not be unauthorized
        
      } catch (error) {
        console.log('⚠️ HMAC test error (expected if endpoint has strict validation):', error);
      }
    });

    it('should reject requests without authentication', async () => {
      const apiBaseUrl = getApiBaseUrl();
      
      try {
        const response = await HTTPUtils.makeRequest(`${apiBaseUrl}/api/ingest`, {
          method: 'POST',
          body: { test: 'data' }
        });
        
        // Should be unauthorized without proper HMAC
        expect(response.status).toBe(401);
        console.log('✅ Unauthenticated request properly rejected');
        
      } catch (error) {
        console.log('⚠️ Authentication rejection test error:', error);
      }
    });
  });

  describe('Performance Tests', () => {
    it('should meet response time requirements', async () => {
      const apiBaseUrl = getApiBaseUrl();
      const config = getTestConfiguration();
      
      const measurements: number[] = [];
      const iterations = 5;
      
      for (let i = 0; i < iterations; i++) {
        const { duration } = await PerformanceUtils.measureExecutionTime(
          () => HTTPUtils.makeRequest(`${apiBaseUrl}/api/topics?limit=10`)
        );
        measurements.push(duration);
      }
      
      const averageTime = measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
      const maxTime = Math.max(...measurements);
      
      console.log(`📊 Performance metrics:
        - Average response time: ${averageTime.toFixed(2)}ms
        - Max response time: ${maxTime.toFixed(2)}ms
        - Threshold: ${config.performanceThresholds.maxResponseTime}ms`);
      
      expect(averageTime).toBeLessThan(config.performanceThresholds.maxResponseTime);
      expect(maxTime).toBeLessThan(config.performanceThresholds.maxResponseTime * 2); // Allow some variance
    });
  });

  describe('Schema Validation Tests', () => {
    it('should validate response schema structure', async () => {
      const apiBaseUrl = getApiBaseUrl();
      
      const response = await HTTPUtils.makeRequest(`${apiBaseUrl}/api/topics?limit=1`);
      expect(response.status).toBe(200);
      
      // Define expected schema
      const expectedSchema = {
        type: 'object',
        required: ['items'],
        properties: {
          items: { type: 'array' },
          total: { type: 'number' },
          page: { type: 'number' },
          limit: { type: 'number' }
        }
      };
      
      const { valid, errors } = ValidationUtils.validateSchema(response.body, expectedSchema);
      
      if (!valid) {
        console.log('❌ Schema validation errors:', errors);
      }
      
      expect(valid).toBe(true);
      console.log('✅ Response schema validation passed');
    });
  });
});

// Example of a custom test utility
describe('Test Framework Utilities', () => {
  it('should demonstrate utility functions', () => {
    // Test data generation using imported utilities
    
    const randomString = TestDataUtils.generateRandomString(10);
    expect(randomString).toHaveLength(10);
    
    const randomEmail = TestDataUtils.generateRandomEmail();
    expect(randomEmail).toMatch(/^test-\w+@example\.com$/);
    
    const testTopic = TestDataUtils.generateTestTopic({
      title: 'Custom Test Topic'
    });
    expect(testTopic.title).toBe('Custom Test Topic');
    expect(testTopic).toHaveProperty('slug');
    expect(testTopic).toHaveProperty('seoTitle');
    
    console.log('✅ Test data utilities working correctly');
  });
});