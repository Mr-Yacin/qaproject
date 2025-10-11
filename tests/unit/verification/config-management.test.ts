/**
 * Unit tests for test configuration parsing and setup
 * Requirements: 1.1, 6.1
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ConfigurationManager, TestDataManager } from '../../verification/config';
import { ExecutionMode, TestCategory, VerificationLevel } from '../../verification/types';

// Mock environment variables
const mockEnv = {
  VERIFICATION_API_BASE_URL: 'https://test-api.example.com',
  VERIFICATION_API_KEY: 'test-api-key-123',
  VERIFICATION_WEBHOOK_SECRET: 'test-webhook-secret-456',
  VERIFICATION_ADMIN_TOKEN: 'admin-token-789',
  VERIFICATION_TIMEOUT: '25000',
  VERIFICATION_RETRIES: '2',
  VERIFICATION_PARALLEL: 'true',
  VERIFICATION_MAX_RESPONSE_TIME: '750',
  VERIFICATION_MIN_THROUGHPUT: '80',
  VERIFICATION_MAX_ERROR_RATE: '0.02',
  VERIFICATION_MAX_MEMORY_USAGE: '768',
  VERIFICATION_MIN_CACHE_HIT_RATE: '0.85',
  VERIFICATION_ENABLE_REPLAY_TESTS: 'true',
  VERIFICATION_ENABLE_FUZZING_TESTS: 'false',
  VERIFICATION_MAX_TIMESTAMP_SKEW: '300',
  VERIFICATION_ENABLE_VULN_SCANNING: 'true',
  VERIFICATION_GENERATE_DETAILED_REPORT: 'true',
  VERIFICATION_INCLUDE_PERF_GRAPHS: 'true',
  VERIFICATION_EXPORT_FORMATS: 'json,html,pdf',
  VERIFICATION_EMAIL_NOTIFICATIONS: 'true',
  VERIFICATION_EMAIL_RECIPIENTS: 'test1@example.com,test2@example.com',
  VERIFICATION_SLACK_WEBHOOK: 'https://hooks.slack.com/test',
  VERIFICATION_CRITICAL_THRESHOLD: '2',
  VERIFICATION_ENVIRONMENT: 'staging',
  VERIFICATION_TEST_DATA_PATH: './custom/test/data',
};

describe('ConfigurationManager', () => {
  let configManager: ConfigurationManager;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Store original environment
    originalEnv = { ...process.env };
    
    // Clear environment and set mock values
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('VERIFICATION_')) {
        delete process.env[key];
      }
    });
    
    Object.assign(process.env, mockEnv);
    
    // Get fresh instance
    configManager = ConfigurationManager.getInstance();
    // Reset internal state
    (configManager as any).config = null;
    (configManager as any).env = null;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('loadConfiguration', () => {
    it('should load and validate configuration from environment variables', async () => {
      const config = await configManager.loadConfiguration();

      expect(config.apiBaseUrl).toBe('https://test-api.example.com');
      expect(config.timeout).toBe(25000);
      expect(config.retries).toBe(2);
      expect(config.parallelExecution).toBe(true);
    });

    it('should build performance thresholds correctly', async () => {
      const config = await configManager.loadConfiguration();

      expect(config.performanceThresholds).toEqual({
        maxResponseTime: 750,
        minThroughput: 80,
        maxErrorRate: 0.02,
        maxMemoryUsage: 768,
        minCacheHitRate: 0.85,
      });
    });

    it('should build security settings correctly', async () => {
      const config = await configManager.loadConfiguration();

      expect(config.securitySettings).toEqual({
        enableReplayAttackTests: true,
        enableInputFuzzingTests: false,
        maxTimestampSkew: 300,
        enableVulnerabilityScanning: true,
      });
    });

    it('should build reporting options correctly', async () => {
      const config = await configManager.loadConfiguration();

      expect(config.reportingOptions).toEqual({
        generateDetailedReport: true,
        includePerformanceGraphs: true,
        exportFormats: ['json', 'html', 'pdf'],
        notificationSettings: {
          enableEmailNotifications: true,
          emailRecipients: ['test1@example.com', 'test2@example.com'],
          slackWebhook: 'https://hooks.slack.com/test',
          criticalIssueThreshold: 2,
        },
      });
    });

    it('should use default values when environment variables are missing', async () => {
      // Remove some environment variables
      delete process.env.VERIFICATION_TIMEOUT;
      delete process.env.VERIFICATION_RETRIES;
      delete process.env.VERIFICATION_PARALLEL;

      const config = await configManager.loadConfiguration();

      expect(config.timeout).toBe(30000); // default
      expect(config.retries).toBe(3); // default
      expect(config.parallelExecution).toBe(true); // default
    });

    it('should throw error for invalid environment variables', async () => {
      process.env.VERIFICATION_API_BASE_URL = 'not-a-valid-url';

      await expect(configManager.loadConfiguration()).rejects.toThrow('Environment validation failed');
    });

    it('should cache configuration after first load', async () => {
      const config1 = await configManager.loadConfiguration();
      const config2 = await configManager.loadConfiguration();

      expect(config1).toBe(config2); // Same object reference
    });
  });

  describe('getAuthCredentials', () => {
    it('should return authentication credentials from environment', async () => {
      await configManager.loadConfiguration();
      const credentials = configManager.getAuthCredentials();

      expect(credentials).toEqual({
        apiKey: 'test-api-key-123',
        webhookSecret: 'test-webhook-secret-456',
        adminToken: 'admin-token-789',
      });
    });

    it('should throw error if configuration not loaded', () => {
      expect(() => configManager.getAuthCredentials()).toThrow(
        'Configuration not loaded. Call loadConfiguration() first.'
      );
    });
  });

  describe('validateCredentials', () => {
    it('should validate required credentials are present', async () => {
      await configManager.loadConfiguration();
      expect(() => configManager.validateCredentials()).not.toThrow();
    });

    it('should throw error for missing API key', async () => {
      delete process.env.VERIFICATION_API_KEY;
      
      const configManager = ConfigurationManager.getInstance();
      (configManager as any).config = null;
      (configManager as any).env = null;

      await expect(configManager.loadConfiguration()).rejects.toThrow('Environment validation failed');
    });

    it('should throw error for missing webhook secret', async () => {
      delete process.env.VERIFICATION_WEBHOOK_SECRET;
      
      const configManager = ConfigurationManager.getInstance();
      (configManager as any).config = null;
      (configManager as any).env = null;

      await expect(configManager.loadConfiguration()).rejects.toThrow('Environment validation failed');
    });
  });

  describe('getEnvironment', () => {
    it('should return environment name from configuration', async () => {
      await configManager.loadConfiguration();
      expect(configManager.getEnvironment()).toBe('staging');
    });

    it('should return default environment when not configured', async () => {
      delete process.env.VERIFICATION_ENVIRONMENT;
      await configManager.loadConfiguration();
      expect(configManager.getEnvironment()).toBe('development');
    });
  });

  describe('getTestDataPath', () => {
    it('should return test data path from configuration', async () => {
      await configManager.loadConfiguration();
      expect(configManager.getTestDataPath()).toBe('./custom/test/data');
    });

    it('should return default path when not configured', async () => {
      delete process.env.VERIFICATION_TEST_DATA_PATH;
      await configManager.loadConfiguration();
      expect(configManager.getTestDataPath()).toBe('./tests/verification/data');
    });
  });

  describe('getConfigForMode', () => {
    beforeEach(async () => {
      await configManager.loadConfiguration();
    });

    it('should return quick mode configuration', () => {
      const config = configManager.getConfigForMode('quick' as ExecutionMode);

      expect(config.timeout).toBe(10000); // Reduced from 25000
      expect(config.retries).toBe(1); // Reduced from 2
      expect(config.performanceThresholds?.maxResponseTime).toBe(1500); // Doubled from 750
    });

    it('should return full mode configuration', () => {
      const config = configManager.getConfigForMode('full' as ExecutionMode);

      expect(config.timeout).toBe(25000); // Original value
      expect(config.retries).toBe(2); // Original value
    });

    it('should return targeted mode configuration', () => {
      const config = configManager.getConfigForMode('targeted' as ExecutionMode);

      expect(config.parallelExecution).toBe(false); // Changed from true
      expect(config.retries).toBe(3); // Increased from 2
    });

    it('should return continuous mode configuration', () => {
      const config = configManager.getConfigForMode('continuous' as ExecutionMode);

      expect(config.timeout).toBe(12500); // Half of 25000
      expect(config.retries).toBe(1); // Reduced
      expect(config.reportingOptions?.generateDetailedReport).toBe(false); // Disabled
      expect(config.reportingOptions?.includePerformanceGraphs).toBe(false); // Disabled
    });
  });

  describe('singleton pattern', () => {
    it('should return same instance on multiple calls', () => {
      const instance1 = ConfigurationManager.getInstance();
      const instance2 = ConfigurationManager.getInstance();

      expect(instance1).toBe(instance2);
    });
  });
});

describe('TestDataManager', () => {
  let testDataManager: TestDataManager;
  let configManager: ConfigurationManager;

  beforeEach(() => {
    // Set up environment
    Object.assign(process.env, mockEnv);
    
    testDataManager = TestDataManager.getInstance();
    configManager = ConfigurationManager.getInstance();
    
    // Reset internal state
    (testDataManager as any).testDataSets = new Map();
    (configManager as any).config = null;
    (configManager as any).env = null;
  });

  describe('loadTestDataSets', () => {
    it('should load default test data sets', async () => {
      await configManager.loadConfiguration();
      const dataSets = await testDataManager.loadTestDataSets();

      expect(dataSets).toHaveLength(2); // basic-api-tests and seo-fields-tests
      expect(dataSets[0].id).toBe('basic-api-tests');
      expect(dataSets[1].id).toBe('seo-fields-tests');
    });

    it('should store loaded data sets for retrieval', async () => {
      await configManager.loadConfiguration();
      await testDataManager.loadTestDataSets();

      const basicDataSet = testDataManager.getTestDataSet('basic-api-tests');
      expect(basicDataSet).not.toBeNull();
      expect(basicDataSet?.name).toBe('Basic API Test Data');
    });

    it('should return all loaded data sets', async () => {
      await configManager.loadConfiguration();
      await testDataManager.loadTestDataSets();

      const allDataSets = testDataManager.getAllTestDataSets();
      expect(allDataSets).toHaveLength(2);
    });
  });

  describe('getTestDataSet', () => {
    beforeEach(async () => {
      await configManager.loadConfiguration();
      await testDataManager.loadTestDataSets();
    });

    it('should return test data set by ID', () => {
      const dataSet = testDataManager.getTestDataSet('basic-api-tests');

      expect(dataSet).not.toBeNull();
      expect(dataSet?.id).toBe('basic-api-tests');
      expect(dataSet?.topics).toHaveLength(1);
    });

    it('should return null for non-existent data set', () => {
      const dataSet = testDataManager.getTestDataSet('non-existent');
      expect(dataSet).toBeNull();
    });
  });

  describe('getTestDataSetsForCategories', () => {
    beforeEach(async () => {
      await configManager.loadConfiguration();
      await testDataManager.loadTestDataSets();
    });

    it('should return data sets for specified categories', () => {
      const dataSets = testDataManager.getTestDataSetsForCategories([
        'api_endpoints' as TestCategory,
        'schema_compatibility' as TestCategory,
      ]);

      // Currently returns all data sets since category filtering is not implemented
      expect(dataSets).toHaveLength(2);
    });
  });

  describe('default test data validation', () => {
    beforeEach(async () => {
      await configManager.loadConfiguration();
      await testDataManager.loadTestDataSets();
    });

    it('should have valid basic API test data structure', () => {
      const basicDataSet = testDataManager.getTestDataSet('basic-api-tests');

      expect(basicDataSet?.topics[0]).toMatchObject({
        slug: 'test-topic-1',
        title: 'Test Topic 1',
        locale: 'en',
        tags: ['test', 'api'],
        mainQuestion: 'What is test topic 1?',
      });

      expect(basicDataSet?.topics[0].article).toMatchObject({
        content: 'This is test article content for topic 1.',
        status: 'PUBLISHED',
      });

      expect(basicDataSet?.topics[0].faqItems).toHaveLength(2);
    });

    it('should have valid SEO test data structure', () => {
      const seoDataSet = testDataManager.getTestDataSet('seo-fields-tests');

      expect(seoDataSet?.topics[0]).toMatchObject({
        slug: 'seo-test-topic',
        seoTitle: 'SEO Test Topic - Complete Guide',
        seoDescription: expect.stringContaining('comprehensive SEO description'),
        seoKeywords: ['seo', 'test', 'optimization', 'guide'],
        thumbnailUrl: 'https://example.com/seo-thumbnail.jpg',
      });

      expect(seoDataSet?.topics[0].article).toMatchObject({
        seoTitle: 'SEO Article Title - Best Practices',
        seoDescription: 'Learn about SEO best practices and testing methodologies.',
        seoKeywords: ['seo', 'best practices', 'testing'],
      });
    });

    it('should have valid expected results structure', () => {
      const basicDataSet = testDataManager.getTestDataSet('basic-api-tests');

      expect(basicDataSet?.expectedResults).toHaveLength(2);
      expect(basicDataSet?.expectedResults[0]).toMatchObject({
        endpoint: '/api/topics',
        method: 'GET',
        expectedStatus: 200,
        expectedFields: ['topics', 'pagination'],
        requiredFields: ['topics'],
      });
    });
  });

  describe('singleton pattern', () => {
    it('should return same instance on multiple calls', () => {
      const instance1 = TestDataManager.getInstance();
      const instance2 = TestDataManager.getInstance();

      expect(instance1).toBe(instance2);
    });
  });
});

describe('Configuration Error Handling', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    
    // Clear verification environment variables
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('VERIFICATION_')) {
        delete process.env[key];
      }
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('missing required environment variables', () => {
    it('should throw error for missing API key', async () => {
      process.env.VERIFICATION_WEBHOOK_SECRET = 'test-secret';
      // Missing VERIFICATION_API_KEY

      const configManager = ConfigurationManager.getInstance();
      (configManager as any).config = null;
      (configManager as any).env = null;

      await expect(configManager.loadConfiguration()).rejects.toThrow('Environment validation failed');
    });

    it('should throw error for missing webhook secret', async () => {
      process.env.VERIFICATION_API_KEY = 'test-key';
      // Missing VERIFICATION_WEBHOOK_SECRET

      const configManager = ConfigurationManager.getInstance();
      (configManager as any).config = null;
      (configManager as any).env = null;

      await expect(configManager.loadConfiguration()).rejects.toThrow('Environment validation failed');
    });
  });

  describe('invalid environment variable values', () => {
    it('should throw error for invalid URL', async () => {
      Object.assign(process.env, {
        ...mockEnv,
        VERIFICATION_API_BASE_URL: 'not-a-valid-url',
      });

      const configManager = ConfigurationManager.getInstance();
      (configManager as any).config = null;
      (configManager as any).env = null;

      await expect(configManager.loadConfiguration()).rejects.toThrow('Environment validation failed');
    });

    it('should handle invalid numeric values by setting NaN', async () => {
      Object.assign(process.env, {
        ...mockEnv,
        VERIFICATION_TIMEOUT: 'not-a-number',
      });

      const configManager = ConfigurationManager.getInstance();
      (configManager as any).config = null;
      (configManager as any).env = null;

      const config = await configManager.loadConfiguration();
      expect(config.timeout).toBeNaN();
    });

    it('should handle invalid boolean values by setting false', async () => {
      Object.assign(process.env, {
        ...mockEnv,
        VERIFICATION_PARALLEL: 'maybe', // Should be 'true' or 'false'
      });

      const configManager = ConfigurationManager.getInstance();
      (configManager as any).config = null;
      (configManager as any).env = null;

      const config = await configManager.loadConfiguration();
      expect(config.parallelExecution).toBe(false);
    });

    it('should throw error for invalid enum values', async () => {
      Object.assign(process.env, {
        ...mockEnv,
        VERIFICATION_ENVIRONMENT: 'invalid-environment',
      });

      const configManager = ConfigurationManager.getInstance();
      (configManager as any).config = null;
      (configManager as any).env = null;

      await expect(configManager.loadConfiguration()).rejects.toThrow('Environment validation failed');
    });
  });

  describe('export formats validation', () => {
    it('should filter out invalid export formats', async () => {
      Object.assign(process.env, {
        ...mockEnv,
        VERIFICATION_EXPORT_FORMATS: 'json,invalid,html,another-invalid,pdf',
      });

      const configManager = ConfigurationManager.getInstance();
      (configManager as any).config = null;
      (configManager as any).env = null;

      const config = await configManager.loadConfiguration();
      expect(config.reportingOptions.exportFormats).toEqual(['json', 'html', 'pdf']);
    });

    it('should handle empty export formats', async () => {
      Object.assign(process.env, {
        ...mockEnv,
        VERIFICATION_EXPORT_FORMATS: '',
      });

      const configManager = ConfigurationManager.getInstance();
      (configManager as any).config = null;
      (configManager as any).env = null;

      const config = await configManager.loadConfiguration();
      expect(config.reportingOptions.exportFormats).toEqual([]);
    });
  });

  describe('email recipients validation', () => {
    it('should filter out empty email recipients', async () => {
      Object.assign(process.env, {
        ...mockEnv,
        VERIFICATION_EMAIL_RECIPIENTS: 'test1@example.com,,test2@example.com, ,test3@example.com',
      });

      const configManager = ConfigurationManager.getInstance();
      (configManager as any).config = null;
      (configManager as any).env = null;

      const config = await configManager.loadConfiguration();
      expect(config.reportingOptions.notificationSettings.emailRecipients).toEqual([
        'test1@example.com',
        'test2@example.com',
        'test3@example.com',
      ]);
    });
  });
});