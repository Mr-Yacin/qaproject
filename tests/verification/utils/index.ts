/**
 * Base test utilities and helper functions
 */

import crypto from 'crypto';
import { TestResult, TestStatus, TestError, ErrorType, TestCategory, VerificationLevel } from '../types';

/**
 * HMAC signature generation utility
 */
export class HMACUtils {
  static generateSignature(
    payload: string, 
    secret: string, 
    timestamp: number,
    algorithm: 'sha256' | 'sha512' = 'sha256'
  ): string {
    const message = `${timestamp}.${payload}`;
    return crypto
      .createHmac(algorithm, secret)
      .update(message)
      .digest('hex');
  }

  static generateTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }

  static isTimestampValid(timestamp: number, toleranceSeconds: number = 300): boolean {
    const now = Math.floor(Date.now() / 1000);
    const diff = Math.abs(now - timestamp);
    return diff <= toleranceSeconds;
  }

  static createAuthHeaders(
    payload: string,
    secret: string,
    timestampHeader: string = 'X-Timestamp',
    signatureHeader: string = 'X-Signature'
  ): Record<string, string> {
    const timestamp = this.generateTimestamp();
    const signature = this.generateSignature(payload, secret, timestamp);
    
    return {
      [timestampHeader]: timestamp.toString(),
      [signatureHeader]: signature,
      'Content-Type': 'application/json',
    };
  }
}

/**
 * Test result builder utility
 */
export class TestResultBuilder {
  private result: Partial<TestResult>;

  constructor(testName: string, category: TestCategory) {
    this.result = {
      testName,
      category,
      status: TestStatus.NOT_STARTED,
      duration: 0,
      startTime: new Date(),
      details: {},
      verificationLevel: VerificationLevel.MEDIUM,
      requirements: [],
    };
  }

  setVerificationLevel(level: VerificationLevel): this {
    this.result.verificationLevel = level;
    return this;
  }

  setRequirements(requirements: string[]): this {
    this.result.requirements = requirements;
    return this;
  }

  setStatus(status: TestStatus): this {
    this.result.status = status;
    return this;
  }

  setDuration(duration: number): this {
    this.result.duration = duration;
    return this;
  }

  setEndTime(endTime: Date): this {
    this.result.endTime = endTime;
    return this;
  }

  setError(error: TestError): this {
    this.result.error = error;
    this.result.status = TestStatus.FAILED;
    return this;
  }

  setRequest(request: any): this {
    if (!this.result.details) {
      this.result.details = {};
    }
    this.result.details.request = request;
    return this;
  }

  setResponse(response: any): this {
    if (!this.result.details) {
      this.result.details = {};
    }
    this.result.details.response = response;
    return this;
  }

  setValidationErrors(errors: string[]): this {
    if (!this.result.details) {
      this.result.details = {};
    }
    this.result.details.validationErrors = errors;
    return this;
  }

  build(): TestResult {
    if (!this.result.endTime) {
      this.result.endTime = new Date();
    }
    
    if (this.result.duration === 0) {
      this.result.duration = this.result.endTime.getTime() - this.result.startTime!.getTime();
    }

    return this.result as TestResult;
  }
}

/**
 * Error handling utilities
 */
export class ErrorUtils {
  static createTestError(
    type: ErrorType,
    message: string,
    details?: Record<string, any>,
    originalError?: Error
  ): TestError {
    return {
      type,
      message,
      details,
      stack: originalError?.stack,
      code: (originalError as any)?.code,
    };
  }

  static categorizeError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    const code = (error as any).code;

    // Network errors
    if (code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'ETIMEDOUT') {
      return ErrorType.NETWORK_ERROR;
    }

    // Authentication errors
    if (message.includes('unauthorized') || message.includes('authentication') || message.includes('signature')) {
      return ErrorType.AUTHENTICATION_ERROR;
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return ErrorType.VALIDATION_ERROR;
    }

    // Performance errors
    if (message.includes('timeout') || message.includes('slow') || message.includes('performance')) {
      return ErrorType.PERFORMANCE_ERROR;
    }

    // Schema errors
    if (message.includes('schema') || message.includes('database') || message.includes('migration')) {
      return ErrorType.SCHEMA_ERROR;
    }

    // Security errors
    if (message.includes('security') || message.includes('vulnerability') || message.includes('attack')) {
      return ErrorType.SECURITY_ERROR;
    }

    return ErrorType.UNKNOWN_ERROR;
  }
}

/**
 * HTTP client utilities for API testing
 */
