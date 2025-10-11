/**
 * Backward Compatibility Testing Utilities
 * 
 * Provides utilities for testing legacy parameter formats, response structure validation,
 * legacy authentication methods, and overall backward compatibility.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { z } from 'zod';
import { HMACTestUtils, type SecurityTestCredentials } from './security-test-utils';
import { validateResponse } from './response-validator';
import { 
  PaginatedTopicsResponseSchema, 
  UnifiedTopicResponseSchema,
  GenericErrorResponseSchema 
} from '../schemas/api-response-schemas';

export interface LegacyTestConfig {
  apiBaseUrl: string;
  credentials: SecurityTestCredentials;
  legacyFormats: {
    dateFormats: string[];
    parameterCasing: string[];
    booleanFormats: string[];
  };
}

export interface CompatibilityTestResult {
  success: boolean;
  statusCode: number;
  responseValid: boolean;
  error?: string;
  data?: any;
}

export interface LegacyStructureValidation {
  hasRequiredFields: boolean;
  fieldTypesCorrect: boolean;
  structureIntact: boolean;
  breakingChanges: string[];
}

export interface NewFieldsCompatibilityValidation {
  newFieldsOptional: boolean;
  existingFieldsIntact: boolean;
  parsingCompatible: boolean;
  incompatibilities: string[];
}

export interface PaginationCompatibilityValidation {
  hasLegacyFields: boolean;
  fieldTypesCorrect: boolean;
  calculationsCorrect: boolean;
  issues: string[];
}

export interface ErrorResponseValidation {
  statusCode: number;
  hasErrorField: boolean;
  structureValid: boolean;
  issues: string[];
}

export interface JSONConsistencyResult {
  validJSON: boolean;
  consistentStructure: boolean;
  noUnexpectedFields: boolean;
  issues: string[];
}

export interface NullFieldValidation {
  consistentNullHandling: boolean;
  noUndefinedFields: boolean;
  issues: string[];
}

export interface LegacyClientTest {
  name: string;
  headers: Record<string, string>;
  expectsFields: string[];
}

export interface LegacyClientResult {
  success: boolean;
  hasExpectedFields: boolean;
  noBreakingChanges: boolean;
  error?: string;
}

/**
 * Tests legacy parameter formats for API endpoints
 */
export class LegacyParameterTester {
  constructor(private config: LegacyTestConfig) {}

  async testLegacyParameters(endpoint: string, params: Record<string, any>): Promise<CompatibilityTestResult> {
    try {
      const url = new URL(endpoint, this.config.apiBaseUrl);
      
      // Add parameters to URL
      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          // Handle array parameters
          value.forEach(v => url.searchParams.append(key, String(v)));
        } else {
          url.searchParams.set(key, String(value));
        }
      });

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      // Validate response structure
      let responseValid = false;
      if (endpoint === '/api/topics') {
        const validation = validateResponse(data, PaginatedTopicsResponseSchema);
        responseValid = validation.valid;
      } else if (endpoint.startsWith('/api/topics/')) {
        const validation = validateResponse(data, UnifiedTopicResponseSchema);
        responseValid = validation.valid;
      } else {
        responseValid = true; // For other endpoints, just check if it's valid JSON
      }

      return {
        success: response.ok,
        statusCode: response.status,
        responseValid,
        data,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 500,
        responseValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testLegacySlugFormat(slug: string): Promise<CompatibilityTestResult> {
    return this.testLegacyParameters(`/api/topics/${slug}`, {});
  }

  async testLegacyFilters(filters: Record<string, any>): Promise<CompatibilityTestResult> {
    return this.testLegacyParameters('/api/topics', filters);
  }
}

/**
 * Tests legacy authentication header formats
 */
export class LegacyAuthenticationTester {
  private hmacUtils: HMACTestUtils;

  constructor(private config: LegacyTestConfig) {
    this.hmacUtils = new HMACTestUtils(config.credentials);
  }

