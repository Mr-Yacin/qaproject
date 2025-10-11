import { prisma } from '../db';
import { Topic, Question, Article, FAQItem, IngestJob, ContentStatus } from '@prisma/client';
import { TopicFilters, UnifiedTopic, PaginatedTopics } from '@/types/api';

export class ContentRepository {
    /**
     * Upsert a topic by slug
     * Requirements: 3.1, 3.2
     */
    async upsertTopic(data: {
        slug: string;
        title: string;
        locale: string;
        tags: string[];
        thumbnailUrl?: string;
        seoTitle?: string;
        seoDescription?: string;
        seoKeywords?: string[];
    }): Promise<Topic> {
        return prisma.topic.upsert({
            where: { slug: data.slug },
            update: {
                title: data.title,
                locale: data.locale,
                tags: data.tags,
                thumbnailUrl: data.thumbnailUrl,
                seoTitle: data.seoTitle,
                seoDescription: data.seoDescription,
                seoKeywords: data.seoKeywords || [],
            },
            create: {
                slug: data.slug,
                title: data.title,
                locale: data.locale,
                tags: data.tags,
                thumbnailUrl: data.thumbnailUrl,
                seoTitle: data.seoTitle,
                seoDescription: data.seoDescription,
                seoKeywords: data.seoKeywords || [],
            },
        });
    }

