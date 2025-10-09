import { describe, test, expect, beforeEach } from 'vitest';
import { GET as getTopicBySlug } from '../../../src/app/api/topics/[slug]/route';
import { GET as listTopics } from '../../../src/app/api/topics/route';
import { seedTopic, seedTopics, cleanDatabase } from '../../utils/test-helpers';
import { NextRequest } from 'next/server';
import { ContentStatus } from '@prisma/client';

/**
 * Business Logic Acceptance Tests
 * Requirements: 4.1, 4.2, 4.3, 4.4, 7.7, 4.5, 4.6, 4.7, 4.8, 4.9, 7.8
 */

describe('Business Logic - Topic Retrieval', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  test('GET /api/topics/[slug] returns topic with published article', async () => {
    // Requirement 4.1, 4.2, 4.3, 4.4, 7.7
    // Seed a topic with published article
    await seedTopic({
      slug: 'published-topic',
      title: 'Published Topic',
      locale: 'en',
      tags: ['test', 'published'],
      articleStatus: ContentStatus.PUBLISHED,
      articleContent: 'This is published content',
      primaryQuestion: 'What is this published topic?',
      faqItems: [
        { question: 'FAQ 1', answer: 'Answer 1', order: 0 },
        { question: 'FAQ 2', answer: 'Answer 2', order: 1 },
      ],
    });

    const request = new NextRequest(
      'http://localhost:3000/api/topics/published-topic'
    );

    const response = await getTopicBySlug(request, {
      params: { slug: 'published-topic' },
    });
    const responseBody = await response.json();

    // Assert correct unified structure
    expect(response.status).toBe(200);
    expect(responseBody.topic).toBeDefined();
    expect(responseBody.topic.slug).toBe('published-topic');
    expect(responseBody.topic.title).toBe('Published Topic');
    expect(responseBody.topic.locale).toBe('en');
    expect(responseBody.topic.tags).toEqual(['test', 'published']);

    expect(responseBody.primaryQuestion).toBeDefined();
    expect(responseBody.primaryQuestion.text).toBe('What is this published topic?');
    expect(responseBody.primaryQuestion.isPrimary).toBe(true);

    expect(responseBody.article).toBeDefined();
    expect(responseBody.article.content).toBe('This is published content');
    expect(responseBody.article.status).toBe('PUBLISHED');

    expect(responseBody.faqItems).toBeDefined();
    expect(responseBody.faqItems).toHaveLength(2);
    expect(responseBody.faqItems[0].question).toBe('FAQ 1');
    expect(responseBody.faqItems[0].answer).toBe('Answer 1');
    expect(responseBody.faqItems[0].order).toBe(0);
    expect(responseBody.faqItems[1].question).toBe('FAQ 2');
    expect(responseBody.faqItems[1].answer).toBe('Answer 2');
    expect(responseBody.faqItems[1].order).toBe(1);
  });

  test('GET /api/topics/[slug] with draft article does not include article', async () => {
    // Requirement 4.3, 7.7
    // Seed a topic with draft article
    await seedTopic({
      slug: 'draft-topic',
      title: 'Draft Topic',
      locale: 'en',
      tags: ['test', 'draft'],
      articleStatus: ContentStatus.DRAFT,
      articleContent: 'This is draft content',
      primaryQuestion: 'What is this draft topic?',
    });

    const request = new NextRequest(
      'http://localhost:3000/api/topics/draft-topic'
    );

    const response = await getTopicBySlug(request, {
      params: { slug: 'draft-topic' },
    });
    const responseBody = await response.json();

    // Should return topic but with null article because only PUBLISHED articles are included
    expect(response.status).toBe(200);
    expect(responseBody.topic).toBeDefined();
    expect(responseBody.topic.slug).toBe('draft-topic');
    expect(responseBody.article).toBeNull();
    expect(responseBody.primaryQuestion).toBeDefined();
  });

  test('GET /api/topics/[slug] with non-existent slug returns 404', async () => {
    // Requirement 4.2, 7.7
    const request = new NextRequest(
      'http://localhost:3000/api/topics/non-existent-slug'
    );

    const response = await getTopicBySlug(request, {
      params: { slug: 'non-existent-slug' },
    });
    const responseBody = await response.json();

    expect(response.status).toBe(404);
    expect(responseBody.error).toBe('Topic not found');
  });

  test('GET /api/topics/[slug] returns FAQ items ordered by order field', async () => {
    // Requirement 4.4, 7.7
    await seedTopic({
      slug: 'ordered-faq-topic',
      title: 'Ordered FAQ Topic',
      locale: 'en',
      tags: ['test'],
      articleStatus: ContentStatus.PUBLISHED,
      articleContent: 'Content with ordered FAQs',
      primaryQuestion: 'What is this?',
      faqItems: [
        { question: 'Third FAQ', answer: 'Third Answer', order: 2 },
        { question: 'First FAQ', answer: 'First Answer', order: 0 },
        { question: 'Second FAQ', answer: 'Second Answer', order: 1 },
      ],
    });

    const request = new NextRequest(
      'http://localhost:3000/api/topics/ordered-faq-topic'
    );

    const response = await getTopicBySlug(request, {
      params: { slug: 'ordered-faq-topic' },
    });
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody.faqItems).toHaveLength(3);
    // Verify items are ordered by order field
    expect(responseBody.faqItems[0].question).toBe('First FAQ');
    expect(responseBody.faqItems[0].order).toBe(0);
    expect(responseBody.faqItems[1].question).toBe('Second FAQ');
    expect(responseBody.faqItems[1].order).toBe(1);
    expect(responseBody.faqItems[2].question).toBe('Third FAQ');
    expect(responseBody.faqItems[2].order).toBe(2);
  });
});