  async testLegacyAuthHeaders(headers: Record<string, string>): Promise<CompatibilityTestResult> {
    try {
      const testBody = { test: 'data' };
      const bodyString = JSON.stringify(testBody);
      
      // Generate proper HMAC signature if needed
      const processedHeaders = { ...headers };
      if (headers['X-Signature'] === 'sha256=...') {
        const timestamp = Date.now().toString();
        const signature = this.hmacUtils.generateValidSignature(timestamp, bodyString);
        processedHeaders['X-Signature'] = signature;
        processedHeaders['X-Timestamp'] = timestamp;
      }

      const response = await fetch(`${this.config.apiBaseUrl}/api/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...processedHeaders,
        },
        body: bodyString,
      });

      const data = await response.json();

      return {
        success: response.ok,
        statusCode: response.status,
        responseValid: true, // Auth endpoints return simple JSON
        data,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 500,
        responseValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testLegacyTimestampFormat(timestamp: string | number): Promise<CompatibilityTestResult> {
    try {
      const testBody = { test: 'data' };
      const bodyString = JSON.stringify(testBody);
      
      // Convert timestamp to number if it's a string
      const numericTimestamp = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
      
      // Generate signature with the provided timestamp
      const timestampStr = numericTimestamp.toString();
      const signature = this.hmacUtils.generateValidSignature(timestampStr, bodyString);

      const response = await fetch(`${this.config.apiBaseUrl}/api/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.credentials.apiKey,
          'X-Signature': signature,
          'X-Timestamp': timestampStr,
        },
        body: bodyString,
      });

      const data = await response.json();

      return {
        success: response.ok,
        statusCode: response.status,
        responseValid: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 500,
        responseValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Validates response structure for backward compatibility
 */
export class ResponseStructureValidator {
  constructor(private config: LegacyTestConfig) {}

  async getTopicsResponse(params?: Record<string, any>): Promise<CompatibilityTestResult> {
    try {
      const url = new URL('/api/topics', this.config.apiBaseUrl);
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.set(key, String(value));
        });
      }

      const response = await fetch(url.toString());
      const data = await response.json();

      return {
        success: response.ok,
        statusCode: response.status,
        responseValid: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 500,
        responseValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getTopicBySlugResponse(slug: string): Promise<CompatibilityTestResult> {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/api/topics/${slug}`);
      const data = await response.json();

      return {
        success: response.ok,
        statusCode: response.status,
        responseValid: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 500,
        responseValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  validateLegacyTopicStructure(data: any): LegacyStructureValidation {
    const breakingChanges: string[] = [];
    
    // Check if it's a paginated response
    if (!data.items || !Array.isArray(data.items)) {
      breakingChanges.push('Missing or invalid items array');
    }

    // Check pagination fields
    const requiredPaginationFields = ['total', 'page', 'limit', 'totalPages'];
    for (const field of requiredPaginationFields) {
      if (typeof data[field] !== 'number') {
        breakingChanges.push(`Missing or invalid pagination field: ${field}`);
      }
    }

    // Check topic structure in items
    if (data.items && data.items.length > 0) {
      const firstItem = data.items[0];
      
      if (!firstItem.topic) {
        breakingChanges.push('Missing topic object in items');
      } else {
        const topic = firstItem.topic;
        const requiredTopicFields = ['id', 'slug', 'title', 'locale', 'tags', 'createdAt', 'updatedAt'];
        
        for (const field of requiredTopicFields) {
          if (!(field in topic)) {
            breakingChanges.push(`Missing required topic field: ${field}`);
          }
        }

        // Check field types
        if (typeof topic.id !== 'string') breakingChanges.push('topic.id must be string');
        if (typeof topic.slug !== 'string') breakingChanges.push('topic.slug must be string');
        if (typeof topic.title !== 'string') breakingChanges.push('topic.title must be string');
        if (typeof topic.locale !== 'string') breakingChanges.push('topic.locale must be string');
        if (!Array.isArray(topic.tags)) breakingChanges.push('topic.tags must be array');
      }
    }

    return {
      hasRequiredFields: breakingChanges.length === 0,
      fieldTypesCorrect: breakingChanges.filter(c => c.includes('must be')).length === 0,
      structureIntact: breakingChanges.length === 0,
      breakingChanges,
    };
  }

  validateNewFieldsCompatibility(data: any): NewFieldsCompatibilityValidation {
    const incompatibilities: string[] = [];
    
    // Check that new fields are optional (can be null)
    if (data.topic) {
      const topic = data.topic;
      
      // New SEO fields should be nullable
      const newFields = ['seoTitle', 'seoDescription', 'seoKeywords', 'thumbnailUrl'];
      for (const field of newFields) {
        if (field in topic && topic[field] !== null && topic[field] !== undefined) {
          // Field is present and not null - check type
          if (field === 'seoKeywords') {
            if (!Array.isArray(topic[field])) {
              incompatibilities.push(`${field} must be array when present`);
            }
          } else if (typeof topic[field] !== 'string') {
            incompatibilities.push(`${field} must be string when present`);
          }
        }
      }
    }

    // Check that existing fields are still intact
    const existingFieldsIntact = this.validateLegacyTopicStructure(data).structureIntact;

    return {
      newFieldsOptional: incompatibilities.length === 0,
      existingFieldsIntact,
      parsingCompatible: incompatibilities.length === 0 && existingFieldsIntact,
      incompatibilities,
    };
  }

  validatePaginationCompatibility(data: any): PaginationCompatibilityValidation {
    const issues: string[] = [];
    
    const requiredFields = ['total', 'page', 'limit', 'totalPages'];
    const hasLegacyFields = requiredFields.every(field => field in data);
    
    if (!hasLegacyFields) {
      issues.push('Missing required pagination fields');
    }

    const fieldTypesCorrect = requiredFields.every(field => typeof data[field] === 'number');
    
    if (!fieldTypesCorrect) {
      issues.push('Pagination field types are incorrect');
    }

    // Check calculations
    let calculationsCorrect = true;
    if (hasLegacyFields && fieldTypesCorrect) {
      const expectedTotalPages = Math.ceil(data.total / data.limit);
      if (data.totalPages !== expectedTotalPages) {
        calculationsCorrect = false;
        issues.push(`totalPages calculation incorrect: expected ${expectedTotalPages}, got ${data.totalPages}`);
      }
    }

    return {
      hasLegacyFields,
      fieldTypesCorrect,
      calculationsCorrect,
      issues,
    };
  }

  async testErrorResponseFormat(test: {
    endpoint: string;
    method?: string;
    body?: any;
    query?: Record<string, string>;
    expectedStatus: number;
  }): Promise<ErrorResponseValidation> {
    try {
      const url = new URL(test.endpoint, this.config.apiBaseUrl);
      
      if (test.query) {
        Object.entries(test.query).forEach(([key, value]) => {
          url.searchParams.set(key, value);
        });
      }

      const response = await fetch(url.toString(), {
        method: test.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: test.body ? JSON.stringify(test.body) : undefined,
      });

      const data = await response.json();
      const issues: string[] = [];

      // Check if error field exists
      const hasErrorField = 'error' in data && typeof data.error === 'string';
      if (!hasErrorField) {
        issues.push('Missing or invalid error field');
      }

      // Validate against generic error schema
      const validation = validateResponse(data, GenericErrorResponseSchema);
      const structureValid = validation.valid;
      
      if (!structureValid) {
        issues.push(...validation.errors);
      }

      return {
        statusCode: response.status,
        hasErrorField,
        structureValid,
        issues,
      };
    } catch (error) {
      return {
        statusCode: 500,
        hasErrorField: false,
        structureValid: false,
        issues: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  validateNullFieldHandling(topic: any): NullFieldValidation {
    const issues: string[] = [];
    
    // Check that no fields are undefined (should be null instead)
    const checkForUndefined = (obj: any, path = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (value === undefined) {
          issues.push(`Field ${currentPath} is undefined (should be null)`);
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
          checkForUndefined(value, currentPath);
        }
      }
    };

    checkForUndefined(topic);

    // Check that nullable fields are consistently handled
    const nullableFields = ['seoTitle', 'seoDescription', 'thumbnailUrl'];
    for (const field of nullableFields) {
      if (field in topic && topic[field] !== null && topic[field] !== undefined && typeof topic[field] !== 'string') {
        issues.push(`Nullable field ${field} has invalid type: ${typeof topic[field]}`);
      }
    }

    return {
      consistentNullHandling: issues.filter(i => i.includes('should be null')).length === 0,
      noUndefinedFields: issues.filter(i => i.includes('undefined')).length === 0,
      issues,
    };
  }
}

/**
 * General backward compatibility utilities
 */
export class BackwardCompatibilityUtils {
  constructor(private config: LegacyTestConfig) {}

  async testJSONConsistency(endpoint: { path: string; method: string }): Promise<JSONConsistencyResult> {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const text = await response.text();
      const issues: string[] = [];

      // Check if it's valid JSON
      let data;
      try {
        data = JSON.parse(text);
      } catch (error) {
        issues.push('Response is not valid JSON');
        return {
          validJSON: false,
          consistentStructure: false,
          noUnexpectedFields: false,
          issues,
        };
      }

      // Check for consistent structure
      const hasConsistentStructure = this.checkStructureConsistency(data, endpoint.path);
      if (!hasConsistentStructure) {
        issues.push('Response structure is inconsistent');
      }

      // Check for unexpected fields (this is a basic check)
      const hasUnexpectedFields = this.checkForUnexpectedFields(data, endpoint.path);
      if (hasUnexpectedFields) {
        issues.push('Response contains unexpected fields');
      }

      return {
        validJSON: true,
        consistentStructure: hasConsistentStructure,
        noUnexpectedFields: !hasUnexpectedFields,
        issues,
      };
    } catch (error) {
      return {
        validJSON: false,
        consistentStructure: false,
        noUnexpectedFields: false,
        issues: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private checkStructureConsistency(data: any, path: string): boolean {
    // Basic structure consistency checks based on endpoint
    if (path === '/api/topics') {
      return data && typeof data === 'object' && 'items' in data && Array.isArray(data.items);
    } else if (path.startsWith('/api/topics/')) {
      return data && typeof data === 'object' && 'topic' in data;
    }
    return true; // For other endpoints, assume consistent
  }

  private checkForUnexpectedFields(data: any, path: string): boolean {
    // This is a simplified check - in a real implementation, you'd have
    // a comprehensive list of expected fields for each endpoint
    if (path === '/api/topics') {
      const expectedTopLevelFields = ['items', 'total', 'page', 'limit', 'totalPages'];
      const actualFields = Object.keys(data);
      return actualFields.some(field => !expectedTopLevelFields.includes(field));
    }
    return false; // For now, assume no unexpected fields
  }

  async simulateLegacyClient(clientTest: LegacyClientTest): Promise<LegacyClientResult> {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/api/topics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...clientTest.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          hasExpectedFields: false,
          noBreakingChanges: false,
          error: `HTTP ${response.status}: ${data.error || 'Unknown error'}`,
        };
      }

      // Check if expected fields are present
      const hasExpectedFields = this.checkExpectedFields(data, clientTest.expectsFields);
      
      // Check for breaking changes (simplified)
      const noBreakingChanges = this.checkNoBreakingChanges(data);

      return {
        success: true,
        hasExpectedFields,
        noBreakingChanges,
      };
    } catch (error) {
      return {
        success: false,
        hasExpectedFields: false,
        noBreakingChanges: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private checkExpectedFields(data: any, expectedFields: string[]): boolean {
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return false;
    }

    const firstTopic = data.items[0]?.topic;
    if (!firstTopic) {
      return false;
    }

    return expectedFields.every(field => field in firstTopic);
  }

  private checkNoBreakingChanges(data: any): boolean {
    // Simplified check for breaking changes
    // In a real implementation, this would be more comprehensive
    return data && typeof data === 'object' && 'items' in data && Array.isArray(data.items);
  }
}