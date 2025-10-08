import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTopics, getTopicBySlug } from '../../src/lib/api/topics';
import { createOrUpdateTopic, revalidateCache, revalidateTopicCache } from '../../src/lib/api/ingest';
import { APIError } from '../../src/lib/api/errors';

/**
 * Unit Tests for API Client Functions
 * Requirements: 3.1, 3.2
 * 
 * These tests verify:
 * - Successful API calls
 * - Error handling
 * - Signature generation
 * - Request formatting
 */

// Mock the global fetch function
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  vi.clearAllMocks();
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_INGEST_API_KEY: 'test-api-key',
    NEXT_PUBLIC_INGEST_WEBHOOK_SECRET: 'test-webhook-secret',
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('getTopics', () => {
  test('should fetch topics successfully without filters', async () => {
    // Requirement 3.1
    const mockResponse = {
      items: [
        {
          id: '1',
          slug: 'test-topic',
          title: 'Test Topic',
          locale: 'en',
          tags: ['test'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await getTopics();

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/topics',
      expect.objectContaining({
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );
    expect(result).toEqual(mockResponse);
  });

  test('should fetch topics with filters', async () => {
    // Requirement 3.1
    const mockResponse = {
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await getTopics({
      locale: 'en',
      tag: 'test',
      page: 1,
      limit: 20,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/topics?locale=en&tag=test&page=1&limit=20',
      expect.any(Object)
    );
  });

  test('should handle API errors', async () => {
    // Requirement 3.1
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' }),
    });

    await expect(getTopics()).rejects.toThrow(APIError);
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' }),
    });
    
    await expect(getTopics()).rejects.toThrow('Internal server error');
  });

  test('should handle network errors', async () => {
    // Requirement 3.1
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(getTopics()).rejects.toThrow(APIError);
    
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    
    await expect(getTopics()).rejects.toThrow('Network error');
  });
});

describe('getTopicBySlug', () => {
  test('should fetch topic by slug successfully', async () => {
    // Requirement 3.1
    const mockResponse = {
      topic: {
        id: '1',
        slug: 'test-topic',
        title: 'Test Topic',
        locale: 'en',
        tags: ['test'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      primaryQuestion: {
        id: '1',
        text: 'What is this?',
        isPrimary: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      article: {
        id: '1',
        content: 'Test content',
        status: 'PUBLISHED',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      faqItems: [],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await getTopicBySlug('test-topic');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/topics/test-topic',
      expect.objectContaining({
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );
    expect(result).toEqual(mockResponse);
  });

  test('should encode slug in URL', async () => {
    // Requirement 3.1
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await getTopicBySlug('test topic with spaces');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/topics/test%20topic%20with%20spaces',
      expect.any(Object)
    );
  });

  test('should reject invalid slug parameter', async () => {
    // Requirement 3.1
    await expect(getTopicBySlug('')).rejects.toThrow(APIError);
    await expect(getTopicBySlug('')).rejects.toThrow('Invalid slug parameter');
  });

  test('should handle 404 errors', async () => {
    // Requirement 3.1
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Topic not found' }),
    });

    await expect(getTopicBySlug('non-existent')).rejects.toThrow(APIError);
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Topic not found' }),
    });
    
    await expect(getTopicBySlug('non-existent')).rejects.toThrow('Topic not found');
  });
});

describe('createOrUpdateTopic', () => {
  test('should create topic successfully with valid signature', async () => {
    // Requirement 3.2
    const payload = {
      topic: {
        slug: 'test-topic',
        title: 'Test Topic',
        locale: 'en',
        tags: ['test'],
      },
      mainQuestion: {
        text: 'What is this?',
      },
      article: {
        content: 'Test content',
        status: 'PUBLISHED' as const,
      },
      faqItems: [],
    };

    const mockResponse = {
      success: true,
      topicId: '123',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await createOrUpdateTopic(payload);

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/ingest',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-api-key': 'test-api-key',
          'x-timestamp': expect.any(String),
          'x-signature': expect.any(String),
        }),
        body: JSON.stringify(payload),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  test('should generate valid HMAC signature', async () => {
    // Requirement 3.2
    const payload = {
      topic: {
        slug: 'test',
        title: 'Test',
        locale: 'en',
        tags: [],
      },
      mainQuestion: { text: 'Test?' },
      article: { content: 'Test', status: 'DRAFT' as const },
      faqItems: [],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, topicId: '1' }),
    });

    await createOrUpdateTopic(payload);

    const callArgs = mockFetch.mock.calls[0][1];
    const signature = callArgs.headers['x-signature'];
    const timestamp = callArgs.headers['x-timestamp'];

    // Verify signature is a valid hex string
    expect(signature).toMatch(/^[a-f0-9]{64}$/);
    
    // Verify timestamp is a valid number string
    expect(timestamp).toMatch(/^\d+$/);
    expect(parseInt(timestamp)).toBeGreaterThan(0);
  });

  test('should throw error when API key is missing', async () => {
    // Requirement 3.2
    delete process.env.NEXT_PUBLIC_INGEST_API_KEY;

    const payload = {
      topic: { slug: 'test', title: 'Test', locale: 'en', tags: [] },
      mainQuestion: { text: 'Test?' },
      article: { content: 'Test', status: 'DRAFT' as const },
      faqItems: [],
    };

    await expect(createOrUpdateTopic(payload)).rejects.toThrow(APIError);
    await expect(createOrUpdateTopic(payload)).rejects.toThrow(
      'NEXT_PUBLIC_INGEST_API_KEY environment variable is not set'
    );
  });

  test('should handle validation errors', async () => {
    // Requirement 3.2
    const payload = {
      topic: { slug: 'test', title: 'Test', locale: 'en', tags: [] },
      mainQuestion: { text: 'Test?' },
      article: { content: 'Test', status: 'DRAFT' as const },
      faqItems: [],
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: 'Validation failed',
        details: { slug: 'Invalid format' },
      }),
    });

    await expect(createOrUpdateTopic(payload)).rejects.toThrow(APIError);
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: 'Validation failed',
        details: { slug: 'Invalid format' },
      }),
    });
    
    await expect(createOrUpdateTopic(payload)).rejects.toThrow('Validation failed');
  });

  test('should handle authentication errors', async () => {
    // Requirement 3.2
    const payload = {
      topic: { slug: 'test', title: 'Test', locale: 'en', tags: [] },
      mainQuestion: { text: 'Test?' },
      article: { content: 'Test', status: 'DRAFT' as const },
      faqItems: [],
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid signature' }),
    });

    await expect(createOrUpdateTopic(payload)).rejects.toThrow(APIError);
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid signature' }),
    });
    
    await expect(createOrUpdateTopic(payload)).rejects.toThrow('Invalid signature');
  });
});

