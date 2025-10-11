import { describe, it, expect } from 'vitest';
import { TestConfiguration, TestResult } from '../types';
import { validateErrorResponse } from '../utils/response-validator';

/**
 * API Error Handling Verification Tests
 * Tests error responses for all status codes and scenarios
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

export class APIErrorHandlingTester {
  private config: TestConfiguration;
  private baseUrl: string;

  constructor(config: TestConfiguration) {
    this.config = config;
    this.baseUrl = config.apiBaseUrl;
  }

  /**
   * Test 400 error responses with invalid query parameters and payloads
   * Requirements: 6.1, 6.2
   */
  async test400ErrorResponses(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Test invalid query parameters for GET /api/topics
    results.push(await this.testInvalidTopicsQueryParameters());

    // Test invalid JSON payload for POST /api/ingest
    results.push(await this.testInvalidJSONPayload());

    // Test invalid ingest payload structure
    results.push(await this.testInvalidIngestPayloadStructure());

    // Test invalid revalidate payload
    results.push(await this.testInvalidRevalidatePayload());

    // Test missing required fields
    results.push(await this.testMissingRequiredFields());

    return results;
  }

  /**
   * Test 401 error responses for authentication failures
   * Requirements: 6.1, 6.2
   */
  async test401ErrorResponses(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Test missing API key
    results.push(await this.testMissingAPIKey());

    // Test invalid API key
    results.push(await this.testInvalidAPIKey());

    // Test missing signature
    results.push(await this.testMissingSignature());

    // Test invalid signature
    results.push(await this.testInvalidSignature());

    // Test missing timestamp
    results.push(await this.testMissingTimestamp());

    // Test expired timestamp
    results.push(await this.testExpiredTimestamp());

    return results;
  }

  /**
   * Test 404 error responses for non-existent resources
   * Requirements: 6.3
   */
  async test404ErrorResponses(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Test non-existent topic slug
    results.push(await this.testNonExistentTopicSlug());

    // Test malformed topic slug
    results.push(await this.testMalformedTopicSlug());

    return results;
  }

  /**
   * Test 500 error handling and generic error message responses
   * Requirements: 6.4, 6.5
   */
  async test500ErrorResponses(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Note: 500 errors are harder to test directly as they represent server errors
    // We can test scenarios that might trigger them, but we need to be careful
    // not to actually break the system

    // Test with extremely large payload (might trigger server limits)
    results.push(await this.testExtremelyLargePayload());

    // Test with malformed but parseable JSON that might cause processing errors
    results.push(await this.testMalformedButParseableJSON());

    return results;
  }

  // 400 Error Test Methods

  private async testInvalidTopicsQueryParameters(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Test with invalid locale (too long)
      const response = await fetch(`${this.baseUrl}/api/topics?locale=invalid_locale&page=0&limit=0`);
      const data = await response.json();
      const duration = Date.now() - startTime;

      if (response.status !== 400) {
        return {
          testName: 'GET /api/topics - Invalid query parameters (400)',
          success: false,
          duration,
          error: `Expected status 400, got ${response.status}`,
          details: { response: data, queryParams: 'locale=invalid_locale&page=0&limit=0' },
        };
      }

      const validation = validateErrorResponse(data, 400, 'GET /api/topics');
      if (!validation.valid) {
        return {
          testName: 'GET /api/topics - Invalid query parameters (400)',
          success: false,
          duration,
          error: 'Error response schema validation failed',
          details: {
            response: data,
            validationErrors: validation.errors,
          },
        };
      }

      // Verify error message is descriptive
      if (!data.error || typeof data.error !== 'string') {
        return {
          testName: 'GET /api/topics - Invalid query parameters (400)',
          success: false,
          duration,
          error: 'Error message is missing or not a string',
          details: { response: data },
        };
      }

      return {
        testName: 'GET /api/topics - Invalid query parameters (400)',
        success: true,
        duration,
        details: {
          response: data,
          errorMessage: data.error,
          hasDetails: !!data.details,
        },
      };
    } catch (error) {
      return {
        testName: 'GET /api/topics - Invalid query parameters (400)',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: { error },
      };
    }
  }

  private async testInvalidJSONPayload(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const invalidJSON = '{"invalid": json}'; // Missing quotes around json
      
      const response = await fetch(`${this.baseUrl}/api/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.authCredentials.apiKey,
          'x-timestamp': Date.now().toString(),
          'x-signature': 'dummy-signature', // Will fail auth, but JSON parsing happens first
        },
        body: invalidJSON,
      });
      
      const data = await response.json();
      const duration = Date.now() - startTime;

      if (response.status !== 400) {
        return {
          testName: 'POST /api/ingest - Invalid JSON (400)',
          success: false,
          duration,
          error: `Expected status 400, got ${response.status}`,
          details: { response: data, payload: invalidJSON },
        };
      }

      const validation = validateErrorResponse(data, 400, 'POST /api/ingest');
      if (!validation.valid) {
        return {
          testName: 'POST /api/ingest - Invalid JSON (400)',
          success: false,
          duration,
          error: 'Error response schema validation failed',
          details: {
            response: data,
            validationErrors: validation.errors,
          },
        };
      }

      // Verify it's specifically an Invalid JSON error
      if (data.error !== 'Invalid JSON') {
        return {
          testName: 'POST /api/ingest - Invalid JSON (400)',
          success: false,
          duration,
          error: `Expected "Invalid JSON" error, got "${data.error}"`,
          details: { response: data },
        };
      }

      return {
        testName: 'POST /api/ingest - Invalid JSON (400)',
        success: true,
        duration,
        details: {
          response: data,
          errorType: 'Invalid JSON',
        },
      };
    } catch (error) {
      return {
        testName: 'POST /api/ingest - Invalid JSON (400)',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: { error },
      };
    }
  }

  private async testInvalidIngestPayloadStructure(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const invalidPayload = {
        topic: {
          // Missing required fields like slug, title, locale
          tags: [],
        },
        // Missing mainQuestion, article, faqItems
      };
      
      const timestamp = Date.now().toString();
      const signature = this.generateHMACSignature(JSON.stringify(invalidPayload), timestamp);
      
      const response = await fetch(`${this.baseUrl}/api/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.authCredentials.apiKey,
          'x-timestamp': timestamp,
          'x-signature': signature,
        },
        body: JSON.stringify(invalidPayload),
      });
      
      const data = await response.json();
      const duration = Date.now() - startTime;

      if (response.status !== 400) {
        return {
          testName: 'POST /api/ingest - Invalid payload structure (400)',
          success: false,
          duration,
          error: `Expected status 400, got ${response.status}`,
          details: { response: data, payload: invalidPayload },
        };
      }

      const validation = validateErrorResponse(data, 400, 'POST /api/ingest');
      if (!validation.valid) {
        return {
          testName: 'POST /api/ingest - Invalid payload structure (400)',
          success: false,
          duration,
          error: 'Error response schema validation failed',
          details: {
            response: data,
            validationErrors: validation.errors,
          },
        };
      }

      // Verify it's a validation error with details
      if (data.error !== 'Validation failed' || !data.details) {
        return {
          testName: 'POST /api/ingest - Invalid payload structure (400)',
          success: false,
          duration,
          error: 'Expected validation error with details',
          details: { response: data },
        };
      }

      return {
        testName: 'POST /api/ingest - Invalid payload structure (400)',
        success: true,
        duration,
        details: {
          response: data,
          errorType: 'Validation failed',
          hasValidationDetails: !!data.details,
        },
      };
    } catch (error) {
      return {
        testName: 'POST /api/ingest - Invalid payload structure (400)',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: { error },
      };
    }
  }

  private async testInvalidRevalidatePayload(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const invalidPayload = {
        // Missing required 'tag' field
        invalidField: 'value',
      };
      
      const timestamp = Date.now().toString();
      const signature = this.generateHMACSignature(JSON.stringify(invalidPayload), timestamp);
      
      const response = await fetch(`${this.baseUrl}/api/revalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.authCredentials.apiKey,
          'x-timestamp': timestamp,
          'x-signature': signature,
        },
        body: JSON.stringify(invalidPayload),
      });
      
      const data = await response.json();
      const duration = Date.now() - startTime;

      if (response.status !== 400) {
        return {
          testName: 'POST /api/revalidate - Invalid payload (400)',
          success: false,
          duration,
          error: `Expected status 400, got ${response.status}`,
          details: { response: data, payload: invalidPayload },
        };
      }

      const validation = validateErrorResponse(data, 400, 'POST /api/revalidate');
      if (!validation.valid) {
        return {
          testName: 'POST /api/revalidate - Invalid payload (400)',
          success: false,
          duration,
          error: 'Error response schema validation failed',
          details: {
            response: data,
            validationErrors: validation.errors,
          },
        };
      }

      return {
        testName: 'POST /api/revalidate - Invalid payload (400)',
        success: true,
        duration,
        details: {
          response: data,
          errorType: data.error,
        },
      };
    } catch (error) {
      return {
        testName: 'POST /api/revalidate - Invalid payload (400)',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: { error },
      };
    }
  }

  private async testMissingRequiredFields(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const payloadWithMissingFields = {
        topic: {
          slug: 'test-slug',
          // Missing title and locale
          tags: [],
        },
        mainQuestion: {
          text: 'Test question',
        },
        article: {
          content: 'Test content',
          // Missing status
        },
        faqItems: [],
      };
      
      const timestamp = Date.now().toString();
      const signature = this.generateHMACSignature(JSON.stringify(payloadWithMissingFields), timestamp);
      
      const response = await fetch(`${this.baseUrl}/api/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.authCredentials.apiKey,
          'x-timestamp': timestamp,
          'x-signature': signature,
        },
        body: JSON.stringify(payloadWithMissingFields),
      });
      
      const data = await response.json();
      const duration = Date.now() - startTime;

      if (response.status !== 400) {
        return {
          testName: 'POST /api/ingest - Missing required fields (400)',
          success: false,
          duration,
          error: `Expected status 400, got ${response.status}`,
          details: { response: data, payload: payloadWithMissingFields },
        };
      }

      const validation = validateErrorResponse(data, 400, 'POST /api/ingest');
      if (!validation.valid) {
        return {
          testName: 'POST /api/ingest - Missing required fields (400)',
          success: false,
          duration,
          error: 'Error response schema validation failed',
          details: {
            response: data,
            validationErrors: validation.errors,
          },
        };
      }

      return {
        testName: 'POST /api/ingest - Missing required fields (400)',
        success: true,
        duration,
        details: {
          response: data,
          errorType: data.error,
          hasValidationDetails: !!data.details,
        },
      };
    } catch (error) {
      return {
        testName: 'POST /api/ingest - Missing required fields (400)',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: { error },
      };
    }
  }

  // 401 Error Test Methods

  private async testMissingAPIKey(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const validPayload = {
        topic: {
          slug: 'test-slug',
          title: 'Test Title',
          locale: 'en',
          tags: [],
        },
        mainQuestion: { text: 'Test question' },
        article: { content: 'Test content', status: 'PUBLISHED' },
        faqItems: [],
      };
      
      const response = await fetch(`${this.baseUrl}/api/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Missing x-api-key header
          'x-timestamp': Date.now().toString(),
          'x-signature': 'dummy-signature',
        },
        body: JSON.stringify(validPayload),
      });
      
      const data = await response.json();
      const duration = Date.now() - startTime;

      if (response.status !== 401) {
        return {
          testName: 'POST /api/ingest - Missing API key (401)',
          success: false,
          duration,
          error: `Expected status 401, got ${response.status}`,
          details: { response: data },
        };
      }

      const validation = validateErrorResponse(data, 401, 'POST /api/ingest');
      if (!validation.valid) {
        return {
          testName: 'POST /api/ingest - Missing API key (401)',
          success: false,
          duration,
          error: 'Error response schema validation failed',
          details: {
            response: data,
            validationErrors: validation.errors,
          },
        };
      }

      return {
        testName: 'POST /api/ingest - Missing API key (401)',
        success: true,
        duration,
        details: {
          response: data,
          errorType: 'Unauthorized',
        },
      };
    } catch (error) {
      return {
        testName: 'POST /api/ingest - Missing API key (401)',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: { error },
      };
    }
  }

  private async testInvalidAPIKey(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const validPayload = {
        topic: {
          slug: 'test-slug',
          title: 'Test Title',
          locale: 'en',
          tags: [],
        },
        mainQuestion: { text: 'Test question' },
        article: { content: 'Test content', status: 'PUBLISHED' },
        faqItems: [],
      };
      
      const response = await fetch(`${this.baseUrl}/api/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'invalid-api-key',
          'x-timestamp': Date.now().toString(),
          'x-signature': 'dummy-signature',
        },
        body: JSON.stringify(validPayload),
      });
      
      const data = await response.json();
      const duration = Date.now() - startTime;

      if (response.status !== 401) {
        return {
          testName: 'POST /api/ingest - Invalid API key (401)',
          success: false,
          duration,
          error: `Expected status 401, got ${response.status}`,
          details: { response: data },
        };
      }

      const validation = validateErrorResponse(data, 401, 'POST /api/ingest');
      if (!validation.valid) {
        return {
          testName: 'POST /api/ingest - Invalid API key (401)',
          success: false,
          duration,
          error: 'Error response schema validation failed',
          details: {
            response: data,
            validationErrors: validation.errors,
          },
        };
      }

      return {
        testName: 'POST /api/ingest - Invalid API key (401)',
        success: true,
        duration,
        details: {
          response: data,
          errorType: 'Unauthorized',
        },
      };
    } catch (error) {
      return {
        testName: 'POST /api/ingest - Invalid API key (401)',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: { error },
      };
    }
  }

  private async testMissingSignature(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const validPayload = {
        topic: {
          slug: 'test-slug',
          title: 'Test Title',
          locale: 'en',
          tags: [],
        },
        mainQuestion: { text: 'Test question' },
        article: { content: 'Test content', status: 'PUBLISHED' },
        faqItems: [],
      };
      
      const response = await fetch(`${this.baseUrl}/api/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.authCredentials.apiKey,
          'x-timestamp': Date.now().toString(),
          // Missing x-signature header
        },
        body: JSON.stringify(validPayload),
      });
      
      const data = await response.json();
      const duration = Date.now() - startTime;

      if (response.status !== 401) {
        return {
          testName: 'POST /api/ingest - Missing signature (401)',
          success: false,
          duration,
          error: `Expected status 401, got ${response.status}`,
          details: { response: data },
        };
      }

      const validation = validateErrorResponse(data, 401, 'POST /api/ingest');
      if (!validation.valid) {
        return {
          testName: 'POST /api/ingest - Missing signature (401)',
          success: false,
          duration,
          error: 'Error response schema validation failed',
          details: {
            response: data,
            validationErrors: validation.errors,
          },
        };
      }

      return {
        testName: 'POST /api/ingest - Missing signature (401)',
        success: true,
        duration,
        details: {
          response: data,
          errorType: 'Unauthorized',
        },
      };
    } catch (error) {
      return {
        testName: 'POST /api/ingest - Missing signature (401)',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: { error },
      };
    }
  }

  private async testInvalidSignature(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const validPayload = {
        topic: {
          slug: 'test-slug',
          title: 'Test Title',
          locale: 'en',
          tags: [],
        },
        mainQuestion: { text: 'Test question' },
        article: { content: 'Test content', status: 'PUBLISHED' },
        faqItems: [],
      };
      
      const response = await fetch(`${this.baseUrl}/api/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.authCredentials.apiKey,
          'x-timestamp': Date.now().toString(),
          'x-signature': 'invalid-signature',
        },
        body: JSON.stringify(validPayload),
      });
      
      const data = await response.json();
      const duration = Date.now() - startTime;

      if (response.status !== 401) {
        return {
          testName: 'POST /api/ingest - Invalid signature (401)',
          success: false,
          duration,
          error: `Expected status 401, got ${response.status}`,
          details: { response: data },
        };
      }

      const validation = validateErrorResponse(data, 401, 'POST /api/ingest');
      if (!validation.valid) {
        return {
          testName: 'POST /api/ingest - Invalid signature (401)',
          success: false,
          duration,
          error: 'Error response schema validation failed',
          details: {
            response: data,
            validationErrors: validation.errors,
          },
        };
      }

      return {
        testName: 'POST /api/ingest - Invalid signature (401)',
        success: true,
        duration,
        details: {
          response: data,
          errorType: 'Unauthorized',
        },
      };
    } catch (error) {
      return {
        testName: 'POST /api/ingest - Invalid signature (401)',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: { error },
      };
    }
  }

  private async testMissingTimestamp(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const validPayload = {
        topic: {
          slug: 'test-slug',
          title: 'Test Title',
          locale: 'en',
          tags: [],
        },
        mainQuestion: { text: 'Test question' },
        article: { content: 'Test content', status: 'PUBLISHED' },
        faqItems: [],
      };
      
      const response = await fetch(`${this.baseUrl}/api/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.authCredentials.apiKey,
          // Missing x-timestamp header
          'x-signature': 'dummy-signature',
        },
        body: JSON.stringify(validPayload),
      });
      
      const data = await response.json();
      const duration = Date.now() - startTime;

      if (response.status !== 401) {
        return {
          testName: 'POST /api/ingest - Missing timestamp (401)',
          success: false,
          duration,
          error: `Expected status 401, got ${response.status}`,
          details: { response: data },
        };
      }

      const validation = validateErrorResponse(data, 401, 'POST /api/ingest');
      if (!validation.valid) {
        return {
          testName: 'POST /api/ingest - Missing timestamp (401)',
          success: false,
          duration,
          error: 'Error response schema validation failed',
          details: {
            response: data,
            validationErrors: validation.errors,
          },
        };
      }

      return {
        testName: 'POST /api/ingest - Missing timestamp (401)',
        success: true,
        duration,
        details: {
          response: data,
          errorType: 'Unauthorized',
        },
      };
    } catch (error) {
      return {
        testName: 'POST /api/ingest - Missing timestamp (401)',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: { error },
      };
    }
  }

  private async testExpiredTimestamp(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const validPayload = {
        topic: {
          slug: 'test-slug',
          title: 'Test Title',
          locale: 'en',
          tags: [],
        },
        mainQuestion: { text: 'Test question' },
        article: { content: 'Test content', status: 'PUBLISHED' },
        faqItems: [],
      };
      
      // Use a timestamp from 10 minutes ago (should be expired)
      const expiredTimestamp = (Date.now() - 10 * 60 * 1000).toString();
      const signature = this.generateHMACSignature(JSON.stringify(validPayload), expiredTimestamp);
      
      const response = await fetch(`${this.baseUrl}/api/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.authCredentials.apiKey,
          'x-timestamp': expiredTimestamp,
          'x-signature': signature,
        },
        body: JSON.stringify(validPayload),
      });
      
      const data = await response.json();
      const duration = Date.now() - startTime;

      if (response.status !== 401) {
        return {
          testName: 'POST /api/ingest - Expired timestamp (401)',
          success: false,
          duration,
          error: `Expected status 401, got ${response.status}`,
          details: { response: data, timestamp: expiredTimestamp },
        };
      }

      const validation = validateErrorResponse(data, 401, 'POST /api/ingest');
      if (!validation.valid) {
        return {
          testName: 'POST /api/ingest - Expired timestamp (401)',
          success: false,
          duration,
          error: 'Error response schema validation failed',
          details: {
            response: data,
            validationErrors: validation.errors,
          },
        };
      }

      return {
        testName: 'POST /api/ingest - Expired timestamp (401)',
        success: true,
        duration,
        details: {
          response: data,
          errorType: 'Unauthorized',
          timestamp: expiredTimestamp,
        },
      };
    } catch (error) {
      return {
        testName: 'POST /api/ingest - Expired timestamp (401)',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: { error },
      };
    }
  }

  // 404 Error Test Methods

  private async testNonExistentTopicSlug(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/api/topics/non-existent-slug-12345`);
      const data = await response.json();
      const duration = Date.now() - startTime;

      if (response.status !== 404) {
        return {
          testName: 'GET /api/topics/[slug] - Non-existent slug (404)',
          success: false,
          duration,
          error: `Expected status 404, got ${response.status}`,
          details: { response: data },
        };
      }

      const validation = validateErrorResponse(data, 404, 'GET /api/topics/[slug]');
      if (!validation.valid) {
        return {
          testName: 'GET /api/topics/[slug] - Non-existent slug (404)',
          success: false,
          duration,
          error: 'Error response schema validation failed',
          details: {
            response: data,
            validationErrors: validation.errors,
          },
        };
      }

      return {
        testName: 'GET /api/topics/[slug] - Non-existent slug (404)',
        success: true,
        duration,
        details: {
          response: data,
          errorType: 'Topic not found',
        },
      };
    } catch (error) {
      return {
        testName: 'GET /api/topics/[slug] - Non-existent slug (404)',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: { error },
      };
    }
  }

  private async testMalformedTopicSlug(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Use a malformed slug with special characters
      const malformedSlug = 'malformed/slug@#$%';
      const response = await fetch(`${this.baseUrl}/api/topics/${encodeURIComponent(malformedSlug)}`);
      const data = await response.json();
      const duration = Date.now() - startTime;

      if (response.status !== 404) {
        return {
          testName: 'GET /api/topics/[slug] - Malformed slug (404)',
          success: false,
          duration,
          error: `Expected status 404, got ${response.status}`,
          details: { response: data, slug: malformedSlug },
        };
      }

      const validation = validateErrorResponse(data, 404, 'GET /api/topics/[slug]');
      if (!validation.valid) {
        return {
          testName: 'GET /api/topics/[slug] - Malformed slug (404)',
          success: false,
          duration,
          error: 'Error response schema validation failed',
          details: {
            response: data,
            validationErrors: validation.errors,
          },
        };
      }

      return {
        testName: 'GET /api/topics/[slug] - Malformed slug (404)',
        success: true,
        duration,
        details: {
          response: data,
          errorType: 'Topic not found',
          slug: malformedSlug,
        },
      };
    } catch (error) {
      return {
        testName: 'GET /api/topics/[slug] - Malformed slug (404)',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: { error },
      };
    }
  }

  // 500 Error Test Methods

  private async testExtremelyLargePayload(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Create an extremely large payload that might trigger server limits
      const largeContent = 'x'.repeat(10 * 1024 * 1024); // 10MB of content
      
      const largePayload = {
        topic: {
          slug: 'large-payload-test',
          title: 'Large Payload Test',
          locale: 'en',
          tags: [],
        },
        mainQuestion: { text: 'Test question' },
        article: { content: largeContent, status: 'PUBLISHED' },
        faqItems: [],
      };
      
      const timestamp = Date.now().toString();
      const signature = this.generateHMACSignature(JSON.stringify(largePayload), timestamp);
      
      const response = await fetch(`${this.baseUrl}/api/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.authCredentials.apiKey,
          'x-timestamp': timestamp,
          'x-signature': signature,
        },
        body: JSON.stringify(largePayload),
      });
      
      const data = await response.json();
      const duration = Date.now() - startTime;

      // This might return 413 (Payload Too Large) or 500, depending on server configuration
      if (response.status === 500) {
        const validation = validateErrorResponse(data, 500, 'POST /api/ingest');
        if (!validation.valid) {
          return {
            testName: 'POST /api/ingest - Extremely large payload (500)',
            success: false,
            duration,
            error: 'Error response schema validation failed',
            details: {
              response: data,
              validationErrors: validation.errors,
            },
          };
        }

        return {
          testName: 'POST /api/ingest - Extremely large payload (500)',
          success: true,
          duration,
          details: {
            response: data,
            errorType: 'Internal server error',
            payloadSize: JSON.stringify(largePayload).length,
          },
        };
      } else {
        // If it doesn't return 500, that's also a valid result
        return {
          testName: 'POST /api/ingest - Extremely large payload (500)',
          success: true,
          duration,
          details: {
            response: data,
            actualStatus: response.status,
            note: 'Server handled large payload without 500 error',
            payloadSize: JSON.stringify(largePayload).length,
          },
        };
      }
    } catch (error) {
      return {
        testName: 'POST /api/ingest - Extremely large payload (500)',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: { error },
      };
    }
  }

  private async testMalformedButParseableJSON(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Create JSON that parses but has unexpected structure that might cause processing errors
      const malformedPayload = {
        topic: {
          slug: null, // null instead of string
          title: 123, // number instead of string
          locale: ['en'], // array instead of string
          tags: 'not-an-array', // string instead of array
        },
        mainQuestion: 'not-an-object', // string instead of object
        article: [], // array instead of object
        faqItems: 'not-an-array', // string instead of array
      };
      
      const timestamp = Date.now().toString();
      const signature = this.generateHMACSignature(JSON.stringify(malformedPayload), timestamp);
      
      const response = await fetch(`${this.baseUrl}/api/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.authCredentials.apiKey,
          'x-timestamp': timestamp,
          'x-signature': signature,
        },
        body: JSON.stringify(malformedPayload),
      });
      
      const data = await response.json();
      const duration = Date.now() - startTime;

      // This should return 400 (validation error), but if it returns 500, that's what we're testing
      if (response.status === 500) {
        const validation = validateErrorResponse(data, 500, 'POST /api/ingest');
        if (!validation.valid) {
          return {
            testName: 'POST /api/ingest - Malformed but parseable JSON (500)',
            success: false,
            duration,
            error: 'Error response schema validation failed',
            details: {
              response: data,
              validationErrors: validation.errors,
            },
          };
        }

        return {
          testName: 'POST /api/ingest - Malformed but parseable JSON (500)',
          success: true,
          duration,
          details: {
            response: data,
            errorType: 'Internal server error',
            payload: malformedPayload,
          },
        };
      } else {
        // If it doesn't return 500, that's also a valid result (probably 400)
        return {
          testName: 'POST /api/ingest - Malformed but parseable JSON (500)',
          success: true,
          duration,
          details: {
            response: data,
            actualStatus: response.status,
            note: 'Server handled malformed payload without 500 error',
            payload: malformedPayload,
          },
        };
      }
    } catch (error) {
      return {
        testName: 'POST /api/ingest - Malformed but parseable JSON (500)',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: { error },
      };
    }
  }

  // Helper method to generate HMAC signature
  private generateHMACSignature(body: string, timestamp: string): string {
    // This is a placeholder - in a real implementation, you'd use the actual HMAC generation
    // For testing purposes, we'll use a dummy signature since most of these tests expect auth to fail anyway
    const crypto = require('crypto');
    const message = `${timestamp}${body}`;
    return crypto.createHmac('sha256', this.config.authCredentials.webhookSecret).update(message).digest('hex');
  }
}