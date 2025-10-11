import { prisma } from '../db';
import { ContentStatus, Prisma } from '@prisma/client';
import { TopicFilters, UnifiedTopic, PaginatedTopics } from '@/types/api';

/**
 * Optimized ContentRepository with cursor-based pagination and selective field fetching
 * Requirements: All requirements - Performance optimization
 */
export class OptimizedContentRepository {
  /**
   * Find topics with cursor-based pagination for better performance
   * Uses cursor-based pagination instead of offset-based
   * Selects only needed fields to reduce data transfer
   */
  async findTopicsWithCursor(filters: TopicFilters & { cursor?: string }): Promise<PaginatedTopics & { nextCursor?: string }> {
    const { locale, tag, limit = 20, cursor } = filters;

    // Build where clause
    const where: Prisma.TopicWhereInput = {
      articles: {
        some: {
          status: ContentStatus.PUBLISHED,
        },
      },
    };

    if (locale) {
      where.locale = locale;
    }

    if (tag) {
      where.tags = {
        has: tag,
      };
    }

    // Get total count (cached separately)
    const total = await prisma.topic.count({ where });

    // Build cursor query
    const queryOptions: Prisma.TopicFindManyArgs = {
      where,
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
        updatedAt: true,
        questions: {
          where: { isPrimary: true },
          select: {
            id: true,
            topicId: true,
            text: true,
            isPrimary: true,
            createdAt: true,
            updatedAt: true,
          },
          take: 1,
        },
        articles: {
          where: { status: ContentStatus.PUBLISHED },
          select: {
            id: true,
            topicId: true,
            content: true,
            status: true,
            seoTitle: true,
            seoDescription: true,
            seoKeywords: true,
            createdAt: true,
            updatedAt: true,
          },
          take: 1,
        },
        faqItems: {
          select: {
            id: true,
            topicId: true,
            question: true,
            answer: true,
            order: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { order: 'asc' },
        },
      },
      take: limit + 1, // Fetch one extra to determine if there are more
      orderBy: { createdAt: 'desc' },
    };

    if (cursor) {
      queryOptions.cursor = { id: cursor };
      queryOptions.skip = 1; // Skip the cursor itself
    }

    const topics = await prisma.topic.findMany(queryOptions);

    // Check if there are more results
    const hasMore = topics.length > limit;
    const items = hasMore ? topics.slice(0, limit) : topics;
    const nextCursor = hasMore ? items[items.length - 1].id : undefined;

    const unifiedTopics: UnifiedTopic[] = items.map((topic: any) => ({
      topic: {
        id: topic.id,
        slug: topic.slug,
        title: topic.title,
        locale: topic.locale,
        tags: topic.tags,
        thumbnailUrl: topic.thumbnailUrl,
        seoTitle: topic.seoTitle,
        seoDescription: topic.seoDescription,
        seoKeywords: topic.seoKeywords,
        createdAt: topic.createdAt,
        updatedAt: topic.updatedAt,
      },
      primaryQuestion: topic.questions[0] || null,
      article: topic.articles[0] || null,
      faqItems: topic.faqItems,
    }));

    // Calculate page number for backward compatibility
    const page = cursor ? Math.ceil((total - unifiedTopics.length) / limit) : 1;

    return {
      items: unifiedTopics,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      nextCursor,
    };
  }

