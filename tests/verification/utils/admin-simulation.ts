/**
 * Admin Interface Simulation Utilities
 * 
 * This module provides utilities to simulate admin interface operations
 * by directly manipulating the database, allowing us to test data integrity
 * between admin changes and API responses.
 */

import { PrismaClient, ContentStatus, UserRole, AuditAction } from '@prisma/client';
import { ValidationUtils } from '../utils';
import type { TopicTestData, ArticleTestData, FAQItemTestData } from '../types';

export interface AdminSimulationConfig {
  prisma: PrismaClient;
  userId?: string;
  auditEnabled?: boolean;
}

export interface AdminOperationResult {
  success: boolean;
  entityId?: string;
  error?: string;
  auditLogId?: string;
  timestamp: Date;
}

export interface DataStateSnapshot {
  topics: any[];
  articles: any[];
  questions: any[];
  faqItems: any[];
  timestamp: Date;
}

/**
 * Simulates admin interface operations by directly manipulating the database
 */
export class AdminInterfaceSimulator {
  private prisma: PrismaClient;
  private userId: string;
  private auditEnabled: boolean;

  constructor(config: AdminSimulationConfig) {
    this.prisma = config.prisma;
    this.userId = config.userId || 'test-admin-user';
    this.auditEnabled = config.auditEnabled ?? true;
  }

  /**
   * Create a test admin user for simulation
   */
  async createTestAdminUser(): Promise<string> {
    const testUser = await this.prisma.user.upsert({
      where: { email: 'test-admin@example.com' },
      update: {
        name: 'Test Admin',
        role: UserRole.ADMIN,
        isActive: true,
      },
      create: {
        email: 'test-admin@example.com',
        password: 'hashed-password', // In real scenario, this would be properly hashed
        name: 'Test Admin',
        role: UserRole.ADMIN,
        isActive: true,
      },
    });

    this.userId = testUser.id;
    return testUser.id;
  }

  /**
   * Create a new topic through admin simulation
   */
  async createTopic(topicData: TopicTestData): Promise<AdminOperationResult> {
    const timestamp = new Date();
    
    try {
      // Create the topic
      const topic = await this.prisma.topic.create({
        data: {
          slug: topicData.slug,
          title: topicData.title,
          locale: topicData.locale,
          tags: topicData.tags,
          thumbnailUrl: topicData.thumbnailUrl,
          seoTitle: topicData.seoTitle,
          seoDescription: topicData.seoDescription,
          seoKeywords: topicData.seoKeywords || [],
        },
      });

      // Create the main question
      await this.prisma.question.create({
        data: {
          topicId: topic.id,
          text: topicData.mainQuestion,
          isPrimary: true,
        },
      });

      // Create the article
      await this.prisma.article.create({
        data: {
          topicId: topic.id,
          content: topicData.article.content,
          status: topicData.article.status as ContentStatus,
          seoTitle: topicData.article.seoTitle,
          seoDescription: topicData.article.seoDescription,
          seoKeywords: topicData.article.seoKeywords || [],
        },
      });

      // Create FAQ items
      for (const faqItem of topicData.faqItems) {
        await this.prisma.fAQItem.create({
          data: {
            topicId: topic.id,
            question: faqItem.question,
            answer: faqItem.answer,
            order: faqItem.order,
          },
        });
      }

      // Create audit log if enabled
      let auditLogId: string | undefined;
      if (this.auditEnabled) {
        const auditLog = await this.createAuditLog(
          AuditAction.CREATE,
          'Topic',
          topic.id,
          { topicData }
        );
        auditLogId = auditLog.id;
      }

      return {
        success: true,
        entityId: topic.id,
        auditLogId,
        timestamp,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp,
      };
    }
  }

  /**
   * Update an existing topic through admin simulation
   */
  async updateTopic(topicId: string, updates: Partial<TopicTestData>): Promise<AdminOperationResult> {
    const timestamp = new Date();
    
    try {
      // Get current topic data for audit
      const currentTopic = await this.prisma.topic.findUnique({
        where: { id: topicId },
        include: {
          questions: true,
          articles: true,
          faqItems: true,
        },
      });

      if (!currentTopic) {
        return {
          success: false,
          error: 'Topic not found',
          timestamp,
        };
      }

      // Update topic basic fields
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.locale !== undefined) updateData.locale = updates.locale;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.thumbnailUrl !== undefined) updateData.thumbnailUrl = updates.thumbnailUrl;
      if (updates.seoTitle !== undefined) updateData.seoTitle = updates.seoTitle;
      if (updates.seoDescription !== undefined) updateData.seoDescription = updates.seoDescription;
      if (updates.seoKeywords !== undefined) updateData.seoKeywords = updates.seoKeywords;