describe('Business Logic - Topic Listing', () => {
  beforeEach(async () => {
    await cleanDatabase();
  }, 15000); // Increase timeout for cleanup

  test('GET /api/topics filters by locale', async () => {
    // Requirement 4.6, 7.8
    // Seed topics with different locales
    await seedTopics([
      {
        slug: 'en-topic-1',
        title: 'English Topic 1',
        locale: 'en',
        tags: ['test'],
        articleStatus: ContentStatus.PUBLISHED,
        primaryQuestion: 'English question 1?',
      },
      {
        slug: 'en-topic-2',
        title: 'English Topic 2',
        locale: 'en',
        tags: ['test'],
        articleStatus: ContentStatus.PUBLISHED,
        primaryQuestion: 'English question 2?',
      },
      {
        slug: 'es-topic-1',
        title: 'Spanish Topic 1',
        locale: 'es',
        tags: ['test'],
        articleStatus: ContentStatus.PUBLISHED,
        primaryQuestion: 'Spanish question 1?',
      },
    ]);

    const request = new NextRequest(
      'http://localhost:3000/api/topics?locale=en'
    );

    const response = await listTopics(request);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody.items).toHaveLength(2);
    expect(responseBody.items.every((item: any) => item.topic.locale === 'en')).toBe(true);
    expect(responseBody.items[0].topic.slug).toMatch(/en-topic/);
    expect(responseBody.items[1].topic.slug).toMatch(/en-topic/);
  });

  test('GET /api/topics filters by tag', async () => {
    // Requirement 4.7, 7.8
    // Seed topics with different tags
    await seedTopics([
      {
        slug: 'tech-topic-1',
        title: 'Tech Topic 1',
        locale: 'en',
        tags: ['tech', 'programming'],
        articleStatus: ContentStatus.PUBLISHED,
        primaryQuestion: 'Tech question 1?',
      },
      {
        slug: 'tech-topic-2',
        title: 'Tech Topic 2',
        locale: 'en',
        tags: ['tech', 'database'],
        articleStatus: ContentStatus.PUBLISHED,
        primaryQuestion: 'Tech question 2?',
      },
      {
        slug: 'business-topic-1',
        title: 'Business Topic 1',
        locale: 'en',
        tags: ['business', 'finance'],
        articleStatus: ContentStatus.PUBLISHED,
        primaryQuestion: 'Business question 1?',
      },
    ]);

    const request = new NextRequest(
      'http://localhost:3000/api/topics?tag=tech'
    );

    const response = await listTopics(request);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody.items).toHaveLength(2);
    expect(responseBody.items.every((item: any) => item.topic.tags.includes('tech'))).toBe(true);
  });

  test('GET /api/topics paginates with page and limit', async () => {
    // Requirement 4.8, 7.8
    // Seed 12 topics (reduced for performance)
    await seedTopics(12);

    // Request page 2 with limit 5
    const request = new NextRequest(
      'http://localhost:3000/api/topics?page=2&limit=5'
    );

    const response = await listTopics(request);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody.items).toHaveLength(5);
    expect(responseBody.page).toBe(2);
    expect(responseBody.limit).toBe(5);
    expect(responseBody.total).toBe(12);
    expect(responseBody.totalPages).toBe(3);
  }, 20000); // Increase timeout for this test

  test('GET /api/topics only includes topics with PUBLISHED articles', async () => {
    // Requirement 4.9, 7.8
    // Seed topics with different article statuses
    await seedTopics([
      {
        slug: 'published-1',
        title: 'Published 1',
        locale: 'en',
        tags: ['test'],
        articleStatus: ContentStatus.PUBLISHED,
        primaryQuestion: 'Published question 1?',
      },
      {
        slug: 'published-2',
        title: 'Published 2',
        locale: 'en',
        tags: ['test'],
        articleStatus: ContentStatus.PUBLISHED,
        primaryQuestion: 'Published question 2?',
      },
      {
        slug: 'draft-1',
        title: 'Draft 1',
        locale: 'en',
        tags: ['test'],
        articleStatus: ContentStatus.DRAFT,
        primaryQuestion: 'Draft question 1?',
      },
    ]);

    const request = new NextRequest('http://localhost:3000/api/topics');

    const response = await listTopics(request);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody.items).toHaveLength(2);
    expect(responseBody.items.every((item: any) => 
      item.topic.slug.startsWith('published')
    )).toBe(true);
  });

  test('GET /api/topics returns correct pagination metadata', async () => {
    // Requirement 4.8, 7.8
    // Seed 8 topics (reduced for performance)
    await seedTopics(8);

    // Request page 1 with limit 3
    const request = new NextRequest(
      'http://localhost:3000/api/topics?page=1&limit=3'
    );

    const response = await listTopics(request);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody.items).toHaveLength(3);
    expect(responseBody.page).toBe(1);
    expect(responseBody.limit).toBe(3);
    expect(responseBody.total).toBe(8);
    expect(responseBody.totalPages).toBe(3);
  }, 20000); // Increase timeout for this test

  test('GET /api/topics combines locale and tag filters', async () => {
    // Requirement 4.6, 4.7, 7.8
    // Seed topics with various combinations
    await seedTopics([
      {
        slug: 'en-tech-1',
        title: 'English Tech 1',
        locale: 'en',
        tags: ['tech'],
        articleStatus: ContentStatus.PUBLISHED,
        primaryQuestion: 'English tech question?',
      },
      {
        slug: 'en-business-1',
        title: 'English Business 1',
        locale: 'en',
        tags: ['business'],
        articleStatus: ContentStatus.PUBLISHED,
        primaryQuestion: 'English business question?',
      },
      {
        slug: 'es-tech-1',
        title: 'Spanish Tech 1',
        locale: 'es',
        tags: ['tech'],
        articleStatus: ContentStatus.PUBLISHED,
        primaryQuestion: 'Spanish tech question?',
      },
    ]);

    const request = new NextRequest(
      'http://localhost:3000/api/topics?locale=en&tag=tech'
    );

    const response = await listTopics(request);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody.items).toHaveLength(1);
    expect(responseBody.items[0].topic.slug).toBe('en-tech-1');
    expect(responseBody.items[0].topic.locale).toBe('en');
    expect(responseBody.items[0].topic.tags).toContain('tech');
  });

  test('GET /api/topics returns empty array when no topics match filters', async () => {
    // Requirement 4.5, 4.6, 4.7, 7.8
    await seedTopics([
      {
        slug: 'en-topic',
        title: 'English Topic',
        locale: 'en',
        tags: ['test'],
        articleStatus: ContentStatus.PUBLISHED,
        primaryQuestion: 'English question?',
      },
    ]);

    const request = new NextRequest(
      'http://localhost:3000/api/topics?locale=fr'
    );

    const response = await listTopics(request);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody.items).toHaveLength(0);
    expect(responseBody.total).toBe(0);
    expect(responseBody.page).toBe(1);
  });

  test('GET /api/topics uses default pagination values', async () => {
    // Requirement 4.8, 7.8
    await seedTopics(5);

    const request = new NextRequest('http://localhost:3000/api/topics');

    const response = await listTopics(request);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody.page).toBe(1); // default page
    expect(responseBody.limit).toBe(20); // default limit
    expect(responseBody.items).toHaveLength(5);
  });
});
