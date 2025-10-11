/**
 * Error Handling Module
 * 
 * Exports all error classes and error handling utilities
 */

// Server-side error classes
export {
  CMSError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  DuplicateError,
  InternalServerError,
} from './cms-errors';

// Server-side error handler
export { handleAPIError, withErrorHandling } from './error-handler';

// Client-side error handlers
export {
  showErrorToast,
  showSuccessToast,
  showInfoToast,
  formatValidationError,
  handleNetworkError,
  withErrorHandling as withClientErrorHandling,
  parseErrorResponse,
  handleFetchError,
} from './client-error-handler';