  /**
   * Find topic by slug with selective field fetching
   * Only fetches fields that are actually needed
   */
  async findTopicBySlugOptimized(slug: string, includeContent: boolean = true): Promise<UnifiedTopic | null> {
    const topic = await prisma.topic.findUnique({
      where: { slug },
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
        updatedAt: true,
        questions: {
          where: { isPrimary: true },
          select: {
            id: true,
            topicId: true,
            text: true,
            isPrimary: true,
            createdAt: true,
            updatedAt: true,
          },
          take: 1,
        },
        articles: {
          where: { status: ContentStatus.PUBLISHED },
          select: {
            id: true,
            topicId: true,
            content: includeContent, // Conditionally include content
            status: true,
            seoTitle: true,
            seoDescription: true,
            seoKeywords: true,
            createdAt: true,
            updatedAt: true,
          },
          take: 1,
        },
        faqItems: {
          select: {
            id: true,
            topicId: true,
            question: true,
            answer: includeContent, // Conditionally include answer
            order: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!topic) {
      return null;
    }

    return {
      topic: {
        id: topic.id,
        slug: topic.slug,
        title: topic.title,
        locale: topic.locale,
        tags: topic.tags,
        thumbnailUrl: topic.thumbnailUrl,
        seoTitle: topic.seoTitle,
        seoDescription: topic.seoDescription,
        seoKeywords: topic.seoKeywords,
        createdAt: topic.createdAt,
        updatedAt: topic.updatedAt,
      },
      primaryQuestion: topic.questions[0] || null,
      article: topic.articles[0] || null,
      faqItems: topic.faqItems,
    };
  }

  /**
   * Batch fetch topics by IDs with eager loading to avoid N+1 queries
   */
  async findTopicsByIds(topicIds: string[]): Promise<UnifiedTopic[]> {
    const topics = await prisma.topic.findMany({
      where: {
        id: {
          in: topicIds,
        },
      },
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
        updatedAt: true,
        questions: {
          where: { isPrimary: true },
          select: {
            id: true,
            topicId: true,
            text: true,
            isPrimary: true,
            createdAt: true,
            updatedAt: true,
          },
          take: 1,
        },
        articles: {
          select: {
            id: true,
            topicId: true,
            content: true,
            status: true,
            seoTitle: true,
            seoDescription: true,
            seoKeywords: true,
            createdAt: true,
            updatedAt: true,
          },
          take: 1,
        },
        faqItems: {
          select: {
            id: true,
            topicId: true,
            question: true,
            answer: true,
            order: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    return topics.map((topic) => ({
      topic: {
        id: topic.id,
        slug: topic.slug,
        title: topic.title,
        locale: topic.locale,
        tags: topic.tags,
        thumbnailUrl: topic.thumbnailUrl,
        seoTitle: topic.seoTitle,
        seoDescription: topic.seoDescription,
        seoKeywords: topic.seoKeywords,
        createdAt: topic.createdAt,
        updatedAt: topic.updatedAt,
      },
      primaryQuestion: topic.questions[0] || null,
      article: topic.articles[0] || null,
      faqItems: topic.faqItems,
    }));
  }

  /**
   * Get topic list with minimal data for admin list views
   * Only fetches essential fields for list display
   */
  async findTopicsMinimal(filters: TopicFilters): Promise<PaginatedTopics> {
    const { locale, tag, page = 1, limit = 20 } = filters;

    const where: Prisma.TopicWhereInput = {};

    if (locale) {
      where.locale = locale;
    }

    if (tag) {
      where.tags = {
        has: tag,
      };
    }

    // Get total count
    const total = await prisma.topic.count({ where });

    // Get paginated topics with minimal fields
    const topics = await prisma.topic.findMany({
      where,
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
        updatedAt: true,
        createdAt: true,
        articles: {
          select: {
            status: true,
          },
          take: 1,
        },
        _count: {
          select: {
            questions: true,
            faqItems: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });

    const items: UnifiedTopic[] = topics.map((topic) => ({
      topic: {
        id: topic.id,
        slug: topic.slug,
        title: topic.title,
        locale: topic.locale,
        tags: topic.tags,
        thumbnailUrl: topic.thumbnailUrl,
        seoTitle: topic.seoTitle,
        seoDescription: topic.seoDescription,
        seoKeywords: topic.seoKeywords,
        createdAt: topic.createdAt,
        updatedAt: topic.updatedAt,
      },
      primaryQuestion: null, // Not needed for list view
      article: topic.articles[0] ? {
        id: '',
        topicId: topic.id,
        content: '', // Not needed for list view
        status: topic.articles[0].status,
        seoTitle: null,
        seoDescription: null,
        seoKeywords: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } : null,
      faqItems: [], // Not needed for list view
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
