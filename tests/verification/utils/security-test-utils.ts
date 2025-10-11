/**
 * Security test utilities for HMAC signature generation, timestamp manipulation,
 * and request tampering simulation
 * 
 * Requirements: 4.1, 4.2, 4.3
 */

import crypto from 'crypto';
import { generateSignature } from '@/lib/security/hmac';

export interface SecurityTestCredentials {
  apiKey: string;
  webhookSecret: string;
}

export type SecurityTestHeaders = Record<string, string> & {
  'x-api-key': string;
  'x-timestamp': string;
  'x-signature': string;
  'content-type': string;
}

export interface TamperedRequest {
  headers: SecurityTestHeaders;
  body: string;
  tamperType: 'body' | 'timestamp' | 'signature' | 'apiKey';
  description: string;
}

/**
 * HMAC signature generation utilities for testing
 */
export class HMACTestUtils {
  public credentials: SecurityTestCredentials;

  constructor(credentials: SecurityTestCredentials) {
    this.credentials = credentials;
  }

  /**
   * Generate valid HMAC signature for testing
   * @param timestamp - Unix timestamp as string
   * @param rawBody - Raw request body
   * @returns HMAC-SHA256 signature
   */
  generateValidSignature(timestamp: string, rawBody: string): string {
    const message = `${timestamp}.${rawBody}`;
    const hmac = crypto.createHmac('sha256', this.credentials.webhookSecret);
    hmac.update(message);
    return hmac.digest('hex');
  }

  /**
   * Generate invalid HMAC signature for testing failure scenarios
   * @param timestamp - Unix timestamp as string
   * @param rawBody - Raw request body
   * @returns Invalid HMAC signature
   */
  generateInvalidSignature(timestamp: string, rawBody: string): string {
    // Use wrong secret to generate invalid signature
    const wrongSecret = this.credentials.webhookSecret + '_wrong';
    const message = `${timestamp}.${rawBody}`;
    const hmac = crypto.createHmac('sha256', wrongSecret);
    hmac.update(message);
    return hmac.digest('hex');
  }

  /**
   * Generate signature with wrong algorithm for testing
   * @param timestamp - Unix timestamp as string
   * @param rawBody - Raw request body
   * @returns Signature using wrong algorithm
   */
  generateWrongAlgorithmSignature(timestamp: string, rawBody: string): string {
    const message = `${timestamp}.${rawBody}`;
    const hmac = crypto.createHmac('sha1', this.credentials.webhookSecret); // Wrong algorithm
    hmac.update(message);
    return hmac.digest('hex');
  }

  /**
   * Generate signature with tampered message format
   * @param timestamp - Unix timestamp as string
   * @param rawBody - Raw request body
   * @returns Signature with wrong message format
   */
  generateTamperedFormatSignature(timestamp: string, rawBody: string): string {
    // Wrong message format (missing dot separator)
    const message = `${timestamp}${rawBody}`;
    const hmac = crypto.createHmac('sha256', this.credentials.webhookSecret);
    hmac.update(message);
    return hmac.digest('hex');
  }

  /**
   * Create complete valid security headers
   * @param body - Request body object
   * @param customTimestamp - Optional custom timestamp
   * @returns Complete security headers
   */
  createValidHeaders(body: any, customTimestamp?: number): SecurityTestHeaders {
    const timestamp = customTimestamp ? customTimestamp.toString() : Date.now().toString();
    const rawBody = JSON.stringify(body);
    const signature = this.generateValidSignature(timestamp, rawBody);

    return {
      'x-api-key': this.credentials.apiKey,
      'x-timestamp': timestamp,
      'x-signature': signature,
      'content-type': 'application/json'
    };
  }
}

/**
 * Timestamp manipulation utilities for testing edge cases
 */
export class TimestampTestUtils {
  /**
   * Generate current timestamp
   */
  static getCurrentTimestamp(): number {
    return Date.now();
  }

  /**
   * Generate expired timestamp (older than 5 minutes)
   * @param minutesAgo - How many minutes ago (default: 6)
   */
  static getExpiredTimestamp(minutesAgo: number = 6): number {
    return Date.now() - (minutesAgo * 60 * 1000);
  }

  /**
   * Generate future timestamp (more than 5 minutes ahead)
   * @param minutesAhead - How many minutes ahead (default: 6)
   */
  static getFutureTimestamp(minutesAhead: number = 6): number {
    return Date.now() + (minutesAhead * 60 * 1000);
  }

  /**
   * Generate timestamp at the edge of validity (4 minutes 59 seconds ago)
   */
  static getEdgeValidTimestamp(): number {
    return Date.now() - (4 * 60 * 1000 + 59 * 1000); // 4:59 ago
  }