describe('revalidateCache', () => {
  test('should revalidate cache successfully', async () => {
    // Requirement 3.2
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Cache revalidated', tag: 'topics' }),
    });

    await revalidateCache('topics');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/revalidate',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-api-key': 'test-api-key',
          'x-timestamp': expect.any(String),
          'x-signature': expect.any(String),
        }),
        body: JSON.stringify({ tag: 'topics' }),
      })
    );
  });

  test('should reject invalid tag parameter', async () => {
    // Requirement 3.2
    await expect(revalidateCache('')).rejects.toThrow(APIError);
    await expect(revalidateCache('')).rejects.toThrow('Invalid tag parameter');
  });

  test('should throw error when API key is missing', async () => {
    // Requirement 3.2
    delete process.env.NEXT_PUBLIC_INGEST_API_KEY;

    await expect(revalidateCache('topics')).rejects.toThrow(APIError);
    await expect(revalidateCache('topics')).rejects.toThrow(
      'NEXT_PUBLIC_INGEST_API_KEY environment variable is not set'
    );
  });

  test('should handle revalidation errors', async () => {
    // Requirement 3.2
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Revalidation failed' }),
    });

    await expect(revalidateCache('topics')).rejects.toThrow(APIError);
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Revalidation failed' }),
    });
    
    await expect(revalidateCache('topics')).rejects.toThrow('Revalidation failed');
  });
});

