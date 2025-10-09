import { describe, test, expect, beforeEach, vi } from 'vitest';
import { POST as ingestPOST } from '../../../src/app/api/ingest/route';
import { generateTestSignature, cleanDatabase } from '../../utils/test-helpers';
import { prisma } from '../../../src/lib/db';
import { NextRequest } from 'next/server';

// Mock revalidateTag using factory function
vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

// Import after mocking
import { POST as revalidatePOST } from '../../../src/app/api/revalidate/route';
import { revalidateTag } from 'next/cache';

/**
 * Integration Acceptance Tests
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 5.3, 5.4, 5.5, 7.5, 7.9
 */

describe('Integration - Complete Ingestion Flow', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  test('sends full ingest payload and verifies all entities are created correctly', async () => {
    // Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 7.5
    
    // Prepare full ingest payload with topic, question, article, and FAQ items
    const payload = {
      topic: {
        slug: 'complete-integration-test',
        title: 'Complete Integration Test Topic',
        locale: 'en',
        tags: ['integration', 'test', 'complete']
      },
      mainQuestion: {
        text: 'What is the complete integration test about?'
      },
      article: {
        content: 'This is a comprehensive test that verifies the entire ingestion flow from API request to database persistence. It ensures all entities are created correctly with proper relationships.',
        status: 'PUBLISHED'
      },
      faqItems: [
        { 
          question: 'What does this test verify?', 
          answer: 'It verifies that all entities are created in the database.', 
          order: 0 
        },
        { 
          question: 'Why is order important?', 
          answer: 'Order ensures FAQ items are displayed in the correct sequence.', 
          order: 1 
        },
        { 
          question: 'What about the primary question?', 
          answer: 'The primary question should have isPrimary set to true.', 
          order: 2 
        }
      ]
    };

    // Generate authentication headers
    const timestamp = Date.now().toString();
    const body = JSON.stringify(payload);
    const signature = generateTestSignature(timestamp, body);

    // Create authenticated request
    const request = new NextRequest('http://localhost:3000/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INGEST_API_KEY || 'test-api-key',
        'x-timestamp': timestamp,
        'x-signature': signature,
      },
      body: body,
    });

    // Send request
    const response = await ingestPOST(request);
    const responseBody = await response.json();

    // Assert 200 response
    expect(response.status).toBe(200);
    expect(responseBody.success).toBe(true);
    expect(responseBody.topicId).toBeDefined();
    expect(responseBody.jobId).toBeDefined();

    // Query database and verify all entities were created
    const topic = await prisma.topic.findUnique({
      where: { slug: 'complete-integration-test' },
      include: {
        questions: {
          orderBy: { createdAt: 'asc' }
        },
        articles: true,
        faqItems: {
          orderBy: { order: 'asc' }
        }
      }
    });

    // Verify topic exists and has correct data
    expect(topic).toBeDefined();
    expect(topic).not.toBeNull();
    expect(topic!.id).toBe(responseBody.topicId);
    expect(topic!.slug).toBe(payload.topic.slug);
    expect(topic!.title).toBe(payload.topic.title);
    expect(topic!.locale).toBe(payload.topic.locale);
    expect(topic!.tags).toEqual(payload.topic.tags);
    expect(topic!.createdAt).toBeInstanceOf(Date);
    expect(topic!.updatedAt).toBeInstanceOf(Date);

    // Verify primary question has isPrimary=true
    expect(topic!.questions).toHaveLength(1);
    const primaryQuestion = topic!.questions[0];
    expect(primaryQuestion.text).toBe(payload.mainQuestion.text);
    expect(primaryQuestion.isPrimary).toBe(true);
    expect(primaryQuestion.topicId).toBe(topic!.id);

    // Verify article was created correctly
    expect(topic!.articles).toHaveLength(1);
    const article = topic!.articles[0];
    expect(article.content).toBe(payload.article.content);
    expect(article.status).toBe(payload.article.status);
    expect(article.topicId).toBe(topic!.id);

    // Verify FAQ items have correct order
    expect(topic!.faqItems).toHaveLength(3);
    
    const faqItem0 = topic!.faqItems[0];
    expect(faqItem0.question).toBe(payload.faqItems[0].question);
    expect(faqItem0.answer).toBe(payload.faqItems[0].answer);
    expect(faqItem0.order).toBe(0);
    expect(faqItem0.topicId).toBe(topic!.id);

    const faqItem1 = topic!.faqItems[1];
    expect(faqItem1.question).toBe(payload.faqItems[1].question);
    expect(faqItem1.answer).toBe(payload.faqItems[1].answer);
    expect(faqItem1.order).toBe(1);
    expect(faqItem1.topicId).toBe(topic!.id);

    const faqItem2 = topic!.faqItems[2];
    expect(faqItem2.question).toBe(payload.faqItems[2].question);
    expect(faqItem2.answer).toBe(payload.faqItems[2].answer);
    expect(faqItem2.order).toBe(2);
    expect(faqItem2.topicId).toBe(topic!.id);

    // Verify IngestJob record exists with "completed" status
    const ingestJob = await prisma.ingestJob.findUnique({
      where: { id: responseBody.jobId }
    });

    expect(ingestJob).toBeDefined();
    expect(ingestJob).not.toBeNull();
    expect(ingestJob!.id).toBe(responseBody.jobId);
    expect(ingestJob!.topicSlug).toBe(payload.topic.slug);
    expect(ingestJob!.status).toBe('completed');
    expect(ingestJob!.payload).toEqual(payload);
    expect(ingestJob!.error).toBeNull();
    expect(ingestJob!.createdAt).toBeInstanceOf(Date);
    expect(ingestJob!.completedAt).toBeInstanceOf(Date);
    expect(ingestJob!.completedAt!.getTime()).toBeGreaterThanOrEqual(ingestJob!.createdAt.getTime());
  });

  test('verifies ingestion with empty FAQ items array', async () => {
    // Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
    
    const payload = {
      topic: {
        slug: 'no-faq-test',
        title: 'Topic Without FAQs',
        locale: 'es',
        tags: ['minimal']
      },
      mainQuestion: {
        text: '¿Qué es esto?'
      },
      article: {
        content: 'Contenido del artículo sin preguntas frecuentes.',
        status: 'DRAFT'
      },
      faqItems: []
    };

    const timestamp = Date.now().toString();
    const body = JSON.stringify(payload);
    const signature = generateTestSignature(timestamp, body);

    const request = new NextRequest('http://localhost:3000/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INGEST_API_KEY || 'test-api-key',
        'x-timestamp': timestamp,
        'x-signature': signature,
      },
      body: body,
    });

    const response = await ingestPOST(request);
    const responseBody = await response.json();

    // Assert success
    expect(response.status).toBe(200);
    expect(responseBody.success).toBe(true);

    // Verify topic and related entities
    const topic = await prisma.topic.findUnique({
      where: { slug: 'no-faq-test' },
      include: {
        questions: true,
        articles: true,
        faqItems: true
      }
    });

    expect(topic).toBeDefined();
    expect(topic!.questions).toHaveLength(1);
    expect(topic!.questions[0].isPrimary).toBe(true);
    expect(topic!.articles).toHaveLength(1);
    expect(topic!.faqItems).toHaveLength(0);

    // Verify IngestJob completed
    const ingestJob = await prisma.ingestJob.findUnique({
      where: { id: responseBody.jobId }
    });
    expect(ingestJob!.status).toBe('completed');
  });

  test('verifies ingestion with multiple tags', async () => {
    // Requirements: 3.1, 3.2
    
    const payload = {
      topic: {
        slug: 'multi-tag-test',
        title: 'Topic With Multiple Tags',
        locale: 'en',
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']
      },
      mainQuestion: {
        text: 'How are multiple tags handled?'
      },
      article: {
        content: 'Multiple tags are stored as an array.',
        status: 'PUBLISHED'
      },
      faqItems: []
    };

    const timestamp = Date.now().toString();
    const body = JSON.stringify(payload);
    const signature = generateTestSignature(timestamp, body);

    const request = new NextRequest('http://localhost:3000/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INGEST_API_KEY || 'test-api-key',
        'x-timestamp': timestamp,
        'x-signature': signature,
      },
      body: body,
    });

    const response = await ingestPOST(request);
    expect(response.status).toBe(200);

    const topic = await prisma.topic.findUnique({
      where: { slug: 'multi-tag-test' }
    });

    expect(topic!.tags).toEqual(['tag1', 'tag2', 'tag3', 'tag4', 'tag5']);
  });

  test('verifies cascade relationships are properly set up', async () => {
    // Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
    
    const payload = {
      topic: {
        slug: 'cascade-test',
        title: 'Cascade Delete Test',
        locale: 'en',
        tags: ['cascade']
      },
      mainQuestion: {
        text: 'Will related entities be deleted?'
      },
      article: {
        content: 'Testing cascade delete behavior.',
        status: 'PUBLISHED'
      },
      faqItems: [
        { question: 'Q1', answer: 'A1', order: 0 }
      ]
    };

    const timestamp = Date.now().toString();
    const body = JSON.stringify(payload);
    const signature = generateTestSignature(timestamp, body);

    const request = new NextRequest('http://localhost:3000/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INGEST_API_KEY || 'test-api-key',
        'x-timestamp': timestamp,
        'x-signature': signature,
      },
      body: body,
    });

    const response = await ingestPOST(request);
    const responseBody = await response.json();
    expect(response.status).toBe(200);

    const topicId = responseBody.topicId;

    // Verify all entities exist
    const questionsBefore = await prisma.question.findMany({ where: { topicId } });
    const articlesBefore = await prisma.article.findMany({ where: { topicId } });
    const faqItemsBefore = await prisma.fAQItem.findMany({ where: { topicId } });

    expect(questionsBefore).toHaveLength(1);
    expect(articlesBefore).toHaveLength(1);
    expect(faqItemsBefore).toHaveLength(1);

    // Delete the topic
    await prisma.topic.delete({ where: { id: topicId } });

    // Verify all related entities were cascade deleted
    const questionsAfter = await prisma.question.findMany({ where: { topicId } });
    const articlesAfter = await prisma.article.findMany({ where: { topicId } });
    const faqItemsAfter = await prisma.fAQItem.findMany({ where: { topicId } });

    expect(questionsAfter).toHaveLength(0);
    expect(articlesAfter).toHaveLength(0);
    expect(faqItemsAfter).toHaveLength(0);
  });
});