    /**
     * Find a topic by slug with all relations
     * Requirements: 4.1, 4.2
     */
    async findTopicBySlug(slug: string): Promise<UnifiedTopic | null> {
        const topic = await prisma.topic.findUnique({
            where: { slug },
            include: {
                questions: {
                    where: { isPrimary: true },
                },
                articles: {
                    where: { status: ContentStatus.PUBLISHED },
                },
                faqItems: {
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
     * Find topics with filtering and pagination
     * Requirements: 4.6, 4.7, 4.8, 4.9
     */
    async findTopics(filters: TopicFilters): Promise<PaginatedTopics> {
        const { locale, tag, page, limit } = filters;

        // Build where clause
        const where: any = {
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

        // Get total count
        const total = await prisma.topic.count({ where });

        // Get paginated topics
        const topics = await prisma.topic.findMany({
            where,
            include: {
                questions: {
                    where: { isPrimary: true },
                },
                articles: {
                    where: { status: ContentStatus.PUBLISHED },
                },
                faqItems: {
                    orderBy: { order: 'asc' },
                },
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
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
            primaryQuestion: topic.questions[0] || null,
            article: topic.articles[0] || null,
            faqItems: topic.faqItems,
        }));

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Upsert primary question for a topic
     * Requirements: 3.3
     */
    async upsertPrimaryQuestion(topicId: string, text: string): Promise<Question> {
        // First, find if there's already a primary question for this topic
        const existingPrimary = await prisma.question.findFirst({
            where: {
                topicId,
                isPrimary: true,
            },
        });

        if (existingPrimary) {
            // Update existing primary question
            return prisma.question.update({
                where: { id: existingPrimary.id },
                data: { text },
            });
        } else {
            // Create new primary question
            return prisma.question.create({
                data: {
                    topicId,
                    text,
                    isPrimary: true,
                },
            });
        }
    }

    /**
     * Upsert article for a topic
     * Requirements: 3.4
     */
    async upsertArticle(
        topicId: string,
        data: { 
            content: string; 
            status: ContentStatus;
            seoTitle?: string;
            seoDescription?: string;
            seoKeywords?: string[];
        }
    ): Promise<Article> {
        return prisma.article.upsert({
            where: { topicId },
            update: {
                content: data.content,
                status: data.status,
                seoTitle: data.seoTitle,
                seoDescription: data.seoDescription,
                seoKeywords: data.seoKeywords || [],
            },
            create: {
                topicId,
                content: data.content,
                status: data.status,
                seoTitle: data.seoTitle,
                seoDescription: data.seoDescription,
                seoKeywords: data.seoKeywords || [],
            },
        });
    }

    /**
     * Replace all FAQ items for a topic
     * Requirements: 3.5
     */
    async replaceFAQItems(
        topicId: string,
        items: { question: string; answer: string; order: number }[]
    ): Promise<FAQItem[]> {
        return prisma.$transaction(async (tx) => {
            // Delete existing FAQ items for this topic
            await tx.fAQItem.deleteMany({
                where: { topicId },
            });

            // Bulk create new FAQ items
            if (items.length === 0) {
                return [];
            }

            const createData = items.map((item) => ({
                topicId,
                question: item.question,
                answer: item.answer,
                order: item.order,
            }));

            // Create all items and return them
            await tx.fAQItem.createMany({
                data: createData,
            });

            // Fetch and return the created items
            return tx.fAQItem.findMany({
                where: { topicId },
                orderBy: { order: 'asc' },
            });
        });
    }

    /**
     * Create an IngestJob with status "processing"
     * Requirements: 3.6
     */
    async createIngestJob(topicSlug: string, payload: unknown): Promise<IngestJob> {
        return prisma.ingestJob.create({
            data: {
                topicSlug,
                status: 'processing',
                payload: payload as any,
            },
        });
    }

    /**
     * Update an IngestJob to completed or failed status
     * Requirements: 3.7, 3.8
     */
    async updateIngestJob(
        id: string,
        updates: {
            status: 'completed' | 'failed';
            error?: string;
            completedAt?: Date;
        }
    ): Promise<IngestJob> {
        return prisma.ingestJob.update({
            where: { id },
            data: {
                status: updates.status,
                error: updates.error,
                completedAt: updates.completedAt || new Date(),
            },
        });
    }

    /**
     * Bulk delete topics by IDs
     * Requirements: 10.2
     */
    async bulkDeleteTopics(topicIds: string[]): Promise<number> {
        const result = await prisma.topic.deleteMany({
            where: {
                id: {
                    in: topicIds,
                },
            },
        });
        return result.count;
    }

    /**
     * Bulk update topic article status
     * Requirements: 10.3
     */
    async bulkUpdateTopicStatus(topicIds: string[], status: ContentStatus): Promise<number> {
        const result = await prisma.article.updateMany({
            where: {
                topicId: {
                    in: topicIds,
                },
            },
            data: {
                status,
            },
        });
        return result.count;
    }

    /**
     * Bulk add tags to topics
     * Requirements: 10.4
     */
    async bulkAddTags(topicIds: string[], tagsToAdd: string[]): Promise<void> {
        await prisma.$transaction(
            topicIds.map((topicId) =>
                prisma.topic.update({
                    where: { id: topicId },
                    data: {
                        tags: {
                            push: tagsToAdd,
                        },
                    },
                })
            )
        );
    }

    /**
     * Bulk remove tags from topics
     * Requirements: 10.4
     */
    async bulkRemoveTags(topicIds: string[], tagsToRemove: string[]): Promise<void> {
        const topics = await prisma.topic.findMany({
            where: {
                id: {
                    in: topicIds,
                },
            },
            select: {
                id: true,
                tags: true,
            },
        });

        await prisma.$transaction(
            topics.map((topic) => {
                const updatedTags = topic.tags.filter((tag) => !tagsToRemove.includes(tag));
                return prisma.topic.update({
                    where: { id: topic.id },
                    data: {
                        tags: updatedTags,
                    },
                });
            })
        );
    }

    /**
     * Export topics by IDs or filters
     * Requirements: 10.7
     */
    async exportTopics(filters: {
        topicIds?: string[];
        locale?: string;
        tag?: string;
        status?: ContentStatus;
    }): Promise<UnifiedTopic[]> {
        const where: any = {};

        if (filters.topicIds && filters.topicIds.length > 0) {
            where.id = {
                in: filters.topicIds,
            };
        }

        if (filters.locale) {
            where.locale = filters.locale;
        }

        if (filters.tag) {
            where.tags = {
                has: filters.tag,
            };
        }

        if (filters.status) {
            where.articles = {
                some: {
                    status: filters.status,
                },
            };
        }

        const topics = await prisma.topic.findMany({
            where,
            include: {
                questions: {
                    where: { isPrimary: true },
                },
                articles: true,
                faqItems: {
                    orderBy: { order: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
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
     * Delete a topic by slug with cascade delete
     * Requirements: 1.5, 1.6
     */
    async deleteTopicBySlug(slug: string): Promise<void> {
        // Prisma will cascade delete related records based on schema
        await prisma.topic.delete({
            where: { slug },
        });
    }

    /**
     * Get topic impact summary before deletion
     * Requirements: 1.5
     */
    async getTopicImpactSummary(slug: string): Promise<{
        questions: number;
        articles: number;
        faqItems: number;
    } | null> {
        const topic = await prisma.topic.findUnique({
            where: { slug },
            include: {
                _count: {
                    select: {
                        questions: true,
                        articles: true,
                        faqItems: true,
                    },
                },
            },
        });

        if (!topic) {
            return null;
        }

        return {
            questions: topic._count.questions,
            articles: topic._count.articles,
            faqItems: topic._count.faqItems,
        };
    }

    /**
     * Find a topic by slug including drafts (for admin use)
     * Requirements: 4.4, 4.5
     */
    async findTopicBySlugIncludingDrafts(slug: string): Promise<UnifiedTopic | null> {
        const topic = await prisma.topic.findUnique({
            where: { slug },
            include: {
                questions: {
                    where: { isPrimary: true },
                },
                articles: true, // Include all articles regardless of status
                faqItems: {
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
            article: topic.articles[0] || null, // Return first article (draft or published)
            faqItems: topic.faqItems,
        };
    }

    /**
     * Find all topics including drafts (for admin use)
     * Requirements: 4.1, 4.2
     */
    async findAllTopics(filters: TopicFilters): Promise<PaginatedTopics> {
        const { locale, tag, page, limit } = filters;

        // Build where clause (no status filter)
        const where: any = {};

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

        // Get paginated topics (including all statuses)
        const topics = await prisma.topic.findMany({
            where,
            include: {
                questions: {
                    where: { isPrimary: true },
                },
                articles: true, // Include all articles regardless of status
                faqItems: {
                    orderBy: { order: 'asc' },
                },
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { updatedAt: 'desc' }, // Show most recently updated first
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
            primaryQuestion: topic.questions[0] || null,
            article: topic.articles[0] || null, // Return first article (draft or published)
            faqItems: topic.faqItems,
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
