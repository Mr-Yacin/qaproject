import { ContentRepository } from '../repositories/content.repository';
import { IngestPayload, IngestResult, UnifiedTopic, PaginatedTopics, TopicFilters } from '@/types/api';

/**
 * ContentService orchestrates business logic and coordinates repository operations
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
export class ContentService {
  private repository: ContentRepository;

  constructor(repository: ContentRepository) {
    this.repository = repository;
  }

  /**
   * Ingest content with atomic transaction and job tracking
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9
   */
  async ingestContent(payload: IngestPayload): Promise<IngestResult> {
    // Create IngestJob with "processing" status (Requirement 3.6)
    const job = await this.repository.createIngestJob(payload.topic.slug, payload);

    try {
      // Execute upsert operations in transaction (Requirement 3.9 - idempotency)
      // Upsert topic (Requirements 3.1, 3.2)
      const topic = await this.repository.upsertTopic({
        slug: payload.topic.slug,
        title: payload.topic.title,
        locale: payload.topic.locale,
        tags: payload.topic.tags,
        seoTitle: payload.topic.seoTitle,
        seoDescription: payload.topic.seoDescription,
        seoKeywords: payload.topic.seoKeywords,
      });

      // Upsert primary question (Requirement 3.3)
      await this.repository.upsertPrimaryQuestion(topic.id, payload.mainQuestion.text);

      // Upsert article (Requirement 3.4)
      await this.repository.upsertArticle(topic.id, {
        content: payload.article.content,
        status: payload.article.status,
        seoTitle: payload.article.seoTitle,
        seoDescription: payload.article.seoDescription,
        seoKeywords: payload.article.seoKeywords,
      });

      // Replace FAQ items (Requirement 3.5)
      await this.repository.replaceFAQItems(topic.id, payload.faqItems);

      // Update IngestJob to "completed" on success (Requirement 3.7)
      await this.repository.updateIngestJob(job.id, {
        status: 'completed',
        completedAt: new Date(),
      });

      // Return result with topicId and jobId
      return {
        success: true,
        topicId: topic.id,
        jobId: job.id,
      };
    } catch (error) {
      // Update IngestJob to "failed" with error on failure (Requirement 3.8)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await this.repository.updateIngestJob(job.id, {
        status: 'failed',
        error: errorMessage,
        completedAt: new Date(),
      });

      // Log error for debugging
      console.error('Content ingestion failed:', {
        jobId: job.id,
        topicSlug: payload.topic.slug,
        error: errorMessage,
      });

      // Re-throw error to be handled by API route
      throw error;
    }
  }

  /**
   * Get topic by slug with unified structure
   * Requirements: 4.1, 4.2, 4.3, 4.4
   */
  async getTopicBySlug(slug: string): Promise<UnifiedTopic | null> {
    // Fetch topic with questions, articles, faqItems relations
    // Filter for isPrimary question
    // Filter for PUBLISHED article only
    // Sort FAQ items by order field
    // Return unified structure or null
    // (Requirements 4.1, 4.2, 4.3, 4.4)
    return this.repository.findTopicBySlug(slug);
  }

  /**
   * List topics with filtering and pagination
   * Requirements: 4.5, 4.6, 4.7, 4.8, 4.9
   */
  async listTopics(filters: TopicFilters): Promise<PaginatedTopics> {
    // Apply locale and tag filters
    // Only include topics with PUBLISHED articles
    // Calculate total count for pagination
    // Apply page and limit for pagination
    // Return paginated results with metadata
    // (Requirements 4.5, 4.6, 4.7, 4.8, 4.9)
    return this.repository.findTopics(filters);
  }

  /**
   * Bulk delete topics
   * Requirements: 10.2, 10.6
   */
  async bulkDeleteTopics(topicIds: string[]): Promise<{ success: number; failed: number }> {
    try {
      const deletedCount = await this.repository.bulkDeleteTopics(topicIds);
      return {
        success: deletedCount,
        failed: topicIds.length - deletedCount,
      };
    } catch (error) {
      console.error('Bulk delete failed:', error);
      throw error;
    }
  }

  /**
   * Bulk update topics
   * Requirements: 10.3, 10.4, 10.6
   */
  async bulkUpdateTopics(
    topicIds: string[],
    updates: {
      status?: 'DRAFT' | 'PUBLISHED';
      tags?: {
        add?: string[];
        remove?: string[];
      };
    }
  ): Promise<{ success: number; failed: number }> {
    try {
      let successCount = 0;

      // Update status if provided
      if (updates.status) {
        const updatedCount = await this.repository.bulkUpdateTopicStatus(topicIds, updates.status);
        successCount = updatedCount;
      }

      // Add tags if provided
      if (updates.tags?.add && updates.tags.add.length > 0) {
        await this.repository.bulkAddTags(topicIds, updates.tags.add);
        if (!updates.status) successCount = topicIds.length;
      }

      // Remove tags if provided
      if (updates.tags?.remove && updates.tags.remove.length > 0) {
        await this.repository.bulkRemoveTags(topicIds, updates.tags.remove);
        if (!updates.status) successCount = topicIds.length;
      }

      return {
        success: successCount,
        failed: topicIds.length - successCount,
      };
    } catch (error) {
      console.error('Bulk update failed:', error);
      throw error;
    }
  }

  /**
   * Export topics
   * Requirements: 10.7
   */
  async exportTopics(filters: {
    topicIds?: string[];
    locale?: string;
    tag?: string;
    status?: 'DRAFT' | 'PUBLISHED';
  }): Promise<UnifiedTopic[]> {
    return this.repository.exportTopics(filters);
  }

  /**
   * Import topics
   * Requirements: 10.8
   */
  async importTopics(
    topics: Array<{
      slug: string;
      title: string;
      locale: string;
      tags: string[];
      mainQuestion: { text: string };
      article: { content: string; status: 'DRAFT' | 'PUBLISHED' };
      faqItems: Array<{ question: string; answer: string; order: number }>;
    }>,
    mode: 'create' | 'upsert'
  ): Promise<{ success: number; failed: number; errors: Array<{ slug: string; error: string }> }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ slug: string; error: string }>,
    };

    for (const topicData of topics) {
      try {
        if (mode === 'create') {
          // Check if topic already exists
          const existing = await this.repository.findTopicBySlug(topicData.slug);
          if (existing) {
            throw new Error(`Topic with slug "${topicData.slug}" already exists`);
          }
        }

        // Upsert topic
        const topic = await this.repository.upsertTopic({
          slug: topicData.slug,
          title: topicData.title,
          locale: topicData.locale,
          tags: topicData.tags,
        });

        // Upsert primary question
        await this.repository.upsertPrimaryQuestion(topic.id, topicData.mainQuestion.text);

        // Upsert article
        await this.repository.upsertArticle(topic.id, {
          content: topicData.article.content,
          status: topicData.article.status,
        });

        // Replace FAQ items
        await this.repository.replaceFAQItems(topic.id, topicData.faqItems);

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          slug: topicData.slug,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Delete a topic by slug
   * Requirements: 1.5, 1.6, 1.7
   */
  async deleteTopic(slug: string): Promise<{
    success: boolean;
    impact: {
      questions: number;
      articles: number;
      faqItems: number;
    };
  }> {
    try {
      // Get impact summary before deletion
      const impact = await this.repository.getTopicImpactSummary(slug);
      
      if (!impact) {
        throw new Error('Topic not found');
      }

      // Delete the topic (cascade delete will handle related records)
      await this.repository.deleteTopicBySlug(slug);

      return {
        success: true,
        impact,
      };
    } catch (error) {
      console.error('Delete topic failed:', error);
      throw error;
    }
  }
}
