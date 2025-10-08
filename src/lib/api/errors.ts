/**
 * Custom error class for API-related errors
 * Provides structured error information including status codes
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
    
    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIError);
    }
  }
}

/**
 * Handles API response and throws APIError if response is not ok
 * @param response - The fetch Response object
 * @returns Parsed JSON response
 * @throws APIError if response is not ok
 */
export async function handleAPIResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: any = {};
    
    try {
      errorData = await response.json();
    } catch {
      // If response body is not JSON, use default error
      errorData = { error: 'An error occurred' };
    }
    
    throw new APIError(
      errorData.error || errorData.message || 'An error occurred',
      response.status,
      errorData.code,
      errorData.details
    );
  }
  
  return response.json();
}
