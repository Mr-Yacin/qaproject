import { describe, it, expect } from 'vitest';
import { 
  validateTopicsListResponse,
  validateTopicBySlugResponse,
  validateErrorResponse,
} from './utils/response-validator';

/**
 * API Endpoint Functionality Verification Tests
 * Basic test suite to verify API response schema validation
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.2
 */

describe('API Response Schema Validation', () => {
  it('should validate topics list response schema', () => {
    const mockTopicsResponse = {
      items: [
        {
          topic: {
            id: 'test-id',
            slug: 'test-slug',
            title: 'Test Title',
            locale: 'en',
            tags: ['test'],
            thumbnailUrl: null,
            seoTitle: null,
            seoDescription: null,
            seoKeywords: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          primaryQuestion: {
            id: 'question-id',
            topicId: 'test-id',
            text: 'Test question?',
            isPrimary: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          article: {
            id: 'article-id',
            topicId: 'test-id',
            content: 'Test content',
            status: 'PUBLISHED' as const,
            seoTitle: null,
            seoDescription: null,
            seoKeywords: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          faqItems: [],
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    };

    const validation = validateTopicsListResponse(mockTopicsResponse);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should validate single topic response schema', () => {
    const mockTopicResponse = {
      topic: {
        id: 'test-id',
        slug: 'test-slug',
        title: 'Test Title',
        locale: 'en',
        tags: ['test'],
        thumbnailUrl: null,
        seoTitle: 'SEO Title',
        seoDescription: 'SEO Description',
        seoKeywords: ['seo', 'test'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      primaryQuestion: {
        id: 'question-id',
        topicId: 'test-id',
        text: 'Test question?',
        isPrimary: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      article: {
        id: 'article-id',
        topicId: 'test-id',
        content: 'Test content',
        status: 'PUBLISHED' as const,
        seoTitle: 'Article SEO Title',
        seoDescription: 'Article SEO Description',
        seoKeywords: ['article', 'seo'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      faqItems: [
        {
          id: 'faq-id',
          topicId: 'test-id',
          question: 'FAQ Question?',
          answer: 'FAQ Answer',
          order: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    const validation = validateTopicBySlugResponse(mockTopicResponse);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should validate error response schemas', () => {
    const mockErrorResponse = {
      error: 'Validation failed',
      details: {
        topic: {
          slug: {
            _errors: ['Required'],
          },
        },
      },
    };

    const validation = validateErrorResponse(mockErrorResponse, 400, 'POST /api/ingest');
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should detect invalid response schemas', () => {
    const invalidResponse = {
      // Missing required fields
      items: 'not-an-array',
      total: 'not-a-number',
    };

    const validation = validateTopicsListResponse(invalidResponse);
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });
});

describe('API Error Handling Validation', () => {
  it('should validate 404 error response', () => {
    const notFoundResponse = {
      error: 'Topic not found',
    };

    const validation = validateErrorResponse(notFoundResponse, 404, 'GET /api/topics/[slug]');
    expect(validation.valid).toBe(true);
  });

  it('should validate 401 error response', () => {
    const authErrorResponse = {
      error: 'Unauthorized',
      details: 'Invalid API key',
    };

    const validation = validateErrorResponse(authErrorResponse, 401, 'POST /api/ingest');
    expect(validation.valid).toBe(true);
  });

  it('should validate 500 error response', () => {
    const serverErrorResponse = {
      error: 'Internal server error',
    };

    const validation = validateErrorResponse(serverErrorResponse, 500, 'POST /api/ingest');
    expect(validation.valid).toBe(true);
  });
});