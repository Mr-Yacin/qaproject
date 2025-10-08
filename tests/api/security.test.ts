import { describe, test, expect } from 'vitest';
import { POST as ingestPOST } from '../../src/app/api/ingest/route';
import { POST as revalidatePOST } from '../../src/app/api/revalidate/route';
import { generateTestSignature } from '../utils/test-helpers';
import { NextRequest } from 'next/server';

/**
 * Security Acceptance Tests
 * Requirements: 1.2, 5.2, 7.1, 1.3, 7.2, 1.5, 7.3
 */

describe('Security - Invalid API Key Rejection', () => {
  const validPayload = {
    topic: { slug: 'test', title: 'Test', locale: 'en', tags: [] },
    mainQuestion: { text: 'What is this?' },
    article: { content: 'Content', status: 'PUBLISHED' },
    faqItems: []
  };

  test('POST /api/ingest rejects request with wrong x-api-key', async () => {
    // Requirement 1.2, 7.1
    const timestamp = Date.now().toString();
    const body = JSON.stringify(validPayload);
    const signature = generateTestSignature(timestamp, body);

    const request = new NextRequest('http://localhost:3000/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'wrong-api-key',
        'x-timestamp': timestamp,
        'x-signature': signature,
      },
      body,
    });

    const response = await ingestPOST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(401);
    expect(responseBody.error).toBe('Unauthorized');
  });

  test('POST /api/ingest rejects request with missing x-api-key', async () => {
    // Requirement 1.2, 7.1
    const timestamp = Date.now().toString();
    const body = JSON.stringify(validPayload);
    const signature = generateTestSignature(timestamp, body);

    const request = new NextRequest('http://localhost:3000/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-timestamp': timestamp,
        'x-signature': signature,
      },
      body,
    });

    const response = await ingestPOST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(401);
    expect(responseBody.error).toBe('Unauthorized');
  });

  test('POST /api/revalidate rejects request with wrong x-api-key', async () => {
    // Requirement 5.2, 7.1
    const revalidatePayload = { tag: 'test-tag' };
    const timestamp = Date.now().toString();
    const body = JSON.stringify(revalidatePayload);
    const signature = generateTestSignature(timestamp, body);

    const request = new NextRequest('http://localhost:3000/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'wrong-api-key',
        'x-timestamp': timestamp,
        'x-signature': signature,
      },
      body,
    });

    const response = await revalidatePOST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(401);
    expect(responseBody.error).toBe('Unauthorized');
  });

  test('POST /api/revalidate rejects request with missing x-api-key', async () => {
    // Requirement 5.2, 7.1
    const revalidatePayload = { tag: 'test-tag' };
    const timestamp = Date.now().toString();
    const body = JSON.stringify(revalidatePayload);
    const signature = generateTestSignature(timestamp, body);

    const request = new NextRequest('http://localhost:3000/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-timestamp': timestamp,
        'x-signature': signature,
      },
      body,
    });

    const response = await revalidatePOST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(401);
    expect(responseBody.error).toBe('Unauthorized');
  });
});

