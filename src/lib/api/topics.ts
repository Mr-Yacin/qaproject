import { PaginatedTopics, UnifiedTopic, TopicFilters } from '@/types/api';
import { APIError, handleAPIResponse } from './errors';

/**
 * Determines the base URL for API calls based on the environment
 * @returns Base URL string (empty for browser, full URL for server)
 * Requirements: 2.1, 2.2
 */
function getBaseUrl(): string {
  // Browser environment - use relative URLs
  if (typeof window !== 'undefined') {
    return '';
  }
  
  // Server environment - need absolute URLs for SSR/SSG
  // 1. Check for explicit API URL (for production)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // 2. Check for Vercel URL (automatic in Vercel deployments)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // 3. Default to localhost for local development
  return 'http://localhost:3000';
}

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
    
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/api/topics${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    
    console.log('[API Client] Fetching topics:', { url, params });
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Enable Next.js cache tagging for revalidation
      // ISR: Revalidate every 300 seconds (5 minutes) or on-demand via revalidateTag
      next: { 
        tags: ['topics'],
        revalidate: 300 // ISR: Revalidate every 5 minutes
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response');
      console.error('[API Client] Topics API error:', {
        status: response.status,
        statusText: response.statusText,
        url,
        params,
        errorText
      });
    }
    
    return handleAPIResponse<PaginatedTopics>(response);
  } catch (error) {
    console.error('[API Client] getTopics error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      params
    });
    
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
 * Fetches all topics including drafts (admin only)
 * @param params - Optional filters for locale, tag, page, and limit
 * @returns Paginated topics response including draft topics
 * @throws APIError if the request fails
 * Requirements: 4.1, 4.2
 */
export async function getAdminTopics(params?: Partial<TopicFilters>): Promise<PaginatedTopics> {
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
    
    const url = `/api/admin/topics${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return handleAPIResponse<PaginatedTopics>(response);
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    throw new APIError(
      error instanceof Error ? error.message : 'Failed to fetch admin topics',
      500
    );
  }
}

/**
 * Fetches a single topic by its slug (admin version - includes drafts)
 * @param slug - The unique slug identifier for the topic
 * @returns Unified topic data including article and FAQ items (draft or published)
 * @throws APIError if the request fails or topic is not found
 * Requirements: 4.4, 4.5
 */
export async function getAdminTopicBySlug(slug: string): Promise<UnifiedTopic> {
  try {
    if (!slug || typeof slug !== 'string') {
      throw new APIError('Invalid slug parameter', 400);
    }
    
    const url = `/api/admin/topics/${encodeURIComponent(slug)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return handleAPIResponse<UnifiedTopic>(response);
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    throw new APIError(
      error instanceof Error ? error.message : 'Failed to fetch topic',
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
    
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/api/topics/${encodeURIComponent(slug)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Enable Next.js cache tagging for revalidation
      // ISR: Revalidate every 300 seconds (5 minutes) or on-demand via revalidateTag
      next: { 
        tags: ['topics', `topic:${slug}`],
        revalidate: 300 // ISR: Revalidate every 5 minutes
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
