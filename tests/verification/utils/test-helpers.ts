import { TestResult, TestStatus, TestCategory, VerificationLevel, ErrorType, TestError } from '../types';

/**
 * Helper functions for creating test results
 */

export function createTestResult(
  testName: string,
  success: boolean,
  duration: number,
  options: {
    category?: TestCategory;
    verificationLevel?: VerificationLevel;
    error?: string;
    details?: any;
    requirements?: string[];
  } = {}
): TestResult {
  const startTime = new Date(Date.now() - duration);
  const endTime = new Date();

  let testError: TestError | undefined;
  if (!success && options.error) {
    testError = {
      type: ErrorType.UNKNOWN_ERROR,
      message: options.error,
    };
  }

  return {
    testName,
    category: options.category || TestCategory.API_ENDPOINTS,
    status: success ? TestStatus.PASSED : TestStatus.FAILED,
    duration,
    startTime,
    endTime,
    error: testError,
    details: options.details || {},
    verificationLevel: options.verificationLevel || VerificationLevel.HIGH,
    requirements: options.requirements || [],
  };
}

export function createSuccessResult(
  testName: string,
  duration: number,
  details: any = {},
  category: TestCategory = TestCategory.API_ENDPOINTS
): TestResult {
  return createTestResult(testName, true, duration, {
    category,
    details,
    verificationLevel: VerificationLevel.HIGH,
  });
}

export function createFailureResult(
  testName: string,
  duration: number,
  error: string,
  details: any = {},
  category: TestCategory = TestCategory.API_ENDPOINTS
): TestResult {
  return createTestResult(testName, false, duration, {
    category,
    error,
    details,
    verificationLevel: VerificationLevel.HIGH,
  });
}

export function createAuthErrorResult(
  testName: string,
  duration: number,
  error: string,
  details: any = {}
): TestResult {
  const result = createFailureResult(testName, duration, error, details, TestCategory.AUTHENTICATION);
  if (result.error) {
    result.error.type = ErrorType.AUTHENTICATION_ERROR;
  }
  return result;
}

export function createValidationErrorResult(
  testName: string,
  duration: number,
  error: string,
  validationErrors: string[],
  details: any = {}
): TestResult {
  const result = createFailureResult(testName, duration, error, {
    ...details,
    validationErrors,
  });
  if (result.error) {
    result.error.type = ErrorType.VALIDATION_ERROR;
  }
  return result;
}

export function createPerformanceErrorResult(
  testName: string,
  duration: number,
  error: string,
  performanceMetrics: any,
  details: any = {}
): TestResult {
  const result = createFailureResult(testName, duration, error, {
    ...details,
    performanceMetrics,
  }, TestCategory.PERFORMANCE);
  if (result.error) {
    result.error.type = ErrorType.PERFORMANCE_ERROR;
  }
  return result;
}