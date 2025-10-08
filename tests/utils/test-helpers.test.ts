import { describe, test, expect } from 'vitest';
import {
  generateTestSignature,
  seedTopic,
  seedTopics,
  cleanDatabase,
} from './test-helpers';
import { prisma } from '../../src/lib/db';
import { ContentStatus } from '@prisma/client';

describe('Test Helpers', () => {
  describe('generateTestSignature', () => {
    test('generates consistent signatures for same input', () => {
      const timestamp = '1234567890';
      const body = '{"test":"data"}';

      const sig1 = generateTestSignature(timestamp, body);
      const sig2 = generateTestSignature(timestamp, body);

      expect(sig1).toBe(sig2);
      expect(sig1).toMatch(/^[a-f0-9]{64}$/); // SHA256 hex is 64 chars
    });

    test('generates different signatures for different inputs', () => {
      const timestamp = '1234567890';
      const body1 = '{"test":"data1"}';
      const body2 = '{"test":"data2"}';

      const sig1 = generateTestSignature(timestamp, body1);
      const sig2 = generateTestSignature(timestamp, body2);

      expect(sig1).not.toBe(sig2);
    });
  });

  describe('seedTopic', () => {
    test('creates a topic with minimal data', async () => {
      const topic = await seedTopic({
        slug: 'test-minimal',
      });

      expect(topic).toBeDefined();
      expect(topic?.slug).toBe('test-minimal');
      expect(topic?.title).toBe('Test Topic: test-minimal');
      expect(topic?.locale).toBe('en');
      expect(topic?.tags).toEqual(['test']);
    });

    test('creates a topic with full data', async () => {
      const topic = await seedTopic({
        slug: 'test-full',
        title: 'Full Test Topic',
        locale: 'es',
        tags: ['tag1', 'tag2'],
        articleStatus: ContentStatus.PUBLISHED,
        articleContent: 'Full article content',
        primaryQuestion: 'What is this?',
        faqItems: [
          { question: 'Q1', answer: 'A1', order: 0 },
          { question: 'Q2', answer: 'A2', order: 1 },
        ],
      });

      expect(topic).toBeDefined();
      expect(topic?.slug).toBe('test-full');
      expect(topic?.title).toBe('Full Test Topic');
      expect(topic?.locale).toBe('es');
      expect(topic?.tags).toEqual(['tag1', 'tag2']);
      expect(topic?.questions).toHaveLength(1);
      expect(topic?.questions[0].isPrimary).toBe(true);
      expect(topic?.articles).toHaveLength(1);
      expect(topic?.articles[0].status).toBe(ContentStatus.PUBLISHED);
      expect(topic?.faqItems).toHaveLength(2);
    });
  });

  describe('seedTopics', () => {
    test('creates multiple topics with count', async () => {
      const topics = await seedTopics(3);

      expect(topics).toHaveLength(3);
      expect(topics[0].slug).toBe('test-topic-0');
      expect(topics[1].slug).toBe('test-topic-1');
      expect(topics[2].slug).toBe('test-topic-2');
    });

    test('creates topics from data array', async () => {
      const topics = await seedTopics([
        { slug: 'custom-1', locale: 'en' },
        { slug: 'custom-2', locale: 'es' },
      ]);

      expect(topics).toHaveLength(2);
      expect(topics[0].slug).toBe('custom-1');
      expect(topics[0].locale).toBe('en');
      expect(topics[1].slug).toBe('custom-2');
      expect(topics[1].locale).toBe('es');
    });
  });

  describe('cleanDatabase', () => {
    test('removes all topics and related data', async () => {
      // Seed some data
      await seedTopics(2);

      // Verify data exists
      const topicsBefore = await prisma.topic.findMany();
      expect(topicsBefore.length).toBeGreaterThan(0);

      // Clean database
      await cleanDatabase();

      // Verify data is removed
      const topicsAfter = await prisma.topic.findMany();
      const questionsAfter = await prisma.question.findMany();
      const articlesAfter = await prisma.article.findMany();
      const faqItemsAfter = await prisma.fAQItem.findMany();
      const ingestJobsAfter = await prisma.ingestJob.findMany();

      expect(topicsAfter).toHaveLength(0);
      expect(questionsAfter).toHaveLength(0);
      expect(articlesAfter).toHaveLength(0);
      expect(faqItemsAfter).toHaveLength(0);
      expect(ingestJobsAfter).toHaveLength(0);
    });
  });
});