describe('Security - Expired Timestamp Rejection', () => {
  const validPayload = {
    topic: { slug: 'test', title: 'Test', locale: 'en', tags: [] },
    mainQuestion: { text: 'What is this?' },
    article: { content: 'Content', status: 'PUBLISHED' },
    faqItems: []
  };

  test('POST /api/ingest rejects request with timestamp > 5 minutes in past', async () => {
    // Requirement 1.3, 7.2
    const oldTimestamp = (Date.now() - (6 * 60 * 1000)).toString(); // 6 minutes ago
    const body = JSON.stringify(validPayload);
    const signature = generateTestSignature(oldTimestamp, body);

    const request = new NextRequest('http://localhost:3000/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INGEST_API_KEY || 'test-api-key',
        'x-timestamp': oldTimestamp,
        'x-signature': signature,
      },
      body,
    });

    const response = await ingestPOST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(401);
    expect(responseBody.error).toBe('Unauthorized');
    expect(responseBody.details).toContain('Request expired');
  });

  test('POST /api/ingest rejects request with timestamp > 5 minutes in future', async () => {
    // Requirement 1.3, 7.2
    const futureTimestamp = (Date.now() + (6 * 60 * 1000)).toString(); // 6 minutes in future
    const body = JSON.stringify(validPayload);
    const signature = generateTestSignature(futureTimestamp, body);

    const request = new NextRequest('http://localhost:3000/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INGEST_API_KEY || 'test-api-key',
        'x-timestamp': futureTimestamp,
        'x-signature': signature,
      },
      body,
    });

    const response = await ingestPOST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(401);
    expect(responseBody.error).toBe('Unauthorized');
    expect(responseBody.details).toContain('Request expired');
  });

  test('POST /api/revalidate rejects request with timestamp > 5 minutes in past', async () => {
    // Requirement 1.3, 7.2
    const revalidatePayload = { tag: 'test-tag' };
    const oldTimestamp = (Date.now() - (6 * 60 * 1000)).toString(); // 6 minutes ago
    const body = JSON.stringify(revalidatePayload);
    const signature = generateTestSignature(oldTimestamp, body);

    const request = new NextRequest('http://localhost:3000/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INGEST_API_KEY || 'test-api-key',
        'x-timestamp': oldTimestamp,
        'x-signature': signature,
      },
      body,
    });

    const response = await revalidatePOST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(401);
    expect(responseBody.error).toBe('Unauthorized');
    expect(responseBody.details).toContain('Request expired');
  });

  test('POST /api/revalidate rejects request with timestamp > 5 minutes in future', async () => {
    // Requirement 1.3, 7.2
    const revalidatePayload = { tag: 'test-tag' };
    const futureTimestamp = (Date.now() + (6 * 60 * 1000)).toString(); // 6 minutes in future
    const body = JSON.stringify(revalidatePayload);
    const signature = generateTestSignature(futureTimestamp, body);

    const request = new NextRequest('http://localhost:3000/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INGEST_API_KEY || 'test-api-key',
        'x-timestamp': futureTimestamp,
        'x-signature': signature,
      },
      body,
    });

    const response = await revalidatePOST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(401);
    expect(responseBody.error).toBe('Unauthorized');
    expect(responseBody.details).toContain('Request expired');
  });
});

describe('Security - Invalid Signature Rejection', () => {
  const validPayload = {
    topic: { slug: 'test', title: 'Test', locale: 'en', tags: [] },
    mainQuestion: { text: 'What is this?' },
    article: { content: 'Content', status: 'PUBLISHED' },
    faqItems: []
  };

  test('POST /api/ingest rejects request with incorrect x-signature', async () => {
    // Requirement 1.5, 7.3
    const timestamp = Date.now().toString();
    const body = JSON.stringify(validPayload);

    const request = new NextRequest('http://localhost:3000/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INGEST_API_KEY || 'test-api-key',
        'x-timestamp': timestamp,
        'x-signature': 'incorrect-signature-value',
      },
      body,
    });

    const response = await ingestPOST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(401);
    expect(responseBody.error).toBe('Unauthorized');
  });

  test('POST /api/ingest rejects request with missing x-signature', async () => {
    // Requirement 1.5, 7.3
    const timestamp = Date.now().toString();
    const body = JSON.stringify(validPayload);

    const request = new NextRequest('http://localhost:3000/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INGEST_API_KEY || 'test-api-key',
        'x-timestamp': timestamp,
      },
      body,
    });

    const response = await ingestPOST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(401);
    expect(responseBody.error).toBe('Unauthorized');
  });

  test('POST /api/revalidate rejects request with incorrect x-signature', async () => {
    // Requirement 1.5, 7.3
    const revalidatePayload = { tag: 'test-tag' };
    const timestamp = Date.now().toString();
    const body = JSON.stringify(revalidatePayload);

    const request = new NextRequest('http://localhost:3000/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INGEST_API_KEY || 'test-api-key',
        'x-timestamp': timestamp,
        'x-signature': 'incorrect-signature-value',
      },
      body,
    });

    const response = await revalidatePOST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(401);
    expect(responseBody.error).toBe('Unauthorized');
  });

  test('POST /api/revalidate rejects request with missing x-signature', async () => {
    // Requirement 1.5, 7.3
    const revalidatePayload = { tag: 'test-tag' };
    const timestamp = Date.now().toString();
    const body = JSON.stringify(revalidatePayload);

    const request = new NextRequest('http://localhost:3000/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INGEST_API_KEY || 'test-api-key',
        'x-timestamp': timestamp,
      },
      body,
    });

    const response = await revalidatePOST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(401);
    expect(responseBody.error).toBe('Unauthorized');
  });
});
