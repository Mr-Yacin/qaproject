import { PaginatedTopics, UnifiedTopic, TopicFilters } from '@/types/api';
import { APIError, handleAPIResponse } from './errors';

/**
 * Fetches a paginated list of topics with optional filtering
 * @param params - Optional filters for locale, tag, page, and limit
 * @returns Paginated topics response
 * @throws APIError if the request fails
 * Requirements: 1.2
 */
export async function getTopics(params?: Partial<TopicFilters>): Promise<PaginatedTopics> {
  try {
    const searchParams = new URLSearchParams();
    
    if (params?.locale) {
      searchParams.set('locale', params.locale);
    }
    if (params?.tag) {
      searchParams.set('tag', params.tag);
    }
    if (params?.page !== undefined) {
      searchParams.set('page', params.page.toString());
    }
    if (params?.limit !== undefined) {
      searchParams.set('limit', params.limit.toString());
    }
    
    const url = `/api/topics${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Enable Next.js cache tagging for revalidation
      next: { 
        tags: ['topics'],
        revalidate: 60 // Revalidate every 60 seconds
      }
    });
    
    return handleAPIResponse<PaginatedTopics>(response);
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    // Handle network errors or other unexpected errors
    throw new APIError(
      error instanceof Error ? error.message : 'Failed to fetch topics',
      500
    );
  }
}

/**
 * Fetches a single topic by its slug
 * @param slug - The unique slug identifier for the topic
 * @returns Unified topic data including article and FAQ items
 * @throws APIError if the request fails or topic is not found
 * Requirements: 1.3
 */
export async function getTopicBySlug(slug: string): Promise<UnifiedTopic> {
  try {
    if (!slug || typeof slug !== 'string') {
      throw new APIError('Invalid slug parameter', 400);
    }
    
    const response = await fetch(`/api/topics/${encodeURIComponent(slug)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Enable Next.js cache tagging for revalidation
      next: { 
        tags: ['topics', `topic:${slug}`],
        revalidate: 60 // Revalidate every 60 seconds
      }
    });
    
    return handleAPIResponse<UnifiedTopic>(response);
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    // Handle network errors or other unexpected errors
    throw new APIError(
      error instanceof Error ? error.message : 'Failed to fetch topic',
      500
    );
  }
}