      if (Object.keys(updateData).length > 0) {
        await this.prisma.topic.update({
          where: { id: topicId },
          data: updateData,
        });
      }

      // Update main question if provided
      if (updates.mainQuestion !== undefined) {
        await this.prisma.question.updateMany({
          where: { topicId, isPrimary: true },
          data: { text: updates.mainQuestion },
        });
      }

      // Update article if provided
      if (updates.article !== undefined) {
        const articleUpdateData: any = {};
        if (updates.article.content !== undefined) articleUpdateData.content = updates.article.content;
        if (updates.article.status !== undefined) articleUpdateData.status = updates.article.status;
        if (updates.article.seoTitle !== undefined) articleUpdateData.seoTitle = updates.article.seoTitle;
        if (updates.article.seoDescription !== undefined) articleUpdateData.seoDescription = updates.article.seoDescription;
        if (updates.article.seoKeywords !== undefined) articleUpdateData.seoKeywords = updates.article.seoKeywords;

        if (Object.keys(articleUpdateData).length > 0) {
          await this.prisma.article.updateMany({
            where: { topicId },
            data: articleUpdateData,
          });
        }
      }

      // Create audit log if enabled
      let auditLogId: string | undefined;
      if (this.auditEnabled) {
        const auditLog = await this.createAuditLog(
          AuditAction.UPDATE,
          'Topic',
          topicId,
          { before: currentTopic, updates }
        );
        auditLogId = auditLog.id;
      }

