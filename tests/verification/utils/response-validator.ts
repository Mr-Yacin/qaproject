import { z } from 'zod';
import {
  UnifiedTopicResponseSchema,
  PaginatedTopicsResponseSchema,
  IngestSuccessResponseSchema,
  RevalidateSuccessResponseSchema,
  ValidationErrorResponseSchema,
  AuthErrorResponseSchema,
  NotFoundErrorResponseSchema,
  ServerErrorResponseSchema,
  InvalidJSONErrorResponseSchema,
  GenericErrorResponseSchema,
} from '../schemas/api-response-schemas';

/**
 * Response Validation Utilities
 * Provides functions to validate API responses against expected schemas
 * Requirements: 1.1, 6.1, 6.2
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  data?: any;
}

/**
 * Validates a response against a Zod schema
 */
export function validateResponse<T>(
  response: any,
  schema: z.ZodSchema<T>,
  context?: string
): ValidationResult {
  try {
    const result = schema.safeParse(response);
    
    if (result.success) {
      return {
        valid: true,
        errors: [],
        data: result.data,
      };
    } else {
      const errors = result.error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      );
      
      return {
        valid: false,
        errors: context 
          ? errors.map(error => `${context} - ${error}`)
          : errors,
      };
    }
  } catch (error) {
    return {
      valid: false,
      errors: [
        context 
          ? `${context} - Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          : `Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      ],
    };
  }
}

/**
 * Validates GET /api/topics response
 */
export function validateTopicsListResponse(response: any): ValidationResult {
  return validateResponse(
    response,
    PaginatedTopicsResponseSchema,
    'GET /api/topics'
  );
}

/**
 * Validates GET /api/topics/[slug] response
 */
export function validateTopicBySlugResponse(response: any): ValidationResult {
  return validateResponse(
    response,
    UnifiedTopicResponseSchema,
    'GET /api/topics/[slug]'
  );
}

/**
 * Validates POST /api/ingest success response
 */
export function validateIngestSuccessResponse(response: any): ValidationResult {
  return validateResponse(
    response,
    IngestSuccessResponseSchema,
    'POST /api/ingest success'
  );
}

/**
 * Validates POST /api/revalidate success response
 */
export function validateRevalidateSuccessResponse(response: any): ValidationResult {
  return validateResponse(
    response,
    RevalidateSuccessResponseSchema,
    'POST /api/revalidate success'
  );
}

/**
 * Validates error responses based on status code
 */
export function validateErrorResponse(
  response: any,
  statusCode: number,
  endpoint?: string
): ValidationResult {
  const context = endpoint ? `${endpoint} error (${statusCode})` : `Error (${statusCode})`;
  
  switch (statusCode) {
    case 400:
      // Could be validation error or invalid JSON
      if (response.error === 'Invalid JSON') {
        return validateResponse(response, InvalidJSONErrorResponseSchema, context);
      } else {
        return validateResponse(response, ValidationErrorResponseSchema, context);
      }
    
    case 401:
      return validateResponse(response, AuthErrorResponseSchema, context);
    
    case 404:
      return validateResponse(response, NotFoundErrorResponseSchema, context);
    
    case 500:
      return validateResponse(response, ServerErrorResponseSchema, context);
    
    default:
      // Use generic error schema for other status codes
      return validateResponse(response, GenericErrorResponseSchema, context);
  }
}

/**
 * Validates pagination metadata specifically
 */
export function validatePaginationMetadata(
  response: any,
  expectedPage?: number,
  expectedLimit?: number
): ValidationResult {
  const errors: string[] = [];
  
  // Check if pagination fields exist
  if (typeof response.total !== 'number' || response.total < 0) {
    errors.push('total must be a non-negative number');
  }
  
  if (typeof response.page !== 'number' || response.page < 1) {
    errors.push('page must be a positive number');
  }
  
  if (typeof response.limit !== 'number' || response.limit < 1) {
    errors.push('limit must be a positive number');
  }
  
  if (typeof response.totalPages !== 'number' || response.totalPages < 0) {
    errors.push('totalPages must be a non-negative number');
  }
  
  // Validate pagination logic
  if (errors.length === 0) {
    const expectedTotalPages = Math.ceil(response.total / response.limit);
    if (response.totalPages !== expectedTotalPages) {
      errors.push(`totalPages (${response.totalPages}) doesn't match calculated value (${expectedTotalPages})`);
    }
    
    // Check expected values if provided
    if (expectedPage !== undefined && response.page !== expectedPage) {
      errors.push(`page (${response.page}) doesn't match expected value (${expectedPage})`);
    }
    
    if (expectedLimit !== undefined && response.limit !== expectedLimit) {
      errors.push(`limit (${response.limit}) doesn't match expected value (${expectedLimit})`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? response : undefined,
  };
}

/**
 * Validates that new SEO fields are properly included when present
 */
export function validateSEOFields(topic: any): ValidationResult {
  const errors: string[] = [];
  
  // SEO fields should be either string or null, never undefined
  if (topic.seoTitle !== null && typeof topic.seoTitle !== 'string') {
    errors.push('seoTitle must be string or null');
  }
  
  if (topic.seoDescription !== null && typeof topic.seoDescription !== 'string') {
    errors.push('seoDescription must be string or null');
  }
  
  if (!Array.isArray(topic.seoKeywords)) {
    errors.push('seoKeywords must be an array');
  } else if (topic.seoKeywords.some((keyword: any) => typeof keyword !== 'string')) {
    errors.push('seoKeywords must be an array of strings');
  }
  
  // Thumbnail URL should be string or null
  if (topic.thumbnailUrl !== null && typeof topic.thumbnailUrl !== 'string') {
    errors.push('thumbnailUrl must be string or null');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? topic : undefined,
  };
}

/**
 * Validates that article SEO fields are properly included when present
 */
export function validateArticleSEOFields(article: any): ValidationResult {
  const errors: string[] = [];
  
  if (article.seoTitle !== null && typeof article.seoTitle !== 'string') {
    errors.push('article seoTitle must be string or null');
  }
  
  if (article.seoDescription !== null && typeof article.seoDescription !== 'string') {
    errors.push('article seoDescription must be string or null');
  }
  
  if (!Array.isArray(article.seoKeywords)) {
    errors.push('article seoKeywords must be an array');
  } else if (article.seoKeywords.some((keyword: any) => typeof keyword !== 'string')) {
    errors.push('article seoKeywords must be an array of strings');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? article : undefined,
  };
}