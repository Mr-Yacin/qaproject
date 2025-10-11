/**
 * Response Format Validation Tests
 * 
 * Comprehensive tests to ensure existing fields maintain types and structure,
 * new optional fields don't affect existing parsers, and JSON response format consistency.
 * 
 * Requirements: 8.2, 8.3
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  ResponseFormatValidator,
  SchemaBasedValidator,
  type BackwardCompatibilityResult,
  type NewFieldsValidation,
  type JSONFormatValidation,
  LEGACY_TOPIC_FIELDS,
  LEGACY_ARTICLE_FIELDS,
  NEW_FIELDS
} from './utils/response-format-validator';

describe('Response Format Validation', () => {
  let validator: ResponseFormatValidator;
  let apiBaseUrl: string;

  beforeAll(() => {
    validator = new ResponseFormatValidator();
    apiBaseUrl = process.env.API_BASE_URL || process.env.VERIFICATION_API_BASE_URL || 'http://localhost:3000';

    console.log('Response format validation configuration:', {
      apiBaseUrl,
      legacyTopicFields: Object.keys(LEGACY_TOPIC_FIELDS.required),
      newTopicFields: Object.keys(NEW_FIELDS.topic)
    });
  });

  describe('Existing Field Type and Structure Validation', () => {
    it('should maintain existing topic field types and structure', async () => {
      // Requirement 8.2: Create validators to ensure existing fields maintain types and structure
      
      const response = await fetch(`${apiBaseUrl}/api/topics?limit=1`);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data.items).toBeDefined();
      expect(Array.isArray(data.items)).toBe(true);
      
      if (data.items.length > 0) {
        const firstTopic = data.items[0].topic;
        
        // Validate existing topic fields
        const topicValidation = validator.validateExistingFieldTypes(firstTopic, 'topic');
        
        expect(topicValidation.hasRequiredFields).toBe(true);
        expect(topicValidation.fieldTypesCorrect).toBe(true);
        expect(topicValidation.validationErrors).toHaveLength(0);
        
        if (topicValidation.validationErrors.length > 0) {
          console.error('Topic field validation errors:', topicValidation.validationErrors);
        }

        // Validate specific field types
        expect(typeof firstTopic.id).toBe('string');
        expect(typeof firstTopic.slug).toBe('string');
        expect(typeof firstTopic.title).toBe('string');
        expect(typeof firstTopic.locale).toBe('string');
        expect(Array.isArray(firstTopic.tags)).toBe(true);
        expect(typeof firstTopic.createdAt).toBe('string');
        expect(typeof firstTopic.updatedAt).toBe('string');
      }
    });

    it('should maintain existing article field types and structure', async () => {
      const response = await fetch(`${apiBaseUrl}/api/topics?limit=1`);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      
      if (data.items.length > 0 && data.items[0].article) {
        const article = data.items[0].article;
        
        // Validate existing article fields
        const articleValidation = validator.validateExistingFieldTypes(article, 'article');
        
        expect(articleValidation.hasRequiredFields).toBe(true);
        expect(articleValidation.fieldTypesCorrect).toBe(true);
        expect(articleValidation.validationErrors).toHaveLength(0);

        // Validate specific field types
        expect(typeof article.id).toBe('string');
        expect(typeof article.topicId).toBe('string');
        expect(typeof article.content).toBe('string');
        expect(['DRAFT', 'PUBLISHED']).toContain(article.status);
        expect(typeof article.createdAt).toBe('string');
        expect(typeof article.updatedAt).toBe('string');
      }
    });

    it('should maintain existing pagination field types and structure', async () => {
      const response = await fetch(`${apiBaseUrl}/api/topics?page=1&limit=5`);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      
      // Validate pagination fields
      const paginationValidation = validator.validateExistingFieldTypes(data, 'pagination');
      
      expect(paginationValidation.hasRequiredFields).toBe(true);
      expect(paginationValidation.fieldTypesCorrect).toBe(true);
      expect(paginationValidation.validationErrors).toHaveLength(0);

      // Validate specific pagination fields
      expect(typeof data.total).toBe('number');
      expect(typeof data.page).toBe('number');
      expect(typeof data.limit).toBe('number');
      expect(typeof data.totalPages).toBe('number');
      
      // Validate pagination logic
      expect(data.page).toBe(1);
      expect(data.limit).toBe(5);
      expect(data.totalPages).toBe(Math.ceil(data.total / data.limit));
    });

    it('should maintain existing FAQ item field types and structure', async () => {
      const response = await fetch(`${apiBaseUrl}/api/topics?limit=1`);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      
      if (data.items.length > 0 && data.items[0].faqItems && data.items[0].faqItems.length > 0) {
        const faqItem = data.items[0].faqItems[0];
        
        // Validate existing FAQ fields
        const faqValidation = validator.validateExistingFieldTypes(faqItem, 'faq');
        
        expect(faqValidation.hasRequiredFields).toBe(true);
        expect(faqValidation.fieldTypesCorrect).toBe(true);
        expect(faqValidation.validationErrors).toHaveLength(0);

        // Validate specific field types
        expect(typeof faqItem.id).toBe('string');
        expect(typeof faqItem.topicId).toBe('string');
        expect(typeof faqItem.question).toBe('string');
        expect(typeof faqItem.answer).toBe('string');
        expect(typeof faqItem.order).toBe('number');
        expect(typeof faqItem.createdAt).toBe('string');
        expect(typeof faqItem.updatedAt).toBe('string');
      }
    });
  });

  describe('New Optional Fields Compatibility', () => {
    it('should ensure new topic fields are optional and properly typed', async () => {
      // Requirement 8.3: Test that new optional fields don't affect existing parsers
      
      const response = await fetch(`${apiBaseUrl}/api/topics?limit=5`);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      
      if (data.items.length > 0) {
        for (const item of data.items) {
          const topic = item.topic;
          
          // Validate new fields compatibility
          const newFieldsValidation = validator.validateNewFieldsCompatibility(topic, 'topic');
          
          expect(newFieldsValidation.allOptional).toBe(true);
          expect(newFieldsValidation.properlyTyped).toBe(true);
          expect(newFieldsValidation.nonBreaking).toBe(true);
          
          if (newFieldsValidation.issues.length > 0) {
            console.error(`New fields validation issues for topic ${topic.slug}:`, newFieldsValidation.issues);
          }

          // Check specific new fields
          if ('seoTitle' in topic) {
            expect(topic.seoTitle === null || typeof topic.seoTitle === 'string').toBe(true);
          }
          
          if ('seoDescription' in topic) {
            expect(topic.seoDescription === null || typeof topic.seoDescription === 'string').toBe(true);
          }
          
          if ('seoKeywords' in topic) {
            expect(Array.isArray(topic.seoKeywords)).toBe(true);
          }
          
          if ('thumbnailUrl' in topic) {
            expect(topic.thumbnailUrl === null || typeof topic.thumbnailUrl === 'string').toBe(true);
          }
        }
      }
    });

    it('should ensure new article fields are optional and properly typed', async () => {
      const response = await fetch(`${apiBaseUrl}/api/topics?limit=5`);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      
      for (const item of data.items) {
        if (item.article) {
          const article = item.article;
          
          // Validate new fields compatibility
          const newFieldsValidation = validator.validateNewFieldsCompatibility(article, 'article');
          
          expect(newFieldsValidation.allOptional).toBe(true);
          expect(newFieldsValidation.properlyTyped).toBe(true);
          expect(newFieldsValidation.nonBreaking).toBe(true);

          // Check specific new fields
          if ('seoTitle' in article) {
            expect(article.seoTitle === null || typeof article.seoTitle === 'string').toBe(true);
          }
          
          if ('seoDescription' in article) {
            expect(article.seoDescription === null || typeof article.seoDescription === 'string').toBe(true);
          }
          
          if ('seoKeywords' in article) {
            expect(Array.isArray(article.seoKeywords)).toBe(true);
          }
        }
      }
    });

    it('should handle mixed scenarios with some new fields populated and others null', async () => {
      const response = await fetch(`${apiBaseUrl}/api/topics?limit=10`);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      
      let foundPopulatedSEO = false;
      let foundNullSEO = false;
      
      for (const item of data.items) {
        const topic = item.topic;
        
        // Check for mixed scenarios
        if (topic.seoTitle && topic.seoTitle !== null) {
          foundPopulatedSEO = true;
          expect(typeof topic.seoTitle).toBe('string');
        }
        
        if (topic.seoTitle === null) {
          foundNullSEO = true;
        }
        
        // Ensure arrays are always arrays (even if empty)
        if ('seoKeywords' in topic) {
          expect(Array.isArray(topic.seoKeywords)).toBe(true);
        }
      }
      
      // Log findings for debugging
      console.log('SEO field population status:', {
        foundPopulatedSEO,
        foundNullSEO,
        totalItems: data.items.length
      });
    });
  });

  describe('JSON Response Format Consistency', () => {
    it('should maintain consistent JSON structure for topics list endpoint', async () => {
      // Requirement 8.3: Verify JSON response format consistency
      
      const response = await fetch(`${apiBaseUrl}/api/topics`);
      const responseText = await response.text();
      
      const jsonValidation = validator.validateJSONFormat(responseText, '/api/topics');
      
      expect(jsonValidation.validJSON).toBe(true);
      expect(jsonValidation.consistentStructure).toBe(true);
      expect(jsonValidation.properEncoding).toBe(true);
      expect(jsonValidation.issues).toHaveLength(0);
      
      if (jsonValidation.issues.length > 0) {
        console.error('JSON format issues:', jsonValidation.issues);
      }
    });

    it('should maintain consistent JSON structure for single topic endpoint', async () => {
      // First get a topic slug
      const listResponse = await fetch(`${apiBaseUrl}/api/topics?limit=1`);
      const listData = await listResponse.json();
      
      if (listData.items.length > 0) {
        const slug = listData.items[0].topic.slug;
        
        const response = await fetch(`${apiBaseUrl}/api/topics/${slug}`);
        const responseText = await response.text();
        
        const jsonValidation = validator.validateJSONFormat(responseText, `/api/topics/${slug}`);
        
        expect(jsonValidation.validJSON).toBe(true);
        expect(jsonValidation.consistentStructure).toBe(true);
        expect(jsonValidation.properEncoding).toBe(true);
        expect(jsonValidation.issues).toHaveLength(0);
      }
    });

    it('should maintain consistent field naming conventions', async () => {
      const response = await fetch(`${apiBaseUrl}/api/topics?limit=1`);
      const data = await response.json();
      
      // Check that all field names follow camelCase convention
      const checkFieldNaming = (obj: any, path = ''): string[] => {
        const issues: string[] = [];
        
        if (typeof obj !== 'object' || obj === null) return issues;
        
        if (Array.isArray(obj)) {
          obj.forEach((item, index) => {
            issues.push(...checkFieldNaming(item, `${path}[${index}]`));
          });
          return issues;
        }
        
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          
          // Check if key follows camelCase convention
          if (!/^[a-z][a-zA-Z0-9]*$/.test(key)) {
            issues.push(`Field ${currentPath} does not follow camelCase convention`);
          }
          
          // Recursively check nested objects
          issues.push(...checkFieldNaming(value, currentPath));
        }
        
        return issues;
      };
      
      const namingIssues = checkFieldNaming(data);
      expect(namingIssues).toHaveLength(0);
      
      if (namingIssues.length > 0) {
        console.error('Field naming issues:', namingIssues);
      }
    });

    it('should handle null values consistently across all fields', async () => {
      const response = await fetch(`${apiBaseUrl}/api/topics?limit=5`);
      const data = await response.json();
      
      for (const item of data.items) {
        const topic = item.topic;
        
        // Check that no fields are undefined (should be null instead)
        const checkForUndefined = (obj: any, path = ''): string[] => {
          const issues: string[] = [];
          
          for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key;
            
            if (value === undefined) {
              issues.push(`Field ${currentPath} is undefined (should be null)`);
            } else if (value && typeof value === 'object' && !Array.isArray(value)) {
              issues.push(...checkForUndefined(value, currentPath));
            }
          }
          
          return issues;
        };
        
        const undefinedIssues = checkForUndefined(topic, `topic[${topic.slug}]`);
        expect(undefinedIssues).toHaveLength(0);
        
        if (undefinedIssues.length > 0) {
          console.error('Undefined field issues:', undefinedIssues);
        }
      }
    });
  });

  describe('Schema-Based Legacy Compatibility', () => {
    it('should pass legacy topic schema validation', async () => {
      const response = await fetch(`${apiBaseUrl}/api/topics?limit=1`);
      const data = await response.json();
      
      if (data.items.length > 0) {
        const topic = data.items[0].topic;
        
        // Create a copy with only legacy fields
        const legacyTopic = {
          id: topic.id,
          slug: topic.slug,
          title: topic.title,
          locale: topic.locale,
          tags: topic.tags,
          createdAt: topic.createdAt,
          updatedAt: topic.updatedAt,
        };
        
        const validation = SchemaBasedValidator.validateLegacyCompatibility(legacyTopic, 'topic');
        
        expect(validation.compatible).toBe(true);
        expect(validation.errors).toHaveLength(0);
        
        if (!validation.compatible) {
          console.error('Legacy topic schema validation errors:', validation.errors);
        }
      }
    });

    it('should pass legacy article schema validation', async () => {
      const response = await fetch(`${apiBaseUrl}/api/topics?limit=5`);
      const data = await response.json();
      
      const articleItem = data.items.find((item: any) => item.article);
      
      if (articleItem && articleItem.article) {
        const article = articleItem.article;
        
        // Create a copy with only legacy fields
        const legacyArticle = {
          id: article.id,
          topicId: article.topicId,
          content: article.content,
          status: article.status,
          createdAt: article.createdAt,
          updatedAt: article.updatedAt,
        };
        
        const validation = SchemaBasedValidator.validateLegacyCompatibility(legacyArticle, 'article');
        
        expect(validation.compatible).toBe(true);
        expect(validation.errors).toHaveLength(0);
        
        if (!validation.compatible) {
          console.error('Legacy article schema validation errors:', validation.errors);
        }
      }
    });

    it('should pass legacy pagination schema validation', async () => {
      const response = await fetch(`${apiBaseUrl}/api/topics?page=1&limit=10`);
      const data = await response.json();
      
      // Create a copy with only legacy pagination fields
      const legacyPagination = {
        total: data.total,
        page: data.page,
        limit: data.limit,
        totalPages: data.totalPages,
      };
      
      const validation = SchemaBasedValidator.validateLegacyCompatibility(legacyPagination, 'pagination');
      
      expect(validation.compatible).toBe(true);
      expect(validation.errors).toHaveLength(0);
      
      if (!validation.compatible) {
        console.error('Legacy pagination schema validation errors:', validation.errors);
      }
    });
  });

  describe('Comprehensive Backward Compatibility', () => {
    it('should pass comprehensive backward compatibility validation for topics list', async () => {
      const response = await fetch(`${apiBaseUrl}/api/topics?limit=3`);
      const data = await response.json();
      
      const compatibilityResult = validator.validateBackwardCompatibility(data, '/api/topics');
      
      expect(compatibilityResult.compatible).toBe(true);
      expect(compatibilityResult.breakingChanges).toHaveLength(0);
      
      if (!compatibilityResult.compatible) {
        console.error('Backward compatibility issues:', {
          breakingChanges: compatibilityResult.breakingChanges,
          warnings: compatibilityResult.warnings
        });
      }
      
      // Warnings are acceptable (for new fields), but breaking changes are not
      if (compatibilityResult.warnings.length > 0) {
        console.log('Backward compatibility warnings (acceptable):', compatibilityResult.warnings);
      }
    });

    it('should pass comprehensive backward compatibility validation for single topic', async () => {
      // First get a topic slug
      const listResponse = await fetch(`${apiBaseUrl}/api/topics?limit=1`);
      const listData = await listResponse.json();
      
      if (listData.items.length > 0) {
        const slug = listData.items[0].topic.slug;
        
        const response = await fetch(`${apiBaseUrl}/api/topics/${slug}`);
        const data = await response.json();
        
        const compatibilityResult = validator.validateBackwardCompatibility(data, `/api/topics/${slug}`);
        
        expect(compatibilityResult.compatible).toBe(true);
        expect(compatibilityResult.breakingChanges).toHaveLength(0);
        
        if (!compatibilityResult.compatible) {
          console.error('Single topic backward compatibility issues:', {
            breakingChanges: compatibilityResult.breakingChanges,
            warnings: compatibilityResult.warnings
          });
        }
      }
    });
  });
});