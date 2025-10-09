import { describe, test, expect } from 'vitest';
import { POST as ingestPOST } from '../../../src/app/api/ingest/route';
import { POST as revalidatePOST } from '../../../src/app/api/revalidate/route';
import { generateTestSignature } from '../../utils/test-helpers';
import { NextRequest } from 'next/server';

/**
 * Validation Acceptance Tests
 * Requirements: 1.7, 6.2, 7.4
 */

describe('Validation - Zod Validation Failures', () => {
  test('POST /api/ingest rejects payload with missing topic.slug', async () => {
    // Requirement 1.7, 6.2, 7.4
    const invalidPayload = {
      topic: {
        // slug is missing
        title: 'Test Topic',
        locale: 'en',
        tags: []
      },
      mainQuestion: { text: 'What is this?' },
      article: { content: 'Content', status: 'PUBLISHED' },
      faqItems: []
    };

    const timestamp = Date.now().toString();
    const body = JSON.stringify(invalidPayload);
    const signature = generateTestSignature(timestamp, body);

    const request = new NextRequest('http://localhost:3000/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INGEST_API_KEY || 'test-api-key',
        'x-timestamp': timestamp,
        'x-signature': signature,
      },
      body,
    });

    const response = await ingestPOST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody.error).toBe('Validation failed');
    expect(responseBody.details).toBeDefined();
  });

  test('POST /api/ingest rejects payload with invalid locale format', async () => {
    // Requirement 1.7, 6.2, 7.4
    const invalidPayload = {
      topic: {
        slug: 'test-topic',
        title: 'Test Topic',
        locale: 'english', // Should be 2 characters like "en"
        tags: []
      },
      mainQuestion: { text: 'What is this?' },
      article: { content: 'Content', status: 'PUBLISHED' },
      faqItems: []
    };

    const timestamp = Date.now().toString();
    const body = JSON.stringify(invalidPayload);
    const signature = generateTestSignature(timestamp, body);

    const request = new NextRequest('http://localhost:3000/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INGEST_API_KEY || 'test-api-key',
        'x-timestamp': timestamp,
        'x-signature': signature,
      },
      body,
    });

    const response = await ingestPOST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody.error).toBe('Validation failed');
    expect(responseBody.details).toBeDefined();
  });

  test('POST /api/ingest rejects payload with invalid article.status enum', async () => {
    // Requirement 1.7, 6.2, 7.4
    const invalidPayload = {
      topic: {
        slug: 'test-topic',
        title: 'Test Topic',
        locale: 'en',
        tags: []
      },
      mainQuestion: { text: 'What is this?' },
      article: {
        content: 'Content',
        status: 'INVALID_STATUS' // Should be 'DRAFT' or 'PUBLISHED'
      },
      faqItems: []
    };

    const timestamp = Date.now().toString();
    const body = JSON.stringify(invalidPayload);
    const signature = generateTestSignature(timestamp, body);

    const request = new NextRequest('http://localhost:3000/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INGEST_API_KEY || 'test-api-key',
        'x-timestamp': timestamp,
        'x-signature': signature,
      },
      body,
    });

    const response = await ingestPOST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody.error).toBe('Validation failed');
    expect(responseBody.details).toBeDefined();
  });

  test('POST /api/revalidate rejects payload with missing tag field', async () => {
    // Requirement 1.7, 6.2, 7.4
    const invalidPayload = {
      // tag field is missing
      someOtherField: 'value'
    };

    const timestamp = Date.now().toString();
    const body = JSON.stringify(invalidPayload);
    const signature = generateTestSignature(timestamp, body);

    const request = new NextRequest('http://localhost:3000/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INGEST_API_KEY || 'test-api-key',
        'x-timestamp': timestamp,
        'x-signature': signature,
      },
      body,
    });

    const response = await revalidatePOST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody.error).toBe('Validation failed');
    expect(responseBody.details).toBeDefined();
  });

  test('POST /api/ingest rejects payload with empty topic.slug', async () => {
    // Requirement 1.7, 6.2, 7.4
    const invalidPayload = {
      topic: {
        slug: '', // Empty string should fail min(1) validation
        title: 'Test Topic',
        locale: 'en',
        tags: []
      },
      mainQuestion: { text: 'What is this?' },
      article: { content: 'Content', status: 'PUBLISHED' },
      faqItems: []
    };

    const timestamp = Date.now().toString();
    const body = JSON.stringify(invalidPayload);
    const signature = generateTestSignature(timestamp, body);

    const request = new NextRequest('http://localhost:3000/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INGEST_API_KEY || 'test-api-key',
        'x-timestamp': timestamp,
        'x-signature': signature,
      },
      body,
    });

    const response = await ingestPOST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody.error).toBe('Validation failed');
    expect(responseBody.details).toBeDefined();
  });

  test('POST /api/revalidate rejects payload with empty tag field', async () => {
    // Requirement 1.7, 6.2, 7.4
    const invalidPayload = {
      tag: '' // Empty string should fail min(1) validation
    };

    const timestamp = Date.now().toString();
    const body = JSON.stringify(invalidPayload);
    const signature = generateTestSignature(timestamp, body);

    const request = new NextRequest('http://localhost:3000/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INGEST_API_KEY || 'test-api-key',
        'x-timestamp': timestamp,
        'x-signature': signature,
      },
      body,
    });

    const response = await revalidatePOST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody.error).toBe('Validation failed');
    expect(responseBody.details).toBeDefined();
  });
});
