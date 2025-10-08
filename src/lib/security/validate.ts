import { generateSignature } from './hmac';
import { timingSafeCompare } from './timing';

export interface SecurityHeaders {
  apiKey: string | null;
  timestamp: string | null;
  signature: string | null;
}

export interface SecurityValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates security headers for webhook requests
 * Checks API key, timestamp freshness, and HMAC signature
 * @param headers - Security headers from the request
 * @param rawBody - Raw request body as string for signature verification
 * @returns Validation result with error message if invalid
 */
export function validateSecurity(
  headers: SecurityHeaders,
  rawBody: string
): SecurityValidationResult {
  const { apiKey, timestamp, signature } = headers;
  
  // Check for missing headers
  if (!apiKey || !timestamp || !signature) {
    return {
      valid: false,
      error: 'Missing required security headers (x-api-key, x-timestamp, x-signature)'
    };
  }
  
  // Validate API key
  const expectedApiKey = process.env.INGEST_API_KEY;
  if (!expectedApiKey) {
    return {
      valid: false,
      error: 'Server configuration error: INGEST_API_KEY not set'
    };
  }
  
  if (!timingSafeCompare(apiKey, expectedApiKey)) {
    return {
      valid: false,
      error: 'Invalid API key'
    };
  }
  
  // Validate timestamp (within ±5 minutes)
  const requestTime = parseInt(timestamp, 10);
  if (isNaN(requestTime)) {
    return {
      valid: false,
      error: 'Invalid timestamp format'
    };
  }
  
  const currentTime = Date.now();
  const timeDifference = Math.abs(currentTime - requestTime);
  const fiveMinutesInMs = 5 * 60 * 1000;
  
  if (timeDifference > fiveMinutesInMs) {
    return {
      valid: false,
      error: 'Request expired'
    };
  }
  
  // Validate HMAC signature
  try {
    const expectedSignature = generateSignature(timestamp, rawBody);
    
    if (!timingSafeCompare(signature, expectedSignature)) {
      return {
        valid: false,
        error: 'Invalid signature'
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: 'Signature verification failed'
    };
  }
  
  return { valid: true };
}
