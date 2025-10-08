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
    }): Promise<Topic> {
        return prisma.topic.upsert({
            where: { slug: data.slug },
            update: {
                title: data.title,
                locale: data.locale,
                tags: data.tags,
            },
            create: {
                slug: data.slug,
                title: data.title,
                locale: data.locale,
                tags: data.tags,
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
        data: { content: string; status: ContentStatus }
    ): Promise<Article> {
        return prisma.article.upsert({
            where: { topicId },
            update: {
                content: data.content,
                status: data.status,
            },
            create: {
                topicId,
                content: data.content,
                status: data.status,
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
}
