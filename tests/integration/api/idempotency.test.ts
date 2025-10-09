import { describe, test, expect, beforeEach } from 'vitest';
import { POST as ingestPOST } from '../../../src/app/api/ingest/route';
import { generateTestSignature, cleanDatabase } from '../../utils/test-helpers';
import { prisma } from '../../../src/lib/db';
import { NextRequest } from 'next/server';

/**
 * Idempotency Acceptance Tests
 * Requirements: 3.9, 7.6
 */

describe('Idempotency - Duplicate Ingest Requests', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  test('sends same payload twice with valid authentication and verifies idempotency', async () => {
    // Requirement 3.9, 7.6
    const payload = {
      topic: {
        slug: 'idempotency-test',
        title: 'Idempotency Test Topic',
        locale: 'en',
        tags: ['test', 'idempotency']
      },
      mainQuestion: {
        text: 'What is idempotency?'
      },
      article: {
        content: 'Idempotency means that multiple identical requests have the same effect as a single request.',
        status: 'PUBLISHED'
      },
      faqItems: [
        { question: 'Why is idempotency important?', answer: 'It prevents duplicate operations.', order: 0 },
        { question: 'How is it implemented?', answer: 'Using upsert operations.', order: 1 }
      ]
    };

    // First request
    const timestamp1 = Date.now().toString();
    const body1 = JSON.stringify(payload);
    const signature1 = generateTestSignature(timestamp1, body1);

    const request1 = new NextRequest('http://localhost:3000/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INGEST_API_KEY || 'test-api-key',
        'x-timestamp': timestamp1,
        'x-signature': signature1,
      },
      body: body1,
    });

    const response1 = await ingestPOST(request1);
    const responseBody1 = await response1.json();

    // Assert first request succeeds
    expect(response1.status).toBe(200);
    expect(responseBody1.success).toBe(true);
    expect(responseBody1.topicId).toBeDefined();
    expect(responseBody1.jobId).toBeDefined();

    // Wait a moment to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    // Second request with same payload but different timestamp/signature
    const timestamp2 = Date.now().toString();
    const body2 = JSON.stringify(payload);
    const signature2 = generateTestSignature(timestamp2, body2);

    const request2 = new NextRequest('http://localhost:3000/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INGEST_API_KEY || 'test-api-key',
        'x-timestamp': timestamp2,
        'x-signature': signature2,
      },
      body: body2,
    });

    const response2 = await ingestPOST(request2);
    const responseBody2 = await response2.json();

    // Assert second request also succeeds
    expect(response2.status).toBe(200);
    expect(responseBody2.success).toBe(true);
    expect(responseBody2.topicId).toBeDefined();
    expect(responseBody2.jobId).toBeDefined();

    // Query database and verify only one topic exists
    const topics = await prisma.topic.findMany({
      where: { slug: 'idempotency-test' },
      include: {
        questions: true,
        articles: true,
        faqItems: { orderBy: { order: 'asc' } }
      }
    });

    expect(topics).toHaveLength(1);

    const topic = topics[0];

    // Verify topic data matches payload
    expect(topic.slug).toBe(payload.topic.slug);
    expect(topic.title).toBe(payload.topic.title);
    expect(topic.locale).toBe(payload.topic.locale);
    expect(topic.tags).toEqual(payload.topic.tags);

    // Verify primary question
    expect(topic.questions).toHaveLength(1);
    expect(topic.questions[0].text).toBe(payload.mainQuestion.text);
    expect(topic.questions[0].isPrimary).toBe(true);

    // Verify article
    expect(topic.articles).toHaveLength(1);
    expect(topic.articles[0].content).toBe(payload.article.content);
    expect(topic.articles[0].status).toBe(payload.article.status);

    // Verify FAQ items were replaced correctly
    expect(topic.faqItems).toHaveLength(2);
    expect(topic.faqItems[0].question).toBe(payload.faqItems[0].question);
    expect(topic.faqItems[0].answer).toBe(payload.faqItems[0].answer);
    expect(topic.faqItems[0].order).toBe(payload.faqItems[0].order);
    expect(topic.faqItems[1].question).toBe(payload.faqItems[1].question);
    expect(topic.faqItems[1].answer).toBe(payload.faqItems[1].answer);
    expect(topic.faqItems[1].order).toBe(payload.faqItems[1].order);

    // Verify both topicIds are the same
    expect(responseBody1.topicId).toBe(responseBody2.topicId);

    // Verify two IngestJob records exist (one for each request)
    const ingestJobs = await prisma.ingestJob.findMany({
      where: { topicSlug: 'idempotency-test' },
      orderBy: { createdAt: 'asc' }
    });

    expect(ingestJobs).toHaveLength(2);
    expect(ingestJobs[0].status).toBe('completed');
    expect(ingestJobs[1].status).toBe('completed');
  });

  test('verifies FAQ items are replaced correctly on duplicate ingest', async () => {
    // Requirement 3.9, 7.6
    const initialPayload = {
      topic: {
        slug: 'faq-replacement-test',
        title: 'FAQ Replacement Test',
        locale: 'en',
        tags: ['test']
      },
      mainQuestion: {
        text: 'What is this test about?'
      },
      article: {
        content: 'Testing FAQ replacement.',
        status: 'PUBLISHED'
      },
      faqItems: [
        { question: 'Question 1', answer: 'Answer 1', order: 0 },
        { question: 'Question 2', answer: 'Answer 2', order: 1 },
        { question: 'Question 3', answer: 'Answer 3', order: 2 }
      ]
    };

    // First request with 3 FAQ items
    const timestamp1 = Date.now().toString();
    const body1 = JSON.stringify(initialPayload);
    const signature1 = generateTestSignature(timestamp1, body1);

    const request1 = new NextRequest('http://localhost:3000/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INGEST_API_KEY || 'test-api-key',
        'x-timestamp': timestamp1,
        'x-signature': signature1,
      },
      body: body1,
    });

    const response1 = await ingestPOST(request1);
    expect(response1.status).toBe(200);

    // Verify 3 FAQ items exist
    let faqItems = await prisma.fAQItem.findMany({
      where: { topic: { slug: 'faq-replacement-test' } },
      orderBy: { order: 'asc' }
    });
    expect(faqItems).toHaveLength(3);

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 10));

    // Second request with different FAQ items (2 items instead of 3)
    const updatedPayload = {
      ...initialPayload,
      faqItems: [
        { question: 'New Question 1', answer: 'New Answer 1', order: 0 },
        { question: 'New Question 2', answer: 'New Answer 2', order: 1 }
      ]
    };

    const timestamp2 = Date.now().toString();
    const body2 = JSON.stringify(updatedPayload);
    const signature2 = generateTestSignature(timestamp2, body2);

    const request2 = new NextRequest('http://localhost:3000/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INGEST_API_KEY || 'test-api-key',
        'x-timestamp': timestamp2,
        'x-signature': signature2,
      },
      body: body2,
    });

    const response2 = await ingestPOST(request2);
    expect(response2.status).toBe(200);

    // Verify FAQ items were replaced (should now be 2 items with new content)
    faqItems = await prisma.fAQItem.findMany({
      where: { topic: { slug: 'faq-replacement-test' } },
      orderBy: { order: 'asc' }
    });

    expect(faqItems).toHaveLength(2);
    expect(faqItems[0].question).toBe('New Question 1');
    expect(faqItems[0].answer).toBe('New Answer 1');
    expect(faqItems[1].question).toBe('New Question 2');
    expect(faqItems[1].answer).toBe('New Answer 2');
  });

  test('verifies topic fields are updated on duplicate ingest with different data', async () => {
    // Requirement 3.9, 7.6
    const initialPayload = {
      topic: {
        slug: 'update-test',
        title: 'Initial Title',
        locale: 'en',
        tags: ['initial']
      },
      mainQuestion: {
        text: 'Initial question?'
      },
      article: {
        content: 'Initial content.',
        status: 'DRAFT'
      },
      faqItems: []
    };

    // First request
    const timestamp1 = Date.now().toString();
    const body1 = JSON.stringify(initialPayload);
    const signature1 = generateTestSignature(timestamp1, body1);

    const request1 = new NextRequest('http://localhost:3000/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INGEST_API_KEY || 'test-api-key',
        'x-timestamp': timestamp1,
        'x-signature': signature1,
      },
      body: body1,
    });

    const response1 = await ingestPOST(request1);
    expect(response1.status).toBe(200);

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 10));

    // Second request with updated data
    const updatedPayload = {
      topic: {
        slug: 'update-test', // Same slug
        title: 'Updated Title',
        locale: 'es',
        tags: ['updated', 'new-tag']
      },
      mainQuestion: {
        text: 'Updated question?'
      },
      article: {
        content: 'Updated content.',
        status: 'PUBLISHED'
      },
      faqItems: []
    };

    const timestamp2 = Date.now().toString();
    const body2 = JSON.stringify(updatedPayload);
    const signature2 = generateTestSignature(timestamp2, body2);

    const request2 = new NextRequest('http://localhost:3000/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INGEST_API_KEY || 'test-api-key',
        'x-timestamp': timestamp2,
        'x-signature': signature2,
      },
      body: body2,
    });

    const response2 = await ingestPOST(request2);
    expect(response2.status).toBe(200);

    // Verify only one topic exists with updated data
    const topic = await prisma.topic.findUnique({
      where: { slug: 'update-test' },
      include: {
        questions: true,
        articles: true
      }
    });

    expect(topic).toBeDefined();
    expect(topic!.title).toBe('Updated Title');
    expect(topic!.locale).toBe('es');
    expect(topic!.tags).toEqual(['updated', 'new-tag']);

    // Verify question was updated
    expect(topic!.questions).toHaveLength(1);
    expect(topic!.questions[0].text).toBe('Updated question?');

    // Verify article was updated
    expect(topic!.articles).toHaveLength(1);
    expect(topic!.articles[0].content).toBe('Updated content.');
    expect(topic!.articles[0].status).toBe('PUBLISHED');
  });
});
