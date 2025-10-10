import { IngestPayload, IngestResult, RevalidatePayload } from '@/types/api';
import { APIError, handleAPIResponse } from './errors';

/**
 * Generates HMAC-SHA256 signature for client-side authentication
 * Uses Web Crypto API for browser compatibility
 * @param timestamp - The timestamp string
 * @param body - The request body object
 * @returns The HMAC signature as a hex string
 */
async function generateClientSignature(timestamp: string, body: any): Promise<string> {
  const secret = process.env.NEXT_PUBLIC_INGEST_WEBHOOK_SECRET;
  
  if (!secret) {
    throw new Error('NEXT_PUBLIC_INGEST_WEBHOOK_SECRET environment variable is not set');
  }
  
  // Create the message to sign: timestamp.jsonBody
  const message = `${timestamp}.${JSON.stringify(body)}`;
  
  // Convert secret and message to Uint8Array
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  // Import the secret key for HMAC
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // Generate the signature
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  
  // Convert signature to hex string
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Creates or updates a topic via the ingest API
 * @param payload - The topic data to ingest
 * @returns Result containing success status and topic ID
 * @throws APIError if the request fails
 * Requirements: 4.3, 4.5
 */
export async function createOrUpdateTopic(payload: IngestPayload): Promise<IngestResult> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_INGEST_API_KEY;
    
    if (!apiKey) {
      throw new APIError(
        'NEXT_PUBLIC_INGEST_API_KEY environment variable is not set',
        500
      );
    }
    
    // Generate timestamp
    const timestamp = Date.now().toString();
    
    // Generate HMAC signature
    const signature = await generateClientSignature(timestamp, payload);
    
    // Make the API request
    const response = await fetch('/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'x-timestamp': timestamp,
        'x-signature': signature,
      },
      body: JSON.stringify(payload),
    });
    
    return handleAPIResponse<IngestResult>(response);
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    // Handle network errors or other unexpected errors
    throw new APIError(
      error instanceof Error ? error.message : 'Failed to create or update topic',
      500
    );
  }
}

/**
 * Revalidates the Next.js cache for a specific tag
 * @param tag - The cache tag to revalidate (e.g., 'topics', 'topic:slug')
 * @returns Promise that resolves when revalidation is complete
 * @throws APIError if the request fails
 * Requirements: 10.2
 */
export async function revalidateCache(tag: string): Promise<void> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_INGEST_API_KEY;
    
    if (!apiKey) {
      throw new APIError(
        'NEXT_PUBLIC_INGEST_API_KEY environment variable is not set',
        500
      );
    }
    
    if (!tag || typeof tag !== 'string') {
      throw new APIError('Invalid tag parameter', 400);
    }
    
    // Generate timestamp
    const timestamp = Date.now().toString();
    
    // Create payload
    const payload: RevalidatePayload = { tag };
    
    // Generate HMAC signature
    const signature = await generateClientSignature(timestamp, payload);
    
    // Make the API request
    const response = await fetch('/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'x-timestamp': timestamp,
        'x-signature': signature,
      },
      body: JSON.stringify(payload),
    });
    
    await handleAPIResponse<{ message: string; tag: string }>(response);
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    // Handle network errors or other unexpected errors
    throw new APIError(
      error instanceof Error ? error.message : 'Failed to revalidate cache',
      500
    );
  }
}

/**
 * Revalidates multiple cache tags after a topic update
 * Typically called after creating or updating a topic
 * @param slug - The topic slug to revalidate
 * @returns Promise that resolves when all revalidations are complete
 */
export async function revalidateTopicCache(slug: string): Promise<void> {
  try {
    // Revalidate the general topics list
    await revalidateCache('topics');
    
    // Revalidate the specific topic page
    await revalidateCache(`topic:${slug}`);
  } catch (error) {
    // Log error but don't throw - cache revalidation failure shouldn't block the operation
    console.error('Cache revalidation failed:', error);
  }
}

/**
 * Creates a topic via admin API (no HMAC required)
 * @param payload - The topic data to create
 * @returns Promise with creation result
 * @throws APIError if the request fails
 * Requirements: 4.3, 1.1, 1.2, 1.3, 1.4
 */
export async function createTopicAdmin(payload: IngestPayload): Promise<{
  success: boolean;
  topicId: string;
  message: string;
}> {
  try {
    const response = await fetch('/api/admin/topics/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    return handleAPIResponse(response);
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    throw new APIError(
      error instanceof Error ? error.message : 'Failed to create topic',
      500
    );
  }
}

/**
 * Updates a topic via admin API (no HMAC required)
 * @param slug - The topic slug to update
 * @param payload - The topic data to update
 * @returns Promise with update result
 * @throws APIError if the request fails
 * Requirements: 4.4, 4.5, 1.1, 1.2, 1.3, 1.4
 */
export async function updateTopicAdmin(slug: string, payload: IngestPayload): Promise<{
  success: boolean;
  topicId: string;
  message: string;
}> {
  try {
    const response = await fetch(`/api/admin/topics/${slug}/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    return handleAPIResponse(response);
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    throw new APIError(
      error instanceof Error ? error.message : 'Failed to update topic',
      500
    );
  }
}

/**
 * Deletes a topic by slug
 * @param slug - The topic slug to delete
 * @returns Promise with deletion result and impact summary
 * @throws APIError if the request fails
 * Requirements: 1.5, 1.6, 1.7
 */
export async function deleteTopic(slug: string): Promise<{
  success: boolean;
  message: string;
  impact: {
    topicId: string;
    slug: string;
    title: string;
    deletedRecords: {
      questions: number;
      article: number;
      faqItems: number;
    };
  };
}> {
  try {
    const response = await fetch(`/api/admin/topics/${slug}`, {
      method: 'DELETE',
    });
    
    return handleAPIResponse(response);
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    throw new APIError(
      error instanceof Error ? error.message : 'Failed to delete topic',
      500
    );
  }
}