export class HTTPUtils {
  static async makeRequest(
    url: string,
    options: {
      method?: string;
      headers?: Record<string, string>;
      body?: any;
      timeout?: number;
    } = {}
  ): Promise<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: any;
    responseTime: number;
  }> {
    const startTime = Date.now();
    
    const requestOptions: RequestInit = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    if (options.body && (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH')) {
      requestOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }

    // Add timeout if specified
    if (options.timeout) {
      const controller = new AbortController();
      requestOptions.signal = controller.signal;
      setTimeout(() => controller.abort(), options.timeout);
    }

    try {
      const response = await fetch(url, requestOptions);
      const responseTime = Date.now() - startTime;
      
      let body: any;
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        body = await response.json();
      } else {
        body = await response.text();
      }

      // Convert Headers to plain object
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      return {
        status: response.status,
        statusText: response.statusText,
        headers,
        body,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      throw new Error(`HTTP request failed: ${error instanceof Error ? error.message : 'Unknown error'} (${responseTime}ms)`);
    }
  }

  static isSuccessStatus(status: number): boolean {
    return status >= 200 && status < 300;
  }

  static isClientError(status: number): boolean {
    return status >= 400 && status < 500;
  }

  static isServerError(status: number): boolean {
    return status >= 500 && status < 600;
  }
}

/**
 * Data validation utilities
 */
export class ValidationUtils {
  static validateSchema(data: any, schema: any): { valid: boolean; errors: string[] } {
    // This is a simplified schema validation
    // In a real implementation, you would use a library like Zod or Joi
    const errors: string[] = [];
    
    if (!schema || typeof schema !== 'object') {
      return { valid: true, errors: [] };
    }

    // Check required fields
    if (schema.required && Array.isArray(schema.required)) {
      for (const field of schema.required) {
        if (!(field in data)) {
          errors.push(`Required field '${field}' is missing`);
        }
      }
    }

    // Check field types
    if (schema.properties && typeof schema.properties === 'object') {
      for (const [field, fieldSchema] of Object.entries(schema.properties)) {
        if (field in data) {
          const fieldValue = data[field];
          const expectedType = (fieldSchema as any).type;
          
          if (expectedType && !this.isValidType(fieldValue, expectedType)) {
            errors.push(`Field '${field}' has invalid type. Expected: ${expectedType}, Got: ${typeof fieldValue}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private static isValidType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'null':
        return value === null;
      default:
        return true; // Unknown type, assume valid
    }
  }

  static validateRequiredFields(data: any, requiredFields: string[]): string[] {
    const errors: string[] = [];
    
    for (const field of requiredFields) {
      if (!(field in data) || data[field] === null || data[field] === undefined) {
        errors.push(`Required field '${field}' is missing or null`);
      }
    }
    
    return errors;
  }

  static validateOptionalFields(data: any, optionalFields: string[]): string[] {
    const errors: string[] = [];
    
    // For optional fields, we just check if they exist and have valid values when present
    for (const field of optionalFields) {
      if (field in data && (data[field] === null || data[field] === undefined)) {
        // Optional field is present but null/undefined - this might be intentional
        // We'll just log it as a warning, not an error
      }
    }
    
    return errors;
  }
}

/**
 * Performance measurement utilities
 */
export class PerformanceUtils {
  static measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    return new Promise(async (resolve, reject) => {
      const startTime = Date.now();
      
      try {
        const result = await fn();
        const duration = Date.now() - startTime;
        resolve({ result, duration });
      } catch (error) {
        const duration = Date.now() - startTime;
        reject(new Error(`Execution failed after ${duration}ms: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }

  static async measureMemoryUsage(): Promise<{ used: number; total: number }> {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        used: usage.heapUsed,
        total: usage.heapTotal,
      };
    }
    
    // Fallback for browser environments
    return { used: 0, total: 0 };
  }

  static calculateThroughput(requests: number, durationMs: number): number {
    return (requests / durationMs) * 1000; // requests per second
  }
}

/**
 * Test data generation utilities
 */
export class TestDataUtils {
  static generateRandomString(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static generateRandomEmail(): string {
    return `test-${this.generateRandomString(8)}@example.com`;
  }

  static generateRandomUrl(): string {
    return `https://example.com/${this.generateRandomString(10)}`;
  }

  static generateTestTopic(overrides: Partial<any> = {}): any {
    return {
      slug: `test-topic-${this.generateRandomString(8)}`,
      title: `Test Topic ${this.generateRandomString(5)}`,
      locale: 'en',
      tags: ['test', 'generated'],
      thumbnailUrl: this.generateRandomUrl(),
      seoTitle: `SEO Title ${this.generateRandomString(10)}`,
      seoDescription: `SEO Description ${this.generateRandomString(20)}`,
      seoKeywords: ['test', 'seo', 'generated'],
      mainQuestion: `What is ${this.generateRandomString(10)}?`,
      ...overrides,
    };
  }
}

/**
 * Retry utilities for flaky tests
 */
export class RetryUtils {
  static async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000,
    exponentialBackoff: boolean = true
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        const delay = exponentialBackoff ? delayMs * Math.pow(2, attempt) : delayMs;
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// All utilities are already exported as classes above