  /**
   * Generate timestamp just outside validity (5 minutes 1 second ago)
   */
  static getEdgeInvalidTimestamp(): number {
    return Date.now() - (5 * 60 * 1000 + 1 * 1000); // 5:01 ago
  }

  /**
   * Generate malformed timestamp strings for testing
   */
  static getMalformedTimestamps(): string[] {
    return [
      'not-a-number',
      '12.34', // Float
      '1234567890123456789012345', // Too large
      '-1234567890', // Negative
      '', // Empty
      'null',
      'undefined',
      '0x123', // Hex
      '1e10', // Scientific notation
    ];
  }

  /**
   * Generate edge case timestamp values
   */
  static getEdgeCaseTimestamps(): number[] {
    return [
      0, // Unix epoch
      1, // Very small positive
      -1, // Negative
      Number.MAX_SAFE_INTEGER, // Maximum safe integer
      Number.MIN_SAFE_INTEGER, // Minimum safe integer
    ];
  }
}

/**
 * Request tampering simulation utilities
 */
export class RequestTamperingUtils {
  private hmacUtils: HMACTestUtils;

  constructor(credentials: SecurityTestCredentials) {
    this.hmacUtils = new HMACTestUtils(credentials);
  }

  /**
   * Create request with tampered body (signature won't match)
   * @param originalBody - Original request body
   * @param timestamp - Request timestamp
   */
  createTamperedBodyRequest(originalBody: any, timestamp?: number): TamperedRequest {
    const ts = timestamp ? timestamp.toString() : Date.now().toString();
    const originalRawBody = JSON.stringify(originalBody);
    
    // Create tampered body
    const tamperedBody = { ...originalBody, maliciousField: 'injected_data' };
    const tamperedRawBody = JSON.stringify(tamperedBody);
    
    // Generate signature for original body (will be invalid for tampered body)
    const signature = this.hmacUtils.generateValidSignature(ts, originalRawBody);

    return {
      headers: {
        'x-api-key': this.hmacUtils.credentials.apiKey,
        'x-timestamp': ts,
        'x-signature': signature,
        'content-type': 'application/json'
      },
      body: tamperedRawBody,
      tamperType: 'body',
      description: 'Request body modified after signature generation'
    };
  }

  /**
   * Create request with tampered timestamp (signature won't match)
   * @param body - Request body
   * @param originalTimestamp - Original timestamp used for signature
   * @param tamperedTimestamp - Tampered timestamp in headers
   */
  createTamperedTimestampRequest(
    body: any, 
    originalTimestamp: number, 
    tamperedTimestamp: number
  ): TamperedRequest {
    const rawBody = JSON.stringify(body);
    
    // Generate signature with original timestamp
    const signature = this.hmacUtils.generateValidSignature(originalTimestamp.toString(), rawBody);

    return {
      headers: {
        'x-api-key': this.hmacUtils.credentials.apiKey,
        'x-timestamp': tamperedTimestamp.toString(), // Different timestamp
        'x-signature': signature,
        'content-type': 'application/json'
      },
      body: rawBody,
      tamperType: 'timestamp',
      description: 'Timestamp modified after signature generation'
    };
  }

  /**
   * Create request with tampered signature
   * @param body - Request body
   * @param timestamp - Request timestamp
   */
  createTamperedSignatureRequest(body: any, timestamp?: number): TamperedRequest {
    const ts = timestamp ? timestamp.toString() : Date.now().toString();
    const rawBody = JSON.stringify(body);
    
    // Generate valid signature then tamper with it
    const validSignature = this.hmacUtils.generateValidSignature(ts, rawBody);
    const tamperedSignature = validSignature.slice(0, -4) + '0000'; // Change last 4 chars

    return {
      headers: {
        'x-api-key': this.hmacUtils.credentials.apiKey,
        'x-timestamp': ts,
        'x-signature': tamperedSignature,
        'content-type': 'application/json'
      },
      body: rawBody,
      tamperType: 'signature',
      description: 'Signature manually tampered with'
    };
  }

  /**
   * Create request with tampered API key
   * @param body - Request body
   * @param timestamp - Request timestamp
   */
  createTamperedApiKeyRequest(body: any, timestamp?: number): TamperedRequest {
    const ts = timestamp ? timestamp.toString() : Date.now().toString();
    const rawBody = JSON.stringify(body);
    
    // Generate valid signature with correct API key
    const signature = this.hmacUtils.generateValidSignature(ts, rawBody);
    
    // Use wrong API key
    const tamperedApiKey = this.hmacUtils.credentials.apiKey + '_wrong';

    return {
      headers: {
        'x-api-key': tamperedApiKey,
        'x-timestamp': ts,
        'x-signature': signature,
        'content-type': 'application/json'
      },
      body: rawBody,
      tamperType: 'apiKey',
      description: 'API key modified'
    };
  }

