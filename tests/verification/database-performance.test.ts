/**
 * Database Query Performance Tests
 * 
 * Tests to verify database query performance with new schema fields
 * and ensure existing queries execute successfully.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { getTestContext } from './setup';

// Create a separate Prisma client for testing
const testPrisma = new PrismaClient({
  log: ['error'],
});

interface QueryPerformanceResult {
  queryName: string;
  executionTime: number;
  recordCount: number;
  success: boolean;
  error?: string;
}

interface PerformanceThresholds {
  topicListing: number;        // Max time for topic listing queries (ms)
  individualTopic: number;     // Max time for single topic retrieval (ms)
  complexQuery: number;        // Max time for complex queries with filtering (ms)
  indexedQuery: number;        // Max time for indexed field queries (ms)
}

const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  topicListing: 1000,     // 1s for topic listing
  individualTopic: 500,   // 500ms for single topic
  complexQuery: 2000,     // 2s for complex queries
  indexedQuery: 500,      // 500ms for indexed queries
};

describe('Database Query Performance Tests', () => {
  let testResults: QueryPerformanceResult[] = [];

  beforeAll(async () => {
    console.log('🔗 Connecting to test database...');
    await testPrisma.$connect();
    console.log('✅ Database connection established');
  });

  afterAll(async () => {
    console.log('📊 Performance Test Results Summary:');
    testResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.queryName}: ${result.executionTime}ms (${result.recordCount} records)`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    await testPrisma.$disconnect();
    console.log('🔌 Database connection closed');
  });

  /**
   * Helper function to measure query execution time
   */
  async function measureQueryPerformance<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    threshold: number
  ): Promise<{ result: T; performance: QueryPerformanceResult }> {
    const startTime = Date.now();
    let result: T;
    let success = true;
    let error: string | undefined;
    let recordCount = 0;

    try {
      result = await queryFn();
      
      // Count records if result is an array
      if (Array.isArray(result)) {
        recordCount = result.length;
      } else if (result && typeof result === 'object' && 'length' in result) {
        recordCount = (result as any).length;
      } else if (result) {
        recordCount = 1;
      }
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
      result = null as T;
    }

    const executionTime = Date.now() - startTime;
    
    const performanceResult: QueryPerformanceResult = {
      queryName,
      executionTime,
      recordCount,
      success,
      error
    };

    testResults.push(performanceResult);

    return { result, performance: performanceResult };
  }

  describe('Topic Listing Performance', () => {
    it('should execute basic topic listing query within performance threshold', async () => {
      const { performance } = await measureQueryPerformance(
        'Basic Topic Listing',
        () => testPrisma.topic.findMany({
          take: 20,
          orderBy: { updatedAt: 'desc' }
        }),
        PERFORMANCE_THRESHOLDS.topicListing
      );

      expect(performance.success).toBe(true);
      expect(performance.executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.topicListing);
    });

    it('should execute topic listing with new SEO fields within threshold', async () => {
      const { performance } = await measureQueryPerformance(
        'Topic Listing with SEO Fields',
        () => testPrisma.topic.findMany({
          select: {
            id: true,
            slug: true,
            title: true,
            locale: true,
            tags: true,
            thumbnailUrl: true,
            seoTitle: true,
            seoDescription: true,
            seoKeywords: true,
            createdAt: true,
            updatedAt: true
          },
          take: 20,
          orderBy: { updatedAt: 'desc' }
        }),
        PERFORMANCE_THRESHOLDS.topicListing
      );

      expect(performance.success).toBe(true);
      expect(performance.executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.topicListing);
    });

    it('should execute paginated topic listing efficiently', async () => {
      const { performance } = await measureQueryPerformance(
        'Paginated Topic Listing',
        () => testPrisma.topic.findMany({
          skip: 20,
          take: 20,
          orderBy: { updatedAt: 'desc' },
          include: {
            _count: {
              select: {
                questions: true,
                articles: true,
                faqItems: true
              }
            }
          }
        }),
        PERFORMANCE_THRESHOLDS.topicListing
      );

      expect(performance.success).toBe(true);
      expect(performance.executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.topicListing);
    });

    it('should execute topic listing with locale filtering efficiently', async () => {
      const { performance } = await measureQueryPerformance(
        'Topic Listing with Locale Filter',
        () => testPrisma.topic.findMany({
          where: {
            locale: 'en'
          },
          take: 20,
          orderBy: { updatedAt: 'desc' }
        }),
        PERFORMANCE_THRESHOLDS.indexedQuery
      );

      expect(performance.success).toBe(true);
      expect(performance.executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.indexedQuery);
    });

    it('should execute topic listing with tag filtering efficiently', async () => {
      const { performance } = await measureQueryPerformance(
        'Topic Listing with Tag Filter',
        () => testPrisma.topic.findMany({
          where: {
            tags: {
              hasSome: ['technology', 'programming']
            }
          },
          take: 20,
          orderBy: { updatedAt: 'desc' }
        }),
        PERFORMANCE_THRESHOLDS.indexedQuery
      );

      expect(performance.success).toBe(true);
      expect(performance.executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.indexedQuery);
    });

    it('should execute topic listing with SEO keyword filtering efficiently', async () => {
      const { performance } = await measureQueryPerformance(
        'Topic Listing with SEO Keyword Filter',
        () => testPrisma.topic.findMany({
          where: {
            seoKeywords: {
              hasSome: ['api', 'documentation']
            }
          },
          take: 20,
          orderBy: { updatedAt: 'desc' }
        }),
        PERFORMANCE_THRESHOLDS.indexedQuery
      );

      expect(performance.success).toBe(true);
      expect(performance.executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.indexedQuery);
    });
  });

  describe('Individual Topic Retrieval Performance', () => {
    it('should retrieve topic by slug efficiently', async () => {
      // First get a topic slug to test with
      const topics = await testPrisma.topic.findMany({ take: 1 });
      if (topics.length === 0) {
        console.warn('⚠️ No topics found in database for testing');
        return;
      }

      const testSlug = topics[0].slug;

      const { performance } = await measureQueryPerformance(
        'Topic Retrieval by Slug',
        () => testPrisma.topic.findUnique({
          where: { slug: testSlug }
        }),
        PERFORMANCE_THRESHOLDS.individualTopic
      );

      expect(performance.success).toBe(true);
      expect(performance.executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.individualTopic);
    });

    it('should retrieve topic with all relations efficiently', async () => {
      const topics = await testPrisma.topic.findMany({ take: 1 });
      if (topics.length === 0) {
        console.warn('⚠️ No topics found in database for testing');
        return;
      }

      const testSlug = topics[0].slug;

      const { performance } = await measureQueryPerformance(
        'Topic with All Relations',
        () => testPrisma.topic.findUnique({
          where: { slug: testSlug },
          include: {
            questions: {
              orderBy: { isPrimary: 'desc' }
            },
            articles: true,
            faqItems: {
              orderBy: { order: 'asc' }
            }
          }
        }),
        PERFORMANCE_THRESHOLDS.individualTopic
      );

      expect(performance.success).toBe(true);
      expect(performance.executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.individualTopic);
    });

    it('should retrieve topic with new SEO fields efficiently', async () => {
      const topics = await testPrisma.topic.findMany({ take: 1 });
      if (topics.length === 0) {
        console.warn('⚠️ No topics found in database for testing');
        return;
      }

      const testSlug = topics[0].slug;

      const { performance } = await measureQueryPerformance(
        'Topic with SEO Fields',
        () => testPrisma.topic.findUnique({
          where: { slug: testSlug },
          select: {
            id: true,
            slug: true,
            title: true,
            locale: true,
            tags: true,
            thumbnailUrl: true,
            seoTitle: true,
            seoDescription: true,
            seoKeywords: true,
            articles: {
              select: {
                content: true,
                status: true,
                seoTitle: true,
                seoDescription: true,
                seoKeywords: true
              }
            }
          }
        }),
        PERFORMANCE_THRESHOLDS.individualTopic
      );

      expect(performance.success).toBe(true);
      expect(performance.executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.individualTopic);
    });
  });

  describe('Complex Query Performance', () => {
    it('should execute complex filtering with pagination efficiently', async () => {
      const { performance } = await measureQueryPerformance(
        'Complex Filtering with Pagination',
        () => testPrisma.topic.findMany({
          where: {
            AND: [
              { locale: 'en' },
              {
                OR: [
                  { tags: { hasSome: ['technology'] } },
                  { seoKeywords: { hasSome: ['api'] } }
                ]
              },
              { updatedAt: { gte: new Date('2024-01-01') } }
            ]
          },
          include: {
            articles: {
              where: { status: 'PUBLISHED' }
            },
            _count: {
              select: {
                questions: true,
                faqItems: true
              }
            }
          },
          orderBy: [
            { updatedAt: 'desc' },
            { createdAt: 'desc' }
          ],
          take: 10
        }),
        PERFORMANCE_THRESHOLDS.complexQuery
      );

      expect(performance.success).toBe(true);
      expect(performance.executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.complexQuery);
    });

    it('should execute search across multiple fields efficiently', async () => {
      const searchTerm = 'test';
      
      const { performance } = await measureQueryPerformance(
        'Multi-field Search Query',
        () => testPrisma.topic.findMany({
          where: {
            OR: [
              { title: { contains: searchTerm, mode: 'insensitive' } },
              { seoTitle: { contains: searchTerm, mode: 'insensitive' } },
              { seoDescription: { contains: searchTerm, mode: 'insensitive' } },
              { tags: { hasSome: [searchTerm] } },
              { seoKeywords: { hasSome: [searchTerm] } }
            ]
          },
          include: {
            articles: {
              where: {
                OR: [
                  { content: { contains: searchTerm, mode: 'insensitive' } },
                  { seoTitle: { contains: searchTerm, mode: 'insensitive' } }
                ]
              }
            }
          },
          take: 20
        }),
        PERFORMANCE_THRESHOLDS.complexQuery
      );

      expect(performance.success).toBe(true);
      expect(performance.executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.complexQuery);
    });

    it('should execute aggregation queries efficiently', async () => {
      const { performance } = await measureQueryPerformance(
        'Topic Count by Locale',
        () => testPrisma.topic.groupBy({
          by: ['locale'],
          _count: {
            id: true
          },
          orderBy: {
            _count: {
              id: 'desc'
            }
          }
        }),
        PERFORMANCE_THRESHOLDS.complexQuery
      );

      expect(performance.success).toBe(true);
      expect(performance.executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.complexQuery);
    });
  });

  describe('Index Performance Validation', () => {
    it('should utilize slug index efficiently', async () => {
      const { performance } = await measureQueryPerformance(
        'Slug Index Performance',
        () => testPrisma.topic.findMany({
          where: {
            slug: { startsWith: 'test' }
          },
          take: 10
        }),
        PERFORMANCE_THRESHOLDS.indexedQuery
      );

      expect(performance.success).toBe(true);
      expect(performance.executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.indexedQuery);
    });

    it('should utilize locale index efficiently', async () => {
      const { performance } = await measureQueryPerformance(
        'Locale Index Performance',
        () => testPrisma.topic.findMany({
          where: { locale: 'en' },
          take: 50
        }),
        PERFORMANCE_THRESHOLDS.indexedQuery
      );

      expect(performance.success).toBe(true);
      expect(performance.executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.indexedQuery);
    });

    it('should utilize composite locale+updatedAt index efficiently', async () => {
      const { performance } = await measureQueryPerformance(
        'Composite Index Performance',
        () => testPrisma.topic.findMany({
          where: {
            locale: 'en',
            updatedAt: { gte: new Date('2024-01-01') }
          },
          orderBy: { updatedAt: 'desc' },
          take: 20
        }),
        PERFORMANCE_THRESHOLDS.indexedQuery
      );

      expect(performance.success).toBe(true);
      expect(performance.executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.indexedQuery);
    });

    it('should utilize new SEO keywords index efficiently', async () => {
      const { performance } = await measureQueryPerformance(
        'SEO Keywords Index Performance',
        () => testPrisma.topic.findMany({
          where: {
            seoKeywords: { hasSome: ['api', 'documentation', 'guide'] }
          },
          take: 20
        }),
        PERFORMANCE_THRESHOLDS.indexedQuery
      );

      expect(performance.success).toBe(true);
      expect(performance.executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.indexedQuery);
    });
  });

  describe('Related Model Performance', () => {
    it('should query articles with SEO fields efficiently', async () => {
      const { performance } = await measureQueryPerformance(
        'Articles with SEO Fields',
        () => testPrisma.article.findMany({
          where: { status: 'PUBLISHED' },
          select: {
            id: true,
            content: true,
            status: true,
            seoTitle: true,
            seoDescription: true,
            seoKeywords: true,
            topic: {
              select: {
                slug: true,
                title: true,
                thumbnailUrl: true
              }
            }
          },
          take: 20
        }),
        PERFORMANCE_THRESHOLDS.topicListing
      );

      expect(performance.success).toBe(true);
      expect(performance.executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.topicListing);
    });

    it('should query FAQ items with topic relations efficiently', async () => {
      const { performance } = await measureQueryPerformance(
        'FAQ Items with Topic Relations',
        () => testPrisma.fAQItem.findMany({
          include: {
            topic: {
              select: {
                slug: true,
                title: true,
                locale: true
              }
            }
          },
          orderBy: [
            { topicId: 'asc' },
            { order: 'asc' }
          ],
          take: 50
        }),
        PERFORMANCE_THRESHOLDS.topicListing
      );

      expect(performance.success).toBe(true);
      expect(performance.executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.topicListing);
    });
  });
});