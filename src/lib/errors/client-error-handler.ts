/**
 * Client-Side Error Handler
 * 
 * Utilities for handling errors in client components with user-friendly messages
 */

import { toast } from '@/hooks/use-toast';

/**
 * Error response structure from API
 */
interface APIErrorResponse {
  error: string;
  code?: string;
  details?: any;
}

/**
 * Display error message using toast notification
 * 
 * @param error - The error to display
 * @param fallbackMessage - Optional fallback message if error parsing fails
 */
export function showErrorToast(error: unknown, fallbackMessage?: string): void {
  let errorMessage = fallbackMessage || 'An unexpected error occurred';
  let errorDetails: string | undefined;

  // Handle API error responses
  if (error && typeof error === 'object' && 'error' in error) {
    const apiError = error as APIErrorResponse;
    errorMessage = apiError.error;

    // Format validation error details
    if (apiError.details && Array.isArray(apiError.details)) {
      errorDetails = apiError.details
        .map((detail: any) => {
          if (detail.path && detail.message) {
            return `${detail.path}: ${detail.message}`;
          }
          return detail.message || JSON.stringify(detail);
        })
        .join('\n');
    }
  }
  // Handle Error objects
  else if (error instanceof Error) {
    errorMessage = error.message;
  }
  // Handle string errors
  else if (typeof error === 'string') {
    errorMessage = error;
  }

  toast({
    variant: 'destructive',
    title: 'Error',
    description: errorDetails || errorMessage,
  });
}

/**
 * Display success message using toast notification
 * 
 * @param message - The success message to display
 * @param description - Optional description
 */
export function showSuccessToast(message: string, description?: string): void {
  toast({
    title: message,
    description,
  });
}

/**
 * Display info message using toast notification
 * 
 * @param message - The info message to display
 * @param description - Optional description
 */
export function showInfoToast(message: string, description?: string): void {
  toast({
    title: message,
    description,
  });
}

/**
 * Handle form validation errors
 * Returns a formatted error message for display
 * 
 * @param error - The validation error
 * @returns Formatted error message
 */
export function formatValidationError(error: unknown): string {
  if (error && typeof error === 'object' && 'details' in error) {
    const apiError = error as APIErrorResponse;
    
    if (apiError.details && Array.isArray(apiError.details)) {
      return apiError.details
        .map((detail: any) => {
          if (detail.path && detail.message) {
            return `${detail.path}: ${detail.message}`;
          }
          return detail.message || 'Validation error';
        })
        .join(', ');
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Validation failed';
}

/**
 * Handle network errors gracefully
 * 
 * @param error - The error to handle
 * @returns User-friendly error message
 */
export function handleNetworkError(error: unknown): string {
  // Check if it's a network error
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }

  // Check for timeout
  if (error instanceof Error && error.message.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  // Check for abort
  if (error instanceof Error && error.name === 'AbortError') {
    return 'Request was cancelled.';
  }

  return 'An error occurred while communicating with the server.';
}

/**
 * Wrapper for async operations with error handling
 * Automatically shows error toast on failure
 * 
 * @param operation - The async operation to execute
 * @param errorMessage - Optional custom error message
 * @returns Result of the operation or undefined on error
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    showErrorToast(error, errorMessage);
    return undefined;
  }
}

/**
 * Parse error from fetch response
 * 
 * @param response - The fetch Response object
 * @returns Parsed error object
 */
export async function parseErrorResponse(response: Response): Promise<APIErrorResponse> {
  try {
    const data = await response.json();
    return data as APIErrorResponse;
  } catch {
    return {
      error: `Request failed with status ${response.status}`,
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Handle fetch errors with proper error messages
 * 
 * @param response - The fetch Response object
 * @throws Parsed error object
 */
export async function handleFetchError(response: Response): Promise<never> {
  const error = await parseErrorResponse(response);
  throw error;
}
