/**
 * Error Handler Utility
 * 
 * Centralized error handling for API routes.
 * Converts various error types into appropriate HTTP responses.
 */

import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { CMSError } from './cms-errors';
import { RateLimitError } from '@/lib/middleware/rate-limit.middleware';

/**
 * Error response structure
 */
interface ErrorResponse {
  error: string;
  code?: string;
  details?: any;
}

/**
 * Handle API errors and return appropriate Response
 * 
 * @param error - The error to handle
 * @returns Response object with appropriate status code and error message
 */
export async function handleAPIError(error: unknown): Promise<Response> {
  // Log error for debugging (in production, this should go to a logging service)
  console.error('API Error:', error);

  // Handle rate limit errors
  if (error instanceof RateLimitError) {
    return Response.json(
      {
        error: error.message,
        code: 'RATE_LIMIT_EXCEEDED',
      },
      { 
        status: 429,
        headers: {
          'Retry-After': error.retryAfter.toString(),
        },
      }
    );
  }

  // Handle CMS-specific errors
  if (error instanceof CMSError) {
    const response: ErrorResponse = {
      error: error.message,
      code: error.code,
    };

    // Include details for validation errors
    if ('details' in error && error.details) {
      response.details = error.details;
    }

    return Response.json(response, { status: error.statusCode });
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return Response.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      },
      { status: 400 }
    );
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error);
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return Response.json(
      {
        error: 'Database validation error',
        code: 'DATABASE_VALIDATION_ERROR',
      },
      { status: 400 }
    );
  }

  // Handle generic errors
  if (error instanceof Error) {
    return Response.json(
      {
        error: error.message || 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 }
    );
  }

  // Handle unknown errors
  return Response.json(
    {
      error: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    },
    { status: 500 }
  );
}

/**
 * Handle Prisma-specific errors
 * 
 * @param error - Prisma error
 * @returns Response object with appropriate status code and error message
 */
function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError
): Response {
  switch (error.code) {
    // Unique constraint violation
    case 'P2002': {
      const target = (error.meta?.target as string[]) || [];
      const field = target.length > 0 ? target[0] : 'field';
      return Response.json(
        {
          error: `A record with this ${field} already exists`,
          code: 'DUPLICATE',
          details: { field, constraint: error.meta?.target },
        },
        { status: 409 }
      );
    }

    // Record not found
    case 'P2025':
      return Response.json(
        {
          error: 'Record not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );

    // Foreign key constraint violation
    case 'P2003':
      return Response.json(
        {
          error: 'Related record not found',
          code: 'FOREIGN_KEY_VIOLATION',
          details: { field: error.meta?.field_name },
        },
        { status: 400 }
      );

    // Record required but not found
    case 'P2018':
      return Response.json(
        {
          error: 'Required record not found',
          code: 'REQUIRED_RECORD_NOT_FOUND',
        },
        { status: 404 }
      );

    // Default Prisma error
    default:
      return Response.json(
        {
          error: 'Database operation failed',
          code: 'DATABASE_ERROR',
          details: { prismaCode: error.code },
        },
        { status: 500 }
      );
  }
}

/**
 * Wrap an async function with error handling
 * Useful for API route handlers
 * 
 * @param handler - The async function to wrap
 * @returns Wrapped function that handles errors
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleAPIError(error);
    }
  };
}