describe('Integration - Cache Revalidation', () => {
  beforeEach(async () => {
    await cleanDatabase();
    // Clear mock calls before each test
    vi.mocked(revalidateTag).mockClear();
  });

  test('sends valid revalidate request with tag and verifies 200 response with confirmation', async () => {
    // Requirements: 5.3, 5.4, 5.5, 7.9
    
    // Prepare revalidate payload with tag
    const payload = {
      tag: 'topic-slug-123'
    };

    // Generate authentication headers
    const timestamp = Date.now().toString();
    const body = JSON.stringify(payload);
    const signature = generateTestSignature(timestamp, body);

    // Create authenticated request
    const request = new NextRequest('http://localhost:3000/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INGEST_API_KEY || 'test-api-key',
        'x-timestamp': timestamp,
        'x-signature': signature,
      },
      body: body,
    });

    // Send request
    const response = await revalidatePOST(request);
    const responseBody = await response.json();

    // Assert 200 response with confirmation (Requirements 5.5, 7.9)
    expect(response.status).toBe(200);
    expect(responseBody.message).toBe('Revalidated successfully');
    expect(responseBody.tag).toBe(payload.tag);

    // Verify revalidateTag was called with the correct tag (Requirement 5.3, 7.9)
    expect(revalidateTag).toHaveBeenCalledTimes(1);
    expect(revalidateTag).toHaveBeenCalledWith(payload.tag);
  });

  test('sends revalidate request with different tag values', async () => {
    // Requirements: 5.3, 5.4, 5.5
    
    const testTags = [
      'topic-en',
      'topic-es',
      'category-faq',
      'all-topics'
    ];

    for (const tag of testTags) {
      const payload = { tag };
      const timestamp = Date.now().toString();
      const body = JSON.stringify(payload);
      const signature = generateTestSignature(timestamp, body);

      const request = new NextRequest('http://localhost:3000/api/revalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.INGEST_API_KEY || 'test-api-key',
          'x-timestamp': timestamp,
          'x-signature': signature,
        },
        body: body,
      });

      const response = await revalidatePOST(request);
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.message).toBe('Revalidated successfully');
      expect(responseBody.tag).toBe(tag);
    }
  });

  test('rejects revalidate request with missing tag field', async () => {
    // Requirements: 5.4, 7.9
    
    const payload = {
      // Missing tag field
      someOtherField: 'value'
    };

    const timestamp = Date.now().toString();
    const body = JSON.stringify(payload);
    const signature = generateTestSignature(timestamp, body);

    const request = new NextRequest('http://localhost:3000/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INGEST_API_KEY || 'test-api-key',
        'x-timestamp': timestamp,
        'x-signature': signature,
      },
      body: body,
    });

    const response = await revalidatePOST(request);
    const responseBody = await response.json();

    // Assert 400 response for missing tag field (Requirement 5.4)
    expect(response.status).toBe(400);
    expect(responseBody.error).toBe('Validation failed');
    expect(responseBody.details).toBeDefined();
  });

  test('rejects revalidate request with empty tag string', async () => {
    // Requirements: 5.4
    
    const payload = {
      tag: '' // Empty string should fail validation
    };

    const timestamp = Date.now().toString();
    const body = JSON.stringify(payload);
    const signature = generateTestSignature(timestamp, body);

    const request = new NextRequest('http://localhost:3000/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INGEST_API_KEY || 'test-api-key',
        'x-timestamp': timestamp,
        'x-signature': signature,
      },
      body: body,
    });

    const response = await revalidatePOST(request);
    const responseBody = await response.json();

    // Assert 400 response for empty tag
    expect(response.status).toBe(400);
    expect(responseBody.error).toBe('Validation failed');
  });

  test('rejects revalidate request with invalid authentication', async () => {
    // Requirements: 5.2, 7.9
    
    const payload = {
      tag: 'valid-tag'
    };

    const timestamp = Date.now().toString();
    const body = JSON.stringify(payload);
    // Use wrong signature
    const signature = 'invalid-signature';

    const request = new NextRequest('http://localhost:3000/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INGEST_API_KEY || 'test-api-key',
        'x-timestamp': timestamp,
        'x-signature': signature,
      },
      body: body,
    });

    const response = await revalidatePOST(request);
    const responseBody = await response.json();

    // Assert 401 response for invalid signature (Requirement 5.2)
    expect(response.status).toBe(401);
    expect(responseBody.error).toBe('Unauthorized');
  });
});
