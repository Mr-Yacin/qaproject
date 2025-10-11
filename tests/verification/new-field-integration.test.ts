/**
 * New Field Integration Validation Tests
 * Tests SEO fields, thumbnail URLs, and proper handling of null/empty values
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { TestConfigUtils } from './utils';
import { NewFieldsValidator } from './validators/new-fields-validator';
import { 
  allNewFieldsTestData,
  newFieldTestScenarios,
  expectedNewFieldsSchema
} from './test-data/new-fields-test-data';

describe('New Field Integration Validation', () => {
  let apiBaseUrl: string;
  let testCredentials: { apiKey: string; webhookSecret: string };

  beforeAll(async () => {
    apiBaseUrl = TestConfigUtils.getApiBaseUrl();
    testCredentials = TestConfigUtils.getTestCredentials();
    
    // Verify test environment is properly configured
    expect(apiBaseUrl).toBeDefined();
    expect(testCredentials.apiKey).toBeDefined();
    expect(testCredentials.webhookSecret).toBeDefined();
  });

  describe('SEO Fields Validation', () => {
    it('should validate complete SEO fields in topics', async () => {
      const testTopics = allNewFieldsTestData.complete;
      
      for (const topic of testTopics) {
        const validation = await NewFieldsValidator.validateTopic(topic);
        
        expect(validation.valid).toBe(true);
        expect(validation.results.seoTitle.valid).toBe(true);
        expect(validation.results.seoDescription.valid).toBe(true);
        expect(validation.results.seoKeywords.valid).toBe(true);
        expect(validation.results.serialization.valid).toBe(true);
        
        // Verify no critical errors
        expect(validation.results.seoTitle.errors).toHaveLength(0);
        expect(validation.results.seoDescription.errors).toHaveLength(0);
        expect(validation.results.seoKeywords.errors).toHaveLength(0);
      }
    });

    it('should handle mixed null/populated SEO fields gracefully', async () => {
      const testTopics = allNewFieldsTestData.mixed;
      
      for (const topic of testTopics) {
        const validation = await NewFieldsValidator.validateTopic(topic);
        
        // Should be valid even with null fields
        expect(validation.results.serialization.valid).toBe(true);
        
        // Null fields should not cause errors
        if (topic.seoTitle === null) {
          expect(validation.results.seoTitle.errors).toHaveLength(0);
        }
        if (topic.seoDescription === null) {
          expect(validation.results.seoDescription.errors).toHaveLength(0);
        }
        if (topic.seoKeywords === null) {
          expect(validation.results.seoKeywords.errors).toHaveLength(0);
        }
      }
    });

    it('should validate article-level SEO fields', () => {
      const testTopics = allNewFieldsTestData.complete;
      
      for (const topic of testTopics) {
        const articleValidation = NewFieldsValidator.validateArticle(topic.article);
        
        expect(articleValidation.valid).toBe(true);
        expect(articleValidation.results.seoTitle.valid).toBe(true);
        expect(articleValidation.results.seoDescription.valid).toBe(true);
        expect(articleValidation.results.seoKeywords.valid).toBe(true);
        expect(articleValidation.results.serialization.valid).toBe(true);
      }
    });
  });

  describe('Thumbnail URL Validation', () => {
    it('should validate HTTPS thumbnail URLs', async () => {
      const httpsTopics = allNewFieldsTestData.thumbnails.filter(
        topic => topic.thumbnailUrl?.startsWith('https://')
      );
      
      for (const topic of httpsTopics) {
        const validation = await NewFieldsValidator.validateTopic(topic);
        
        expect(validation.results.thumbnailUrl.valid).toBe(true);
        expect(validation.results.thumbnailUrl.errors).toHaveLength(0);
      }
    });

    it('should handle null thumbnail URLs gracefully', async () => {
      const nullThumbnailTopics = allNewFieldsTestData.mixed.filter(
        topic => topic.thumbnailUrl === null
      );
      
      for (const topic of nullThumbnailTopics) {
        const validation = await NewFieldsValidator.validateTopic(topic);
        
        expect(validation.results.thumbnailUrl.valid).toBe(true);
        expect(validation.results.thumbnailUrl.errors).toHaveLength(0);
        expect(validation.results.thumbnailUrl.url).toBe(null);
      }
    });
  });

  describe('JSON Serialization Validation', () => {
    it('should serialize and deserialize new fields correctly', async () => {
      const allTestData = Object.values(allNewFieldsTestData).flat();
      
      for (const topic of allTestData) {
        const validation = await NewFieldsValidator.validateTopic(topic);
        
        expect(validation.results.serialization.valid).toBe(true);
        expect(validation.results.serialization.errors).toHaveLength(0);
        
        // Verify that serialized data can be parsed back
        const serialized = validation.results.serialization.serializedData;
        expect(() => JSON.parse(serialized)).not.toThrow();
        
        const deserialized = validation.results.serialization.deserializedData;
        expect(deserialized).toBeDefined();
      }
    });

    it('should preserve null values during serialization', async () => {
      const mixedTopics = allNewFieldsTestData.mixed;
      
      for (const topic of mixedTopics) {
        const validation = await NewFieldsValidator.validateTopic(topic);
        const deserialized = validation.results.serialization.deserializedData;
        
        // Null values should be preserved as null (not undefined)
        if (topic.seoTitle === null) {
          expect(deserialized.seoTitle).toBe(null);
        }
        if (topic.seoDescription === null) {
          expect(deserialized.seoDescription).toBe(null);
        }
        if (topic.thumbnailUrl === null) {
          expect(deserialized.thumbnailUrl).toBe(null);
        }
      }
    });
  });

  describe('Test Scenarios Coverage', () => {
    it('should cover all defined test scenarios', () => {
      expect(newFieldTestScenarios).toBeDefined();
      expect(newFieldTestScenarios.length).toBeGreaterThan(0);
      
      // Verify each scenario has required properties
      for (const scenario of newFieldTestScenarios) {
        expect(scenario.name).toBeDefined();
        expect(scenario.description).toBeDefined();
        expect(scenario.testData).toBeDefined();
        expect(scenario.expectedBehavior).toBeDefined();
        expect(Array.isArray(scenario.testData)).toBe(true);
      }
    });

    it('should validate expected schema structure', () => {
      expect(expectedNewFieldsSchema).toBeDefined();
      expect(expectedNewFieldsSchema.topic).toBeDefined();
      expect(expectedNewFieldsSchema.article).toBeDefined();
      
      // Topic schema should include new fields
      expect(expectedNewFieldsSchema.topic.optional).toContain('thumbnailUrl');
      expect(expectedNewFieldsSchema.topic.optional).toContain('seoTitle');
      expect(expectedNewFieldsSchema.topic.optional).toContain('seoDescription');
      expect(expectedNewFieldsSchema.topic.optional).toContain('seoKeywords');
      
      // Article schema should include SEO fields
      expect(expectedNewFieldsSchema.article.optional).toContain('seoTitle');
      expect(expectedNewFieldsSchema.article.optional).toContain('seoDescription');
      expect(expectedNewFieldsSchema.article.optional).toContain('seoKeywords');
    });
  });
});