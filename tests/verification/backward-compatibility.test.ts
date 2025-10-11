/**
 * Backward Compatibility Validation Tests
 * 
 * Tests that existing API parameter formats continue to work,
 * existing response field structures remain unchanged,
 * new fields don't break existing response parsing,
 * and existing authentication methods continue to function.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  LegacyParameterTester,
  ResponseStructureValidator,
  LegacyAuthenticationTester,
  BackwardCompatibilityUtils,
  type LegacyTestConfig,
  type CompatibilityTestResult
} from './utils/backward-compatibility-utils';

describe('Backward Compatibility Validation', () => {
  let legacyTester: LegacyParameterTester;
  let responseValidator: ResponseStructureValidator;
  let authTester: LegacyAuthenticationTester;
  let compatUtils: BackwardCompatibilityUtils;
  let testConfig: LegacyTestConfig;

  beforeAll(() => {
    const apiBaseUrl = process.env.API_BASE_URL || process.env.VERIFICATION_API_BASE_URL || 'http://localhost:3000';
    const apiKey = process.env.INGEST_API_KEY || 'test-api-key-12345';
    const webhookSecret = process.env.INGEST_WEBHOOK_SECRET || 'test-webhook-secret-67890';

    testConfig = {
      apiBaseUrl,
      credentials: { apiKey, webhookSecret },
      legacyFormats: {
        dateFormats: ['YYYY-MM-DD', 'MM/DD/YYYY'],
        parameterCasing: ['camelCase', 'snake_case'],
        booleanFormats: ['true/false', '1/0', 'yes/no']
      }
    };

    legacyTester = new LegacyParameterTester(testConfig);
    responseValidator = new ResponseStructureValidator(testConfig);
    authTester = new LegacyAuthenticationTester(testConfig);
    compatUtils = new BackwardCompatibilityUtils(testConfig);

    console.log('Backward compatibility test configuration:', {
      apiBaseUrl: testConfig.apiBaseUrl,
      hasCredentials: !!testConfig.credentials.apiKey
    });
  });

  describe('Legacy Parameter Format Compatibility', () => {
    it('should accept legacy query parameter formats for GET /api/topics', async () => {
      // Requirement 8.1: Test existing API parameter formats continue to work
      
      const legacyParameterSets = [
        // Original parameter names and formats
        { page: '1', limit: '20', locale: 'en' },
        { page: 1, limit: 20, locale: 'en' }, // Number vs string
        { tags: 'javascript,react', locale: 'en' }, // Comma-separated tags
        { tags: ['javascript', 'react'], locale: 'en' }, // Array format
        { search: 'test query', locale: 'en' }, // Search parameter
        { sort: 'createdAt', order: 'desc', locale: 'en' }, // Sorting parameters
        { published: 'true', locale: 'en' }, // Boolean as string
        { published: true, locale: 'en' }, // Boolean as boolean
      ];

      for (const params of legacyParameterSets) {
        const result = await legacyTester.testLegacyParameters('/api/topics', params);
        
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(result.responseValid).toBe(true);
        
        if (!result.success) {
          console.error(`Legacy parameter test failed for:`, params, result.error);
        }
      }
    });

    it('should accept legacy parameter formats for GET /api/topics/[slug]', async () => {
      // Test that slug-based requests work with various formats
      const slugFormats = [
        'test-topic',
        'test_topic', // Underscore format
        'TestTopic', // PascalCase
        'test.topic', // Dot notation
      ];

      for (const slug of slugFormats) {
        const result = await legacyTester.testLegacySlugFormat(slug);
        
        // Should either succeed (200) or fail gracefully (404) - not error (500)
        expect([200, 404]).toContain(result.statusCode);
        expect(result.responseValid).toBe(true);
        
        if (result.statusCode === 500) {
          console.error(`Slug format test failed for:`, slug, result.error);
        }
      }
    });

    it('should maintain backward compatibility for filtering parameters', async () => {
      // Test various legacy filtering approaches
      const filterTests = [
        // Legacy boolean representations
        { published: 'true' },
        { published: '1' },
        { published: 'yes' },
        
        // Legacy date formats
        { createdAfter: '2024-01-01' },
        { createdAfter: '01/01/2024' },
        
        // Legacy tag filtering
        { tag: 'javascript' }, // Single tag
        { tags: 'javascript,react' }, // Comma-separated
        { tags: ['javascript', 'react'] }, // Array format
      ];

      for (const filters of filterTests) {
        const result = await legacyTester.testLegacyFilters(filters);
        
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        
        if (!result.success) {
          console.error(`Filter compatibility test failed for:`, filters, result.error);
        }
      }
    });
  });

  describe('Legacy Authentication Header Formats', () => {
    it('should accept legacy API key header formats', async () => {
      // Requirement 8.4: Validate existing authentication methods continue to function
      
      const legacyHeaderFormats = [
        // Original header format
        { 'X-API-Key': testConfig.credentials.apiKey },
        
        // Alternative common formats
        { 'Authorization': `Bearer ${testConfig.credentials.apiKey}` },
        { 'Authorization': `API-Key ${testConfig.credentials.apiKey}` },
        { 'Api-Key': testConfig.credentials.apiKey },
        { 'x-api-key': testConfig.credentials.apiKey }, // Lowercase
        
        // HMAC signature formats
        { 'X-Signature': 'sha256=...' }, // Will be generated properly
        { 'X-Hub-Signature': 'sha256=...' }, // GitHub-style
        { 'X-Hub-Signature-256': 'sha256=...' }, // GitHub v2 style
      ];

      for (const headers of legacyHeaderFormats) {
        const result = await authTester.testLegacyAuthHeaders(headers);
        
        // Should either authenticate successfully or fail with proper 401
        expect([200, 201, 401]).toContain(result.statusCode);
        expect(result.responseValid).toBe(true);
        
        if (result.statusCode === 500) {
          console.error(`Legacy auth header test failed for:`, headers, result.error);
        }
      }
    });

    it('should maintain HMAC signature compatibility with legacy timestamp formats', async () => {
      const timestampFormats = [
        Date.now(), // Unix timestamp in milliseconds
        Math.floor(Date.now() / 1000), // Unix timestamp in seconds
        new Date().toISOString(), // ISO string format
        new Date().getTime().toString(), // String timestamp
      ];

      for (const timestamp of timestampFormats) {
        const result = await authTester.testLegacyTimestampFormat(timestamp);
        
        // Should handle various timestamp formats gracefully
        expect([200, 201, 401]).toContain(result.statusCode);
        
        if (result.statusCode === 500) {
          console.error(`Legacy timestamp test failed for:`, timestamp, result.error);
        }
      }
    });
  });

  describe('Response Structure Backward Compatibility', () => {
    it('should maintain existing field types and structures in topic responses', async () => {
      // Requirement 8.2: Verify existing response field structures remain unchanged
      
      const response = await responseValidator.getTopicsResponse();
      
      if (response.success && response.data) {
        const validation = responseValidator.validateLegacyTopicStructure(response.data);
        
        expect(validation.hasRequiredFields).toBe(true);
        expect(validation.fieldTypesCorrect).toBe(true);
        expect(validation.structureIntact).toBe(true);
        expect(validation.breakingChanges).toHaveLength(0);
        
        if (validation.breakingChanges.length > 0) {
          console.error('Breaking changes detected:', validation.breakingChanges);
        }
      }
    });

    it('should ensure new fields are optional and don\'t break existing parsers', async () => {
      // Requirement 8.3: Test that new fields don't break existing response parsing
      
      const response = await responseValidator.getTopicBySlugResponse('test-topic');
      
      if (response.success && response.data) {
        const validation = responseValidator.validateNewFieldsCompatibility(response.data);
        
        expect(validation.newFieldsOptional).toBe(true);
        expect(validation.existingFieldsIntact).toBe(true);
        expect(validation.parsingCompatible).toBe(true);
        expect(validation.incompatibilities).toHaveLength(0);
        
        if (validation.incompatibilities.length > 0) {
          console.error('Parsing incompatibilities detected:', validation.incompatibilities);
        }
      }
    });

    it('should maintain pagination metadata structure', async () => {
      const response = await responseValidator.getTopicsResponse({ page: 1, limit: 10 });
      
      if (response.success && response.data) {
        const validation = responseValidator.validatePaginationCompatibility(response.data);
        
        expect(validation.hasLegacyFields).toBe(true);
        expect(validation.fieldTypesCorrect).toBe(true);
        expect(validation.calculationsCorrect).toBe(true);
        
        // Ensure legacy pagination fields are present
        expect(response.data).toHaveProperty('total');
        expect(response.data).toHaveProperty('page');
        expect(response.data).toHaveProperty('limit');
        expect(response.data).toHaveProperty('totalPages');
        
        // Ensure types are correct
        expect(typeof response.data.total).toBe('number');
        expect(typeof response.data.page).toBe('number');
        expect(typeof response.data.limit).toBe('number');
        expect(typeof response.data.totalPages).toBe('number');
      }
    });

    it('should maintain error response formats', async () => {
      const errorTests = [
        { endpoint: '/api/topics/nonexistent', expectedStatus: 404 },
        { endpoint: '/api/ingest', method: 'POST', body: {}, expectedStatus: 401 },
        { endpoint: '/api/topics', query: { page: 'invalid' }, expectedStatus: 400 },
      ];

      for (const test of errorTests) {
        const response = await responseValidator.testErrorResponseFormat(test);
        
        expect(response.statusCode).toBe(test.expectedStatus);
        expect(response.hasErrorField).toBe(true);
        expect(response.structureValid).toBe(true);
        
        if (!response.structureValid) {
          console.error(`Error response format test failed for:`, test, response.issues);
        }
      }
    });
  });

  describe('JSON Response Format Consistency', () => {
    it('should maintain consistent JSON structure across all endpoints', async () => {
      // Requirement 8.3: Verify JSON response format consistency
      
      const endpoints = [
        { path: '/api/topics', method: 'GET' },
        { path: '/api/topics/test-topic', method: 'GET' },
      ];

      for (const endpoint of endpoints) {
        const result = await compatUtils.testJSONConsistency(endpoint);
        
        expect(result.validJSON).toBe(true);
        expect(result.consistentStructure).toBe(true);
        expect(result.noUnexpectedFields).toBe(true);
        
        if (!result.consistentStructure) {
          console.error(`JSON consistency test failed for:`, endpoint, result.issues);
        }
      }
    });

    it('should handle null values consistently across old and new fields', async () => {
      const response = await responseValidator.getTopicsResponse();
      
      if (response.success && response.data && response.data.items.length > 0) {
        const topic = response.data.items[0].topic;
        
        // Test that null handling is consistent
        const nullFieldValidation = responseValidator.validateNullFieldHandling(topic);
        
        expect(nullFieldValidation.consistentNullHandling).toBe(true);
        expect(nullFieldValidation.noUndefinedFields).toBe(true);
        
        if (!nullFieldValidation.consistentNullHandling) {
          console.error('Inconsistent null handling detected:', nullFieldValidation.issues);
        }
      }
    });
  });

  describe('Legacy Client Simulation', () => {
    it('should work with simulated legacy client requests', async () => {
      // Simulate how an older client might make requests
      const legacyClientTests = [
        {
          name: 'Legacy JavaScript fetch',
          headers: { 'Content-Type': 'application/json' },
          expectsFields: ['id', 'slug', 'title', 'locale', 'tags', 'createdAt', 'updatedAt']
        },
        {
          name: 'Legacy cURL request',
          headers: { 'User-Agent': 'curl/7.68.0' },
          expectsFields: ['id', 'slug', 'title', 'locale', 'tags', 'createdAt', 'updatedAt']
        },
        {
          name: 'Legacy mobile app',
          headers: { 'User-Agent': 'MyApp/1.0 (iOS)' },
          expectsFields: ['id', 'slug', 'title', 'locale', 'tags', 'createdAt', 'updatedAt']
        }
      ];

      for (const clientTest of legacyClientTests) {
        const result = await compatUtils.simulateLegacyClient(clientTest);
        
        expect(result.success).toBe(true);
        expect(result.hasExpectedFields).toBe(true);
        expect(result.noBreakingChanges).toBe(true);
        
        if (!result.success) {
          console.error(`Legacy client simulation failed for:`, clientTest.name, result.error);
        }
      }
    });
  });
});