/**
 * API Client Layer
 * Centralized exports for all API client functions
 */

// Error handling
export { APIError, handleAPIResponse } from './errors';

// Topics API (public)
export { getTopics, getTopicBySlug } from './topics';

// Ingest API (admin)
export { 
  createOrUpdateTopic, 
  revalidateCache, 
  revalidateTopicCache 
} from './ingest';