  /**
   * Generate various tampering scenarios for comprehensive testing
   * @param body - Base request body
   */
  generateTamperingScenarios(body: any): TamperedRequest[] {
    const timestamp = Date.now();
    
    return [
      this.createTamperedBodyRequest(body, timestamp),
      this.createTamperedTimestampRequest(body, timestamp, timestamp + 1000),
      this.createTamperedSignatureRequest(body, timestamp),
      this.createTamperedApiKeyRequest(body, timestamp),
    ];
  }
}

/**
 * Replay attack simulation utilities
 */
export class ReplayAttackUtils {
  private hmacUtils: HMACTestUtils;

  constructor(credentials: SecurityTestCredentials) {
    this.hmacUtils = new HMACTestUtils(credentials);
  }

  /**
   * Create identical requests for replay attack testing
   * @param body - Request body
   * @param timestamp - Fixed timestamp for replay
   * @param count - Number of identical requests to generate
   */
  createReplayRequests(body: any, timestamp: number, count: number = 2): SecurityTestHeaders[] {
    const ts = timestamp.toString();
    const rawBody = JSON.stringify(body);
    const signature = this.hmacUtils.generateValidSignature(ts, rawBody);

    const headers: SecurityTestHeaders = {
      'x-api-key': this.hmacUtils.credentials.apiKey,
      'x-timestamp': ts,
      'x-signature': signature,
      'content-type': 'application/json'
    };

    // Return array of identical headers for replay testing
    return Array(count).fill(headers);
  }

  /**
   * Create requests with same signature but different timestamps (should fail)
   * @param body - Request body
   * @param baseTimestamp - Base timestamp
   */
  createTimestampReplayAttempt(body: any, baseTimestamp: number): {
    original: SecurityTestHeaders;
    replay: SecurityTestHeaders;
  } {
    const rawBody = JSON.stringify(body);
    const originalTs = baseTimestamp.toString();
    const replayTs = (baseTimestamp + 1000).toString(); // 1 second later
    
    // Use same signature for both (should fail for replay)
    const signature = this.hmacUtils.generateValidSignature(originalTs, rawBody);

    return {
      original: {
        'x-api-key': this.hmacUtils.credentials.apiKey,
        'x-timestamp': originalTs,
        'x-signature': signature,
        'content-type': 'application/json'
      },
      replay: {
        'x-api-key': this.hmacUtils.credentials.apiKey,
        'x-timestamp': replayTs,
        'x-signature': signature, // Same signature, different timestamp
        'content-type': 'application/json'
      }
    };
  }
}

/**
 * Security test data factory
 */
export class SecurityTestDataFactory {
  /**
   * Create test credentials from environment or defaults
   */
  static createTestCredentials(): SecurityTestCredentials {
    return {
      apiKey: process.env.INGEST_API_KEY || process.env.TEST_API_KEY || 'test-api-key-12345',
      webhookSecret: process.env.INGEST_WEBHOOK_SECRET || process.env.TEST_WEBHOOK_SECRET || 'test-webhook-secret-67890'
    };
  }

  /**
   * Create sample request body for testing
   */
  static createSampleRequestBody(): any {
    return {
      topic: {
        slug: 'test-security-topic',
        title: 'Security Test Topic',
        locale: 'en',
        tags: ['security', 'testing'],
        mainQuestion: 'How secure is this API?',
        seoTitle: 'Security Test Topic - SEO Title',
        seoDescription: 'Testing API security features',
        seoKeywords: ['security', 'api', 'testing']
      },
      article: {
        content: 'This is test content for security validation.',
        status: 'PUBLISHED' as const,
        seoTitle: 'Security Article SEO Title',
        seoDescription: 'Security article description'
      },
      faqItems: [
        {
          question: 'Is this secure?',
          answer: 'Yes, with proper validation.',
          order: 1
        }
      ]
    };
  }

  /**
   * Create malformed request bodies for testing
   */
  static createMalformedRequestBodies(): any[] {
    return [
      null,
      undefined,
      '',
      'not-json',
      '{"incomplete": json',
      '{"valid": "json", "but": "wrong", "structure": true}',
      { topic: null },
      { topic: { slug: '' } }, // Invalid slug
      { topic: { slug: 'valid', title: null } }, // Invalid title
    ];
  }
}