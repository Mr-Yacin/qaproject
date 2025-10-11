/**
 * Test Executor
 * 
 * Handles the actual execution of individual tests with proper
 * error handling, timeout management, and result collection.
 */

import { TestDefinition, TestResult, TestStatus, TestError, ErrorType } from '../types/index';

export class TestExecutor {
  private activeTests = new Map<string, AbortController>();

  /**
   * Execute a single test with comprehensive error handling
   */
  async executeTest(test: TestDefinition): Promise<TestResult> {
    const startTime = new Date();
    const abortController = new AbortController();
    
    // Track active test for potential cancellation
    this.activeTests.set(test.id, abortController);
    
    try {
      // Create timeout promise
      const timeoutPromise = this.createTimeoutPromise(test.timeout || 30000);
      
      // Execute test with timeout
      const testPromise = this.executeTestWithTimeout(test, abortController.signal);
      
      // Race between test execution and timeout
      const result = await Promise.race([testPromise, timeoutPromise]);
      
      // Clean up
      this.activeTests.delete(test.id);
      
      return result;
      
    } catch (error) {
      this.activeTests.delete(test.id);
      
      return this.createFailedResult(test, startTime, error as Error);
    }
  }

  /**
   * Cancel a running test
   */
  cancelTest(testId: string): boolean {
    const controller = this.activeTests.get(testId);
    if (controller) {
      controller.abort();
      this.activeTests.delete(testId);
      return true;
    }
    return false;
  }

  /**
   * Get list of currently running tests
   */
  getRunningTests(): string[] {
    return Array.from(this.activeTests.keys());
  }

  /**
   * Execute test with timeout and cancellation support
   */
  private async executeTestWithTimeout(
    test: TestDefinition, 
    signal: AbortSignal
  ): Promise<TestResult> {
    const startTime = new Date();
    
    try {
      // Check if already cancelled
      if (signal.aborted) {
        throw new Error('Test execution was cancelled');
      }
      
      // Execute the test function
      const result = await test.execute();
      
      // Validate result structure
      this.validateTestResult(result, test);
      
      // Ensure proper timing information
      if (!result.endTime) {
        result.endTime = new Date();
      }
      
      if (!result.duration) {
        result.duration = result.endTime.getTime() - startTime.getTime();
      }
      
      return result;
      
    } catch (error) {
      if (signal.aborted) {
        return this.createCancelledResult(test, startTime);
      }
      
      throw error;
    }
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise(timeoutMs: number): Promise<TestResult> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Test execution timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }

  /**
   * Validate test result structure
   */
  private validateTestResult(result: TestResult, test: TestDefinition): void {
    if (!result.testName) {
      result.testName = test.name;
    }
    
    if (!result.category) {
      result.category = test.category;
    }
    
    if (!result.verificationLevel) {
      result.verificationLevel = test.verificationLevel;
    }
    
    if (!result.requirements) {
      result.requirements = test.requirements;
    }
    
    if (!result.startTime) {
      result.startTime = new Date();
    }
    
    if (!result.status) {
      result.status = TestStatus.PASSED; // Default to passed if not specified
    }
    
    if (!result.details) {
      result.details = {};
    }
  }

