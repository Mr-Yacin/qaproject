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
      });

      // Upsert primary question (Requirement 3.3)
      await this.repository.upsertPrimaryQuestion(topic.id, payload.mainQuestion.text);

      // Upsert article (Requirement 3.4)
      await this.repository.upsertArticle(topic.id, {
        content: payload.article.content,
        status: payload.article.status,
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
}
