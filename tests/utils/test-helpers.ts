import crypto from 'crypto';
import { prisma } from '../../src/lib/db';
import { ContentStatus } from '@prisma/client';

/**
 * Generates a valid HMAC-SHA256 signature for test requests
 * @param timestamp - The timestamp string
 * @param body - The request body as a string
 * @returns The computed HMAC signature as a hex string
 */
export function generateTestSignature(timestamp: string, body: string): string {
  const secret = process.env.INGEST_WEBHOOK_SECRET || 'test-webhook-secret';
  const message = `${timestamp}.${body}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(message);
  return hmac.digest('hex');
}

/**
 * Creates an authenticated request with proper HMAC headers
 * @param url - The API endpoint URL
 * @param payload - The request payload object
 * @param method - HTTP method (default: 'POST')
 * @returns Response object with parsed JSON body
 */
export async function authenticatedRequest(
  url: string,
  payload: unknown,
  method: 'POST' | 'GET' = 'POST'
): Promise<{ status: number; body: any; headers: Headers }> {
  const timestamp = Date.now().toString();
  const body = JSON.stringify(payload);
  const signature = generateTestSignature(timestamp, body);
  const apiKey = process.env.INGEST_API_KEY || 'test-api-key';

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'x-timestamp': timestamp,
      'x-signature': signature,
    },
    body: method === 'POST' ? body : undefined,
  });

  let responseBody;
  try {
    responseBody = await response.json();
  } catch {
    responseBody = null;
  }

  return {
    status: response.status,
    body: responseBody,
    headers: response.headers,
  };
}

/**
 * Seeds a single topic with related entities in the test database
 * @param data - Partial topic data with optional related entities
 * @returns The created topic with relations
 */
export async function seedTopic(data: {
  slug: string;
  title?: string;
  locale?: string;
  tags?: string[];
  articleStatus?: ContentStatus;
  articleContent?: string;
  primaryQuestion?: string;
  faqItems?: Array<{ question: string; answer: string; order: number }>;
}) {
  // Use a transaction to ensure all operations complete atomically
  return await prisma.$transaction(async (tx) => {
    const topic = await tx.topic.create({
      data: {
        slug: data.slug,
        title: data.title || `Test Topic: ${data.slug}`,
        locale: data.locale || 'en',
        tags: data.tags || ['test'],
      },
    });

    // Create primary question if provided
    if (data.primaryQuestion) {
      await tx.question.create({
        data: {
          topicId: topic.id,
          text: data.primaryQuestion,
          isPrimary: true,
        },
      });
    }

    // Create article if status is provided
    if (data.articleStatus) {
      await tx.article.create({
        data: {
          topicId: topic.id,
          content: data.articleContent || 'Test article content',
          status: data.articleStatus,
        },
      });
    }

    // Create FAQ items if provided
    if (data.faqItems && data.faqItems.length > 0) {
      await tx.fAQItem.createMany({
        data: data.faqItems.map((item) => ({
          topicId: topic.id,
          question: item.question,
          answer: item.answer,
          order: item.order,
        })),
      });
    }

    // Return topic with all relations
    return tx.topic.findUnique({
      where: { id: topic.id },
      include: {
        questions: true,
        articles: true,
        faqItems: true,
      },
    });
  });
}

/**
 * Seeds multiple topics in the test database
 * @param count - Number of topics to create, or array of topic data
 * @returns Array of created topics
 */
export async function seedTopics(
  count: number | Array<Partial<Parameters<typeof seedTopic>[0]>>
): Promise<any[]> {
  if (typeof count === 'number') {
    // Create simple topics with sequential slugs
    const topics = [];
    for (let i = 0; i < count; i++) {
      const topic = await seedTopic({
        slug: `test-topic-${i}`,
        title: `Test Topic ${i}`,
        locale: 'en',
        tags: ['test'],
        articleStatus: ContentStatus.PUBLISHED,
        articleContent: `Content for topic ${i}`,
        primaryQuestion: `What is topic ${i}?`,
      });
      topics.push(topic);
    }
    return topics;
  } else {
    // Create topics from provided data array
    const topics = [];
    for (const data of count) {
      const topic = await seedTopic({
        slug: data.slug || `test-topic-${topics.length}`,
        title: data.title,
        locale: data.locale,
        tags: data.tags,
        articleStatus: data.articleStatus,
        articleContent: data.articleContent,
        primaryQuestion: data.primaryQuestion,
        faqItems: data.faqItems,
      });
      topics.push(topic);
    }
    return topics;
  }
}

/**
 * Cleans all data from the test database
 * Deletes records in the correct order to respect foreign key constraints
 */
export async function cleanDatabase(): Promise<void> {
  // Delete in order to respect foreign key constraints
  // Due to cascade deletes, we only need to delete topics and ingest jobs
  await prisma.ingestJob.deleteMany({});
  await prisma.topic.deleteMany({});
}
