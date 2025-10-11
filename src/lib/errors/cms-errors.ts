/**
 * CMS Error Classes
 * 
 * Custom error classes for CMS operations with appropriate HTTP status codes.
 * These errors are designed to be caught and handled by API route handlers.
 */

/**
 * Base CMS Error class
 * All CMS-specific errors extend from this class
 */
export class CMSError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'CMSError';
    
    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CMSError);
    }
  }
}

/**
 * Validation Error (400 Bad Request)
 * Thrown when input validation fails
 */
export class ValidationError extends CMSError {
  constructor(message: string, public details?: any) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

/**
 * Not Found Error (404 Not Found)
 * Thrown when a requested resource doesn't exist
 */
export class NotFoundError extends CMSError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Unauthorized Error (401 Unauthorized)
 * Thrown when authentication is required but not provided
 */
export class UnauthorizedError extends CMSError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Forbidden Error (403 Forbidden)
 * Thrown when user doesn't have permission to access a resource
 */
export class ForbiddenError extends CMSError {
  constructor(message: string = 'Forbidden') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * Duplicate Error (409 Conflict)
 * Thrown when attempting to create a resource that already exists
 */
export class DuplicateError extends CMSError {
  constructor(resource: string) {
    super(`${resource} already exists`, 'DUPLICATE', 409);
    this.name = 'DuplicateError';
  }
}

/**
 * Internal Server Error (500 Internal Server Error)
 * Thrown for unexpected server errors
 */
export class InternalServerError extends CMSError {
  constructor(message: string = 'Internal server error') {
    super(message, 'INTERNAL_SERVER_ERROR', 500);
    this.name = 'InternalServerError';
  }
}