describe('revalidateTopicCache', () => {
  test('should revalidate both topics list and specific topic', async () => {
    // Requirement 3.2
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Cache revalidated', tag: 'topics' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Cache revalidated', tag: 'topic:test-slug' }),
      });

    await revalidateTopicCache('test-slug');

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      '/api/revalidate',
      expect.objectContaining({
        body: JSON.stringify({ tag: 'topics' }),
      })
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      '/api/revalidate',
      expect.objectContaining({
        body: JSON.stringify({ tag: 'topic:test-slug' }),
      })
    );
  });

  test('should not throw error if revalidation fails', async () => {
    // Requirement 3.2
    // Mock console.error to suppress error output
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockFetch.mockRejectedValue(new Error('Revalidation failed'));

    // Should not throw
    await expect(revalidateTopicCache('test-slug')).resolves.toBeUndefined();

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});

describe('Signature Generation', () => {
  test('should generate consistent signatures for same input', async () => {
    // Requirement 3.2
    const payload = {
      topic: { slug: 'test', title: 'Test', locale: 'en', tags: [] },
      mainQuestion: { text: 'Test?' },
      article: { content: 'Test', status: 'DRAFT' as const },
      faqItems: [],
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, topicId: '1' }),
    });

    // Call twice with same timestamp
    const timestamp = Date.now().toString();
    vi.spyOn(Date, 'now').mockReturnValue(parseInt(timestamp));

    await createOrUpdateTopic(payload);
    const signature1 = mockFetch.mock.calls[0][1].headers['x-signature'];

    mockFetch.mockClear();
    await createOrUpdateTopic(payload);
    const signature2 = mockFetch.mock.calls[0][1].headers['x-signature'];

    expect(signature1).toBe(signature2);
  });

  test('should generate different signatures for different payloads', async () => {
    // Requirement 3.2
    const payload1 = {
      topic: { slug: 'test1', title: 'Test 1', locale: 'en', tags: [] },
      mainQuestion: { text: 'Test?' },
      article: { content: 'Test', status: 'DRAFT' as const },
      faqItems: [],
    };

    const payload2 = {
      topic: { slug: 'test2', title: 'Test 2', locale: 'en', tags: [] },
      mainQuestion: { text: 'Test?' },
      article: { content: 'Test', status: 'DRAFT' as const },
      faqItems: [],
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, topicId: '1' }),
    });

    const timestamp = Date.now().toString();
    vi.spyOn(Date, 'now').mockReturnValue(parseInt(timestamp));

    await createOrUpdateTopic(payload1);
    const signature1 = mockFetch.mock.calls[0][1].headers['x-signature'];

    mockFetch.mockClear();
    await createOrUpdateTopic(payload2);
    const signature2 = mockFetch.mock.calls[0][1].headers['x-signature'];

    expect(signature1).not.toBe(signature2);
  });

  test('should throw error when webhook secret is missing', async () => {
    // Requirement 3.2
    delete process.env.NEXT_PUBLIC_INGEST_WEBHOOK_SECRET;

    const payload = {
      topic: { slug: 'test', title: 'Test', locale: 'en', tags: [] },
      mainQuestion: { text: 'Test?' },
      article: { content: 'Test', status: 'DRAFT' as const },
      faqItems: [],
    };

    await expect(createOrUpdateTopic(payload)).rejects.toThrow(
      'NEXT_PUBLIC_INGEST_WEBHOOK_SECRET environment variable is not set'
    );
  });
});
