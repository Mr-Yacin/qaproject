/**
 * Unit tests for API response validation functions
 * Requirements: 1.1, 6.1
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateResponse,
  validateTopicsListResponse,
  validateTopicBySlugResponse,
  validateIngestSuccessResponse,
  validateRevalidateSuccessResponse,
  validateErrorResponse,
  validatePaginationMetadata,
  validateSEOFields,
  validateArticleSEOFields,
} from '../../verification/utils/response-validator';
import { z } from 'zod';

describe('Response Validator - Core Functions', () => {
  describe('validateResponse', () => {
    const testSchema = z.object({
      id: z.string(),
      name: z.string(),
      count: z.number(),
    });

    it('should return valid result for correct data', () => {
      const validData = { id: '123', name: 'test', count: 42 };
      const result = validateResponse(validData, testSchema);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual(validData);
    });

    it('should return invalid result for incorrect data', () => {
      const invalidData = { id: 123, name: 'test', count: 'not-a-number' };
      const result = validateResponse(invalidData, testSchema);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.data).toBeUndefined();
    });

    it('should include context in error messages', () => {
      const invalidData = { id: 123 };
      const result = validateResponse(invalidData, testSchema, 'Test Context');

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Test Context');
    });

    it('should handle schema validation exceptions', () => {
      const malformedSchema = null as any;
      const result = validateResponse({}, malformedSchema);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Schema validation failed');
    });
  });
});

describe('Response Validator - API Endpoints', () => {
  describe('validateTopicsListResponse', () => {
    it('should validate correct topics list response', () => {
      const validResponse = {
        items: [
          {
            topic: {
              id: 'topic-1',
              slug: 'test-topic',
              title: 'Test Topic',
              locale: 'en',
              tags: ['test'],
              thumbnailUrl: null,
              seoTitle: null,
              seoDescription: null,
              seoKeywords: [],
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
            primaryQuestion: {
              id: 'question-1',
              topicId: 'topic-1',
              text: 'Test question?',
              isPrimary: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
            article: {
              id: 'article-1',
              topicId: 'topic-1',
              content: 'Test content',
              status: 'PUBLISHED',
              seoTitle: null,
              seoDescription: null,
              seoKeywords: [],
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
            faqItems: [],
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      const result = validateTopicsListResponse(validResponse);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject response with missing required fields', () => {
      const invalidResponse = {
        items: [],
        // Missing total, page, limit, totalPages
      };

      const result = validateTopicsListResponse(invalidResponse);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject response with invalid item structure', () => {
      const invalidResponse = {
        items: [
          {
            // Missing topic, primaryQuestion, article
            invalidField: 'test',
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      const result = validateTopicsListResponse(invalidResponse);
      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('topic'))).toBe(true);
    });

    it('should validate response with SEO fields populated', () => {
      const responseWithSEO = {
        items: [
          {
            topic: {
              id: 'topic-1',
              slug: 'seo-topic',
              title: 'SEO Topic',
              locale: 'en',
              tags: ['seo'],
              thumbnailUrl: 'https://example.com/thumb.jpg',
              seoTitle: 'SEO Title',
              seoDescription: 'SEO Description',
              seoKeywords: ['seo', 'test'],
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
            primaryQuestion: {
              id: 'question-1',
              topicId: 'topic-1',
              text: 'SEO question?',
              isPrimary: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
            article: {
              id: 'article-1',
              topicId: 'topic-1',
              content: 'SEO content',
              status: 'PUBLISHED',
              seoTitle: 'Article SEO Title',
              seoDescription: 'Article SEO Description',
              seoKeywords: ['article', 'seo'],
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
            faqItems: [],
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      const result = validateTopicsListResponse(responseWithSEO);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateTopicBySlugResponse', () => {
    it('should validate correct single topic response', () => {
      const validResponse = {
        topic: {
          id: 'topic-1',
          slug: 'test-topic',
          title: 'Test Topic',
          locale: 'en',
          tags: ['test'],
          thumbnailUrl: null,
          seoTitle: null,
          seoDescription: null,
          seoKeywords: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        primaryQuestion: {
          id: 'question-1',
          topicId: 'topic-1',
          text: 'Test question?',
          isPrimary: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        article: {
          id: 'article-1',
          topicId: 'topic-1',
          content: 'Test content',
          status: 'PUBLISHED',
          seoTitle: null,
          seoDescription: null,
          seoKeywords: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        faqItems: [
          {
            id: 'faq-1',
            topicId: 'topic-1',
            question: 'FAQ question?',
            answer: 'FAQ answer',
            order: 1,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
      };

      const result = validateTopicBySlugResponse(validResponse);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject response with missing topic', () => {
      const invalidResponse = {
        // Missing topic
        primaryQuestion: {
          id: 'question-1',
          topicId: 'topic-1',
          text: 'Test question?',
          isPrimary: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        article: null,
        faqItems: [],
      };

      const result = validateTopicBySlugResponse(invalidResponse);
      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('topic'))).toBe(true);
    });
  });

  describe('validateIngestSuccessResponse', () => {
    it('should validate correct ingest success response', () => {
      const validResponse = {
        success: true,
        topicId: 'topic-123',
        jobId: 'job-456',
      };

      const result = validateIngestSuccessResponse(validResponse);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid ingest response', () => {
      const invalidResponse = {
        success: 'true', // Should be boolean
        message: 123, // Should be string
      };

      const result = validateIngestSuccessResponse(invalidResponse);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateRevalidateSuccessResponse', () => {
    it('should validate correct revalidate success response', () => {
      const validResponse = {
        message: 'Cache revalidated successfully',
        tag: 'topics',
      };

      const result = validateRevalidateSuccessResponse(validResponse);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid revalidate response', () => {
      const invalidResponse = {
        success: false,
        // Missing message and revalidatedPaths
      };

      const result = validateRevalidateSuccessResponse(invalidResponse);
      expect(result.valid).toBe(false);
    });
  });
});

describe('Response Validator - Error Responses', () => {
  describe('validateErrorResponse', () => {
    it('should validate 400 validation error response', () => {
      const validationError = {
        error: 'Validation failed',
        details: {
          topic: {
            slug: {
              _errors: ['Required'],
            },
          },
        },
      };

      const result = validateErrorResponse(validationError, 400, 'POST /api/ingest');
      expect(result.valid).toBe(true);
    });

    it('should validate 400 invalid JSON error response', () => {
      const jsonError = {
        error: 'Invalid JSON',
        details: 'Unexpected token at position 0',
      };

      const result = validateErrorResponse(jsonError, 400);
      expect(result.valid).toBe(true);
    });

    it('should validate 401 authentication error response', () => {
      const authError = {
        error: 'Unauthorized',
        details: 'Invalid API key',
      };

      const result = validateErrorResponse(authError, 401);
      expect(result.valid).toBe(true);
    });

    it('should validate 404 not found error response', () => {
      const notFoundError = {
        error: 'Topic not found',
      };

      const result = validateErrorResponse(notFoundError, 404);
      expect(result.valid).toBe(true);
    });

    it('should validate 500 server error response', () => {
      const serverError = {
        error: 'Internal server error',
      };

      const result = validateErrorResponse(serverError, 500);
      expect(result.valid).toBe(true);
    });

    it('should use generic error schema for unknown status codes', () => {
      const genericError = {
        error: 'Some error occurred',
      };

      const result = validateErrorResponse(genericError, 418); // I'm a teapot
      expect(result.valid).toBe(true);
    });

    it('should include endpoint context in error messages', () => {
      const invalidError = {
        // Missing error field
        message: 'This is not the right field',
      };

      const result = validateErrorResponse(invalidError, 400, 'POST /api/ingest');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('POST /api/ingest');
    });
  });
});

describe('Response Validator - Specialized Validators', () => {
  describe('validatePaginationMetadata', () => {
    it('should validate correct pagination metadata', () => {
      const validPagination = {
        total: 100,
        page: 2,
        limit: 20,
        totalPages: 5,
      };

      const result = validatePaginationMetadata(validPagination);
      expect(result.valid).toBe(true);
    });

    it('should validate pagination logic consistency', () => {
      const validPagination = {
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3, // Math.ceil(25/10) = 3
      };

      const result = validatePaginationMetadata(validPagination);
      expect(result.valid).toBe(true);
    });

    it('should reject incorrect totalPages calculation', () => {
      const invalidPagination = {
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 5, // Should be 3
      };

      const result = validatePaginationMetadata(invalidPagination);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('totalPages');
    });

    it('should validate expected page and limit values', () => {
      const pagination = {
        total: 50,
        page: 3,
        limit: 15,
        totalPages: 4,
      };

      const result = validatePaginationMetadata(pagination, 3, 15);
      expect(result.valid).toBe(true);
    });

    it('should reject mismatched expected values', () => {
      const pagination = {
        total: 50,
        page: 2,
        limit: 15,
        totalPages: 4,
      };

      const result = validatePaginationMetadata(pagination, 3, 15);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('page');
    });

    it('should reject negative or invalid values', () => {
      const invalidPagination = {
        total: -1,
        page: 0,
        limit: -5,
        totalPages: 'not-a-number',
      };

      const result = validatePaginationMetadata(invalidPagination);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateSEOFields', () => {
    it('should validate topic with all SEO fields populated', () => {
      const topicWithSEO = {
        seoTitle: 'SEO Title',
        seoDescription: 'SEO Description',
        seoKeywords: ['seo', 'test'],
        thumbnailUrl: 'https://example.com/thumb.jpg',
      };

      const result = validateSEOFields(topicWithSEO);
      expect(result.valid).toBe(true);
    });

    it('should validate topic with null SEO fields', () => {
      const topicWithNullSEO = {
        seoTitle: null,
        seoDescription: null,
        seoKeywords: [],
        thumbnailUrl: null,
      };

      const result = validateSEOFields(topicWithNullSEO);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid SEO field types', () => {
      const topicWithInvalidSEO = {
        seoTitle: 123, // Should be string or null
        seoDescription: [], // Should be string or null
        seoKeywords: 'not-an-array', // Should be array
        thumbnailUrl: {}, // Should be string or null
      };

      const result = validateSEOFields(topicWithInvalidSEO);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(4);
    });

    it('should reject seoKeywords with non-string elements', () => {
      const topicWithInvalidKeywords = {
        seoTitle: 'Valid Title',
        seoDescription: 'Valid Description',
        seoKeywords: ['valid', 123, 'another-valid'], // Mixed types
        thumbnailUrl: null,
      };

      const result = validateSEOFields(topicWithInvalidKeywords);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('seoKeywords must be an array of strings');
    });
  });

  describe('validateArticleSEOFields', () => {
    it('should validate article with all SEO fields populated', () => {
      const articleWithSEO = {
        seoTitle: 'Article SEO Title',
        seoDescription: 'Article SEO Description',
        seoKeywords: ['article', 'seo'],
      };

      const result = validateArticleSEOFields(articleWithSEO);
      expect(result.valid).toBe(true);
    });

    it('should validate article with null SEO fields', () => {
      const articleWithNullSEO = {
        seoTitle: null,
        seoDescription: null,
        seoKeywords: [],
      };

      const result = validateArticleSEOFields(articleWithNullSEO);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid article SEO field types', () => {
      const articleWithInvalidSEO = {
        seoTitle: 456, // Should be string or null
        seoDescription: true, // Should be string or null
        seoKeywords: 'not-an-array', // Should be array
      };

      const result = validateArticleSEOFields(articleWithInvalidSEO);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(3);
    });

    it('should include "article" prefix in error messages', () => {
      const articleWithInvalidSEO = {
        seoTitle: 123,
        seoDescription: null,
        seoKeywords: [],
      };

      const result = validateArticleSEOFields(articleWithInvalidSEO);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('article seoTitle');
    });
  });
});