  /**
   * Create failed test result
   */
  private createFailedResult(
    test: TestDefinition, 
    startTime: Date, 
    error: Error
  ): TestResult {
    const endTime = new Date();
    
    return {
      testName: test.name,
      category: test.category,
      status: TestStatus.FAILED,
      duration: endTime.getTime() - startTime.getTime(),
      startTime,
      endTime,
      error: this.categorizeError(error),
      details: {
        errorDetails: {
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      },
      verificationLevel: test.verificationLevel,
      requirements: test.requirements
    };
  }

  /**
   * Create cancelled test result
   */
  private createCancelledResult(test: TestDefinition, startTime: Date): TestResult {
    const endTime = new Date();
    
    return {
      testName: test.name,
      category: test.category,
      status: TestStatus.SKIPPED,
      duration: endTime.getTime() - startTime.getTime(),
      startTime,
      endTime,
      error: {
        type: ErrorType.UNKNOWN_ERROR,
        message: 'Test execution was cancelled',
        code: 'CANCELLED'
      },
      details: {
        cancellationReason: 'Test execution was cancelled by user or timeout'
      },
      verificationLevel: test.verificationLevel,
      requirements: test.requirements
    };
  }

  /**
   * Categorize error by type for better reporting
   */
  private categorizeError(error: Error): TestError {
    let errorType = ErrorType.UNKNOWN_ERROR;
    let code: string | undefined;
    
    // Categorize based on error message or type
    if (error.message.includes('timeout')) {
      errorType = ErrorType.NETWORK_ERROR;
      code = 'TIMEOUT';
    } else if (error.message.includes('authentication') || error.message.includes('401')) {
      errorType = ErrorType.AUTHENTICATION_ERROR;
      code = 'AUTH_FAILED';
    } else if (error.message.includes('validation') || error.message.includes('400')) {
      errorType = ErrorType.VALIDATION_ERROR;
      code = 'VALIDATION_FAILED';
    } else if (error.message.includes('performance') || error.message.includes('slow')) {
      errorType = ErrorType.PERFORMANCE_ERROR;
      code = 'PERFORMANCE_ISSUE';
    } else if (error.message.includes('schema') || error.message.includes('database')) {
      errorType = ErrorType.SCHEMA_ERROR;
      code = 'SCHEMA_ISSUE';
    } else if (error.message.includes('security') || error.message.includes('403')) {
      errorType = ErrorType.SECURITY_ERROR;
      code = 'SECURITY_ISSUE';
    } else if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
      errorType = ErrorType.NETWORK_ERROR;
      code = 'NETWORK_ERROR';
    } else if (error.message.includes('data') || error.message.includes('integrity')) {
      errorType = ErrorType.DATA_INTEGRITY_ERROR;
      code = 'DATA_INTEGRITY_ISSUE';
    }
    
    return {
      type: errorType,
      message: error.message,
      stack: error.stack,
      code,
      details: {
        originalError: error.name,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Execute test with retry logic
   */
  async executeTestWithRetry(
    test: TestDefinition, 
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<TestResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        const result = await this.executeTest(test);
        
        // If test passed or it's not retryable, return result
        if (result.status === TestStatus.PASSED || !test.retryable) {
          return result;
        }
        
        // If this was the last attempt, return the failed result
        if (attempt === maxRetries + 1) {
          return result;
        }
        
        // Wait before retry
        await this.delay(retryDelay * attempt);
        
      } catch (error) {
        lastError = error as Error;
        
        // If this was the last attempt, create failed result
        if (attempt === maxRetries + 1) {
          return this.createFailedResult(test, new Date(), lastError);
        }
        
        // Wait before retry
        await this.delay(retryDelay * attempt);
      }
    }
    
    // This should never be reached, but just in case
    return this.createFailedResult(test, new Date(), lastError || new Error('Unknown error'));
  }

  /**
   * Execute multiple tests in parallel with concurrency limit
   */
  async executeTestsInParallel(
    tests: TestDefinition[], 
    maxConcurrency: number = 4
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const executing: Promise<TestResult>[] = [];
    
    for (const test of tests) {
      // Wait if we've reached max concurrency
      if (executing.length >= maxConcurrency) {
        const completed = await Promise.race(executing);
        results.push(completed);
        
        // Remove completed promise from executing array
        const index = executing.findIndex(async p => await p === completed);
        if (index !== -1) {
          executing.splice(index, 1);
        }
      }
      
      // Start new test execution
      const testPromise = this.executeTest(test);
      executing.push(testPromise);
    }
    
    // Wait for remaining tests to complete
    const remainingResults = await Promise.all(executing);
    results.push(...remainingResults);
    
    return results;
  }

  /**
   * Create delay promise
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get execution statistics
   */
  getExecutionStats(): ExecutionStats {
    return {
      activeTests: this.activeTests.size,
      runningTestIds: Array.from(this.activeTests.keys())
    };
  }
}

/**
 * Execution statistics interface
 */
export interface ExecutionStats {
  activeTests: number;
  runningTestIds: string[];
}