      return {
        success: true,
        entityId: topicId,
        auditLogId,
        timestamp,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp,
      };
    }
  }

  /**
   * Delete a topic through admin simulation
   */
  async deleteTopic(topicId: string): Promise<AdminOperationResult> {
    const timestamp = new Date();
    
    try {
      // Get current topic data for audit
      const currentTopic = await this.prisma.topic.findUnique({
        where: { id: topicId },
        include: {
          questions: true,
          articles: true,
          faqItems: true,
        },
      });

      if (!currentTopic) {
        return {
          success: false,
          error: 'Topic not found',
          timestamp,
        };
      }

      // Delete the topic (cascading deletes will handle related records)
      await this.prisma.topic.delete({
        where: { id: topicId },
      });

      // Create audit log if enabled
      let auditLogId: string | undefined;
      if (this.auditEnabled) {
        const auditLog = await this.createAuditLog(
          AuditAction.DELETE,
          'Topic',
          topicId,
          { deletedTopic: currentTopic }
        );
        auditLogId = auditLog.id;
      }

      return {
        success: true,
        entityId: topicId,
        auditLogId,
        timestamp,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp,
      };
    }
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(
    action: AuditAction,
    entityType: string,
    entityId: string,
    details: any
  ) {
    return await this.prisma.auditLog.create({
      data: {
        userId: this.userId,
        action,
        entityType,
        entityId,
        details,
        ipAddress: '127.0.0.1',
        userAgent: 'Admin Simulation Test',
      },
    });
  }

  /**
   * Capture current state of all data for comparison
   */
  async captureDataState(): Promise<DataStateSnapshot> {
    const [topics, articles, questions, faqItems] = await Promise.all([
      this.prisma.topic.findMany({
        include: {
          questions: true,
          articles: true,
          faqItems: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.article.findMany({
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.question.findMany({
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.fAQItem.findMany({
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return {
      topics,
      articles,
      questions,
      faqItems,
      timestamp: new Date(),
    };
  }

  /**
   * Clean up test data created during simulation
   */
  async cleanupTestData(testDataIds: string[]): Promise<void> {
    // Delete topics (cascading deletes will handle related records)
    await this.prisma.topic.deleteMany({
      where: {
        id: { in: testDataIds },
      },
    });

    // Clean up audit logs for test data
    if (this.auditEnabled) {
      await this.prisma.auditLog.deleteMany({
        where: {
          userId: this.userId,
          entityId: { in: testDataIds },
        },
      });
    }
  }

  /**
   * Clean up test admin user
   */
  async cleanupTestUser(): Promise<void> {
    await this.prisma.user.deleteMany({
      where: {
        email: 'test-admin@example.com',
      },
    });
  }
}

/**
 * Test data modification utilities
 */
export class TestDataModifier {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Generate test topic data with realistic content
   */
  generateTestTopicData(overrides: Partial<TopicTestData> = {}): TopicTestData {
    const randomId = ValidationUtils.randomString(8);
    
    return {
      slug: `test-topic-${randomId}`,
      title: `Test Topic ${randomId}`,
      locale: 'en',
      tags: ['test', 'verification', 'api'],
      thumbnailUrl: `https://example.com/thumbnails/test-${randomId}.jpg`,
      seoTitle: `SEO Title for Test Topic ${randomId}`,
      seoDescription: `This is a test topic created for verification purposes - ${randomId}`,
      seoKeywords: ['test', 'topic', 'verification', randomId],
      mainQuestion: `What is the main question for test topic ${randomId}?`,
      article: {
        content: `<h1>Test Article Content</h1><p>This is test content for topic ${randomId}. It includes <strong>HTML formatting</strong> and multiple paragraphs.</p><p>This content is used to verify that admin interface changes are properly reflected in API responses.</p>`,
        status: 'PUBLISHED',
        seoTitle: `Article SEO Title ${randomId}`,
        seoDescription: `Article SEO description for test topic ${randomId}`,
        seoKeywords: ['article', 'test', 'content', randomId],
      },
      faqItems: [
        {
          question: `FAQ Question 1 for ${randomId}?`,
          answer: `This is the answer to FAQ question 1 for test topic ${randomId}.`,
          order: 1,
        },
        {
          question: `FAQ Question 2 for ${randomId}?`,
          answer: `This is the answer to FAQ question 2 for test topic ${randomId}.`,
          order: 2,
        },
      ],
      ...overrides,
    };
  }

  /**
   * Generate multiple test topics for batch operations
   */
  generateMultipleTestTopics(count: number, baseOverrides: Partial<TopicTestData> = {}): TopicTestData[] {
    return Array.from({ length: count }, (_, index) => 
      this.generateTestTopicData({
        ...baseOverrides,
        slug: `${baseOverrides.slug || 'test-topic'}-${index + 1}-${ValidationUtils.randomString(6)}`,
        title: `${baseOverrides.title || 'Test Topic'} ${index + 1}`,
      })
    );
  }

  /**
   * Create test data with specific SEO field variations
   */
  generateSEOTestVariations(): TopicTestData[] {
    const baseId = ValidationUtils.randomString(8);
    
    return [
      // Complete SEO data
      this.generateTestTopicData({
        slug: `seo-complete-${baseId}`,
        title: 'Complete SEO Test Topic',
        seoTitle: 'Complete SEO Title',
        seoDescription: 'Complete SEO description with all fields populated',
        seoKeywords: ['complete', 'seo', 'test'],
        article: {
          content: '<p>Complete SEO article content</p>',
          status: 'PUBLISHED',
          seoTitle: 'Complete Article SEO Title',
          seoDescription: 'Complete article SEO description',
          seoKeywords: ['article', 'complete', 'seo'],
        },
      }),
      // Partial SEO data
      this.generateTestTopicData({
        slug: `seo-partial-${baseId}`,
        title: 'Partial SEO Test Topic',
        seoTitle: 'Partial SEO Title',
        seoDescription: null,
        seoKeywords: ['partial', 'seo'],
        article: {
          content: '<p>Partial SEO article content</p>',
          status: 'PUBLISHED',
          seoTitle: null,
          seoDescription: 'Only article description',
          seoKeywords: null,
        },
      }),
      // No SEO data
      this.generateTestTopicData({
        slug: `seo-none-${baseId}`,
        title: 'No SEO Test Topic',
        seoTitle: null,
        seoDescription: null,
        seoKeywords: null,
        article: {
          content: '<p>No SEO article content</p>',
          status: 'PUBLISHED',
          seoTitle: null,
          seoDescription: null,
          seoKeywords: null,
        },
      }),
    ];
  }
}

/**
 * Data state verification utilities
 */
export class DataStateVerifier {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Verify that a topic exists in the database with expected data
   */
  async verifyTopicExists(topicId: string, expectedData?: Partial<TopicTestData>): Promise<boolean> {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        questions: true,
        articles: true,
        faqItems: { orderBy: { order: 'asc' } },
      },
    });

    if (!topic) return false;

    if (expectedData) {
      // Verify basic topic fields
      if (expectedData.title && topic.title !== expectedData.title) return false;
      if (expectedData.locale && topic.locale !== expectedData.locale) return false;
      if (expectedData.seoTitle && topic.seoTitle !== expectedData.seoTitle) return false;
      if (expectedData.seoDescription && topic.seoDescription !== expectedData.seoDescription) return false;
      if (expectedData.thumbnailUrl && topic.thumbnailUrl !== expectedData.thumbnailUrl) return false;

      // Verify arrays
      if (expectedData.tags && !ValidationUtils.deepEqual(topic.tags, expectedData.tags)) return false;
      if (expectedData.seoKeywords && !ValidationUtils.deepEqual(topic.seoKeywords, expectedData.seoKeywords)) return false;

      // Verify main question
      if (expectedData.mainQuestion) {
        const mainQuestion = topic.questions.find(q => q.isPrimary);
        if (!mainQuestion || mainQuestion.text !== expectedData.mainQuestion) return false;
      }

      // Verify article
      if (expectedData.article && topic.articles.length > 0) {
        const article = topic.articles[0];
        if (expectedData.article.content && article.content !== expectedData.article.content) return false;
        if (expectedData.article.status && article.status !== expectedData.article.status) return false;
        if (expectedData.article.seoTitle && article.seoTitle !== expectedData.article.seoTitle) return false;
        if (expectedData.article.seoDescription && article.seoDescription !== expectedData.article.seoDescription) return false;
        if (expectedData.article.seoKeywords && !ValidationUtils.deepEqual(article.seoKeywords, expectedData.article.seoKeywords)) return false;
      }

      // Verify FAQ items count
      if (expectedData.faqItems && topic.faqItems.length !== expectedData.faqItems.length) return false;
    }

    return true;
  }

  /**
   * Compare two data state snapshots
   */
  compareDataStates(before: DataStateSnapshot, after: DataStateSnapshot): {
    identical: boolean;
    differences: string[];
    addedTopics: string[];
    removedTopics: string[];
    modifiedTopics: string[];
  } {
    const differences: string[] = [];
    const addedTopics: string[] = [];
    const removedTopics: string[] = [];
    const modifiedTopics: string[] = [];

    // Find added topics
    for (const afterTopic of after.topics) {
      const beforeTopic = before.topics.find(t => t.id === afterTopic.id);
      if (!beforeTopic) {
        addedTopics.push(afterTopic.id);
        differences.push(`Topic added: ${afterTopic.slug} (${afterTopic.id})`);
      }
    }

    // Find removed topics
    for (const beforeTopic of before.topics) {
      const afterTopic = after.topics.find(t => t.id === beforeTopic.id);
      if (!afterTopic) {
        removedTopics.push(beforeTopic.id);
        differences.push(`Topic removed: ${beforeTopic.slug} (${beforeTopic.id})`);
      }
    }

    // Find modified topics
    for (const beforeTopic of before.topics) {
      const afterTopic = after.topics.find(t => t.id === beforeTopic.id);
      if (afterTopic && !ValidationUtils.deepEqual(beforeTopic, afterTopic)) {
        modifiedTopics.push(beforeTopic.id);
        differences.push(`Topic modified: ${beforeTopic.slug} (${beforeTopic.id})`);
      }
    }

    return {
      identical: differences.length === 0,
      differences,
      addedTopics,
      removedTopics,
      modifiedTopics,
    };
  }

  /**
   * Verify audit log entries exist for operations
   */
  async verifyAuditLogs(entityIds: string[], expectedActions: AuditAction[]): Promise<boolean> {
    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        entityId: { in: entityIds },
        action: { in: expectedActions },
      },
    });

    return auditLogs.length >= expectedActions.length;
  }
}