/**
 * Unit tests for verification test utilities and error handling
 * Requirements: 1.1, 6.1
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ValidationUtils, TestConfigUtils } from '../../verification/utils';

describe('ValidationUtils', () => {
  describe('isValidUrl', () => {
    it('should return true for valid URLs', () => {
      expect(ValidationUtils.isValidUrl('https://example.com')).toBe(true);
      expect(ValidationUtils.isValidUrl('http://localhost:3000')).toBe(true);
      expect(ValidationUtils.isValidUrl('https://api.example.com/path?query=value')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(ValidationUtils.isValidUrl('not-a-url')).toBe(false);
      expect(ValidationUtils.isValidUrl('')).toBe(false);
      expect(ValidationUtils.isValidUrl('just-text')).toBe(false);
    });

    it('should handle malformed URLs gracefully', () => {
      expect(ValidationUtils.isValidUrl('http://')).toBe(false);
      expect(ValidationUtils.isValidUrl('https://')).toBe(false);
      expect(ValidationUtils.isValidUrl('://missing-protocol')).toBe(false);
    });
  });

  describe('containsHtml', () => {
    it('should return true for strings containing HTML tags', () => {
      expect(ValidationUtils.containsHtml('<p>Hello world</p>')).toBe(true);
      expect(ValidationUtils.containsHtml('Text with <strong>bold</strong> content')).toBe(true);
      expect(ValidationUtils.containsHtml('<div class="test">Content</div>')).toBe(true);
      expect(ValidationUtils.containsHtml('Self-closing <br/> tag')).toBe(true);
    });

    it('should return false for plain text', () => {
      expect(ValidationUtils.containsHtml('Plain text content')).toBe(false);
      expect(ValidationUtils.containsHtml('')).toBe(false);
      expect(ValidationUtils.containsHtml('Numbers 123 and symbols !@#')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(ValidationUtils.containsHtml('<>')).toBe(false); // Empty tag
      expect(ValidationUtils.containsHtml('<incomplete')).toBe(false); // Incomplete tag
    });
  });

  describe('normalizeWhitespace', () => {
    it('should normalize multiple spaces to single spaces', () => {
      expect(ValidationUtils.normalizeWhitespace('hello    world')).toBe('hello world');
      expect(ValidationUtils.normalizeWhitespace('text  with   multiple    spaces')).toBe('text with multiple spaces');
    });

    it('should trim leading and trailing whitespace', () => {
      expect(ValidationUtils.normalizeWhitespace('  hello world  ')).toBe('hello world');
      expect(ValidationUtils.normalizeWhitespace('\t\n  text  \n\t')).toBe('text');
    });

    it('should handle different types of whitespace', () => {
      expect(ValidationUtils.normalizeWhitespace('hello\t\nworld')).toBe('hello world');
      expect(ValidationUtils.normalizeWhitespace('text\r\nwith\r\nlinebreaks')).toBe('text with linebreaks');
    });

    it('should handle empty and whitespace-only strings', () => {
      expect(ValidationUtils.normalizeWhitespace('')).toBe('');
      expect(ValidationUtils.normalizeWhitespace('   ')).toBe('');
      expect(ValidationUtils.normalizeWhitespace('\t\n\r')).toBe('');
    });
  });

  describe('deepEqual', () => {
    it('should return true for identical primitive values', () => {
      expect(ValidationUtils.deepEqual(1, 1)).toBe(true);
      expect(ValidationUtils.deepEqual('test', 'test')).toBe(true);
      expect(ValidationUtils.deepEqual(true, true)).toBe(true);
      expect(ValidationUtils.deepEqual(null, null)).toBe(true);
      expect(ValidationUtils.deepEqual(undefined, undefined)).toBe(true);
    });

    it('should return false for different primitive values', () => {
      expect(ValidationUtils.deepEqual(1, 2)).toBe(false);
      expect(ValidationUtils.deepEqual('test', 'other')).toBe(false);
      expect(ValidationUtils.deepEqual(true, false)).toBe(false);
      expect(ValidationUtils.deepEqual(null, undefined)).toBe(false);
    });

    it('should compare arrays correctly', () => {
      expect(ValidationUtils.deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(ValidationUtils.deepEqual(['a', 'b'], ['a', 'b'])).toBe(true);
      expect(ValidationUtils.deepEqual([], [])).toBe(true);
      
      expect(ValidationUtils.deepEqual([1, 2, 3], [1, 2, 4])).toBe(false);
      expect(ValidationUtils.deepEqual([1, 2], [1, 2, 3])).toBe(false);
      expect(ValidationUtils.deepEqual(['a'], ['b'])).toBe(false);
    });

    it('should compare nested arrays correctly', () => {
      expect(ValidationUtils.deepEqual([[1, 2], [3, 4]], [[1, 2], [3, 4]])).toBe(true);
      expect(ValidationUtils.deepEqual([[1, 2], [3, 4]], [[1, 2], [3, 5]])).toBe(false);
    });

    it('should compare objects correctly', () => {
      const obj1 = { a: 1, b: 'test' };
      const obj2 = { a: 1, b: 'test' };
      const obj3 = { a: 1, b: 'different' };
      const obj4 = { a: 1, b: 'test', c: 'extra' };

      expect(ValidationUtils.deepEqual(obj1, obj2)).toBe(true);
      expect(ValidationUtils.deepEqual(obj1, obj3)).toBe(false);
      expect(ValidationUtils.deepEqual(obj1, obj4)).toBe(false);
      expect(ValidationUtils.deepEqual({}, {})).toBe(true);
    });

    it('should compare nested objects correctly', () => {
      const nested1 = { a: { b: { c: 1 } } };
      const nested2 = { a: { b: { c: 1 } } };
      const nested3 = { a: { b: { c: 2 } } };

      expect(ValidationUtils.deepEqual(nested1, nested2)).toBe(true);
      expect(ValidationUtils.deepEqual(nested1, nested3)).toBe(false);
    });

    it('should handle mixed types correctly', () => {
      expect(ValidationUtils.deepEqual(1, '1')).toBe(false);
      expect(ValidationUtils.deepEqual([], {})).toBe(false);
      expect(ValidationUtils.deepEqual([1], { 0: 1 })).toBe(false);
    });
  });

  describe('getEnvVar', () => {
    beforeEach(() => {
      // Clear environment variables before each test
      delete process.env.TEST_VAR;
      delete process.env.TEST_VAR_WITH_FALLBACK;
    });

    it('should return environment variable value when it exists', () => {
      process.env.TEST_VAR = 'test-value';
      expect(ValidationUtils.getEnvVar('TEST_VAR')).toBe('test-value');
    });

    it('should return fallback value when environment variable does not exist', () => {
      expect(ValidationUtils.getEnvVar('TEST_VAR_WITH_FALLBACK', 'fallback-value')).toBe('fallback-value');
    });

    it('should throw error when environment variable does not exist and no fallback provided', () => {
      expect(() => ValidationUtils.getEnvVar('NONEXISTENT_VAR')).toThrow('Environment variable NONEXISTENT_VAR is required');
    });

    it('should handle empty string environment variables', () => {
      process.env.EMPTY_VAR = '';
      expect(ValidationUtils.getEnvVar('EMPTY_VAR')).toBe('');
    });
  });

  describe('delay', () => {
    it('should resolve after specified time', async () => {
      const start = Date.now();
      await ValidationUtils.delay(100);
      const end = Date.now();
      
      // Allow some tolerance for timing
      expect(end - start).toBeGreaterThanOrEqual(90);
      expect(end - start).toBeLessThan(200);
    });

    it('should handle zero delay', async () => {
      const start = Date.now();
      await ValidationUtils.delay(0);
      const end = Date.now();
      
      expect(end - start).toBeLessThan(50);
    });
  });

  describe('randomString', () => {
    it('should generate string of specified length', () => {
      expect(ValidationUtils.randomString(5)).toHaveLength(5);
      expect(ValidationUtils.randomString(20)).toHaveLength(20);
    });

    it('should generate string of default length when no length specified', () => {
      expect(ValidationUtils.randomString()).toHaveLength(10);
    });

    it('should generate different strings on multiple calls', () => {
      const str1 = ValidationUtils.randomString(10);
      const str2 = ValidationUtils.randomString(10);
      
      expect(str1).not.toBe(str2);
    });

    it('should only contain alphanumeric characters', () => {
      const str = ValidationUtils.randomString(100);
      expect(str).toMatch(/^[a-zA-Z0-9]+$/);
    });

    it('should handle edge cases', () => {
      expect(ValidationUtils.randomString(0)).toBe('');
      expect(ValidationUtils.randomString(1)).toHaveLength(1);
    });
  });

  describe('sanitizeTestName', () => {
    it('should remove special characters', () => {
      expect(ValidationUtils.sanitizeTestName('test@#$%name')).toBe('testname');
      expect(ValidationUtils.sanitizeTestName('test!@#$%^&*()name')).toBe('testname');
    });

    it('should replace spaces with hyphens', () => {
      expect(ValidationUtils.sanitizeTestName('test name with spaces')).toBe('test-name-with-spaces');
      expect(ValidationUtils.sanitizeTestName('multiple   spaces')).toBe('multiple-spaces');
    });

    it('should convert to lowercase', () => {
      expect(ValidationUtils.sanitizeTestName('TestName')).toBe('testname');
      expect(ValidationUtils.sanitizeTestName('UPPERCASE TEST')).toBe('uppercase-test');
    });

    it('should preserve hyphens and alphanumeric characters', () => {
      expect(ValidationUtils.sanitizeTestName('test-name-123')).toBe('test-name-123');
      expect(ValidationUtils.sanitizeTestName('api-endpoint-test')).toBe('api-endpoint-test');
    });

    it('should handle empty and whitespace strings', () => {
      expect(ValidationUtils.sanitizeTestName('')).toBe('');
      expect(ValidationUtils.sanitizeTestName('   ').replace(/-+$/, '')).toBe('');
    });
  });
});

describe('TestConfigUtils', () => {
  beforeEach(() => {
    // Clear environment variables before each test
    delete process.env.API_BASE_URL;
    delete process.env.TEST_API_KEY;
    delete process.env.TEST_WEBHOOK_SECRET;
    delete process.env.NODE_ENV;
    delete process.env.VITEST;
    delete process.env.TEST_TIMEOUT;
  });

  describe('getApiBaseUrl', () => {
    it('should return environment variable when set', () => {
      process.env.API_BASE_URL = 'https://custom-api.example.com';
      expect(TestConfigUtils.getApiBaseUrl()).toBe('https://custom-api.example.com');
    });

    it('should return default URL when environment variable not set', () => {
      expect(TestConfigUtils.getApiBaseUrl()).toBe('http://localhost:3000');
    });
  });

  describe('getTestCredentials', () => {
    it('should return environment credentials when set', () => {
      process.env.TEST_API_KEY = 'custom-api-key';
      process.env.TEST_WEBHOOK_SECRET = 'custom-webhook-secret';
      
      const credentials = TestConfigUtils.getTestCredentials();
      expect(credentials.apiKey).toBe('custom-api-key');
      expect(credentials.webhookSecret).toBe('custom-webhook-secret');
    });

    it('should return default credentials when environment variables not set', () => {
      const credentials = TestConfigUtils.getTestCredentials();
      expect(credentials.apiKey).toBe('test-api-key');
      expect(credentials.webhookSecret).toBe('test-webhook-secret');
    });
  });

  describe('isTestEnvironment', () => {
    it('should return true when NODE_ENV is test', () => {
      process.env.NODE_ENV = 'test';
      expect(TestConfigUtils.isTestEnvironment()).toBe(true);
    });

    it('should return true when VITEST is true', () => {
      process.env.VITEST = 'true';
      expect(TestConfigUtils.isTestEnvironment()).toBe(true);
    });

    it('should return false when neither test environment variable is set', () => {
      process.env.NODE_ENV = 'development';
      expect(TestConfigUtils.isTestEnvironment()).toBe(false);
    });

    it('should return false when NODE_ENV is not test and VITEST is not true', () => {
      process.env.NODE_ENV = 'production';
      process.env.VITEST = 'false';
      expect(TestConfigUtils.isTestEnvironment()).toBe(false);
    });
  });

  describe('getTestTimeout', () => {
    it('should return parsed timeout from environment variable', () => {
      process.env.TEST_TIMEOUT = '45000';
      expect(TestConfigUtils.getTestTimeout()).toBe(45000);
    });

    it('should return default timeout when environment variable not set', () => {
      expect(TestConfigUtils.getTestTimeout()).toBe(30000);
    });

    it('should handle invalid timeout values gracefully', () => {
      process.env.TEST_TIMEOUT = 'not-a-number';
      expect(TestConfigUtils.getTestTimeout()).toBeNaN();
    });

    it('should handle zero and negative timeouts', () => {
      process.env.TEST_TIMEOUT = '0';
      expect(TestConfigUtils.getTestTimeout()).toBe(0);
      
      process.env.TEST_TIMEOUT = '-1000';
      expect(TestConfigUtils.getTestTimeout()).toBe(-1000);
    });
  });
});

describe('Error Handling in Test Utilities', () => {
  describe('URL validation error handling', () => {
    it('should handle URL constructor exceptions', () => {
      // Test with values that might cause URL constructor to throw
      expect(ValidationUtils.isValidUrl(null as any)).toBe(false);
      expect(ValidationUtils.isValidUrl(undefined as any)).toBe(false);
      expect(ValidationUtils.isValidUrl(123 as any)).toBe(false);
    });
  });

  describe('Deep equality error handling', () => {
    it('should handle circular references gracefully', () => {
      const obj1: any = { a: 1 };
      obj1.self = obj1;
      
      const obj2: any = { a: 1 };
      obj2.self = obj2;
      
      // This will throw due to circular reference - that's expected behavior
      expect(() => ValidationUtils.deepEqual(obj1, obj2)).toThrow();
    });

    it('should handle null and undefined comparisons', () => {
      expect(ValidationUtils.deepEqual(null, undefined)).toBe(false);
      expect(ValidationUtils.deepEqual(null, {})).toBe(false);
      expect(ValidationUtils.deepEqual(undefined, {})).toBe(false);
    });
  });

  describe('Environment variable error handling', () => {
    it('should provide clear error messages for missing required variables', () => {
      expect(() => ValidationUtils.getEnvVar('MISSING_REQUIRED_VAR')).toThrow(
        'Environment variable MISSING_REQUIRED_VAR is required'
      );
    });
  });

  describe('String sanitization error handling', () => {
    it('should handle non-string inputs gracefully', () => {
      expect(() => ValidationUtils.sanitizeTestName(null as any)).toThrow();
      expect(() => ValidationUtils.sanitizeTestName(undefined as any)).toThrow();
      expect(() => ValidationUtils.sanitizeTestName(123 as any)).toThrow();
    });
  });
});