/**
 * Test configuration management system
 */

import { z } from 'zod';
import { 
  TestConfiguration, 
  AuthCredentials, 
  PerformanceThresholds, 
  SecuritySettings,
  ReportingOptions,
  TestDataSet,
  ExecutionMode,
  TestCategory,
  VerificationLevel
} from '../types';

// Environment variable validation schema
const EnvSchema = z.object({
  // API Configuration
  VERIFICATION_API_BASE_URL: z.string().url().default('http://localhost:3000'),
  VERIFICATION_API_KEY: z.string().min(1, 'API key is required'),
  VERIFICATION_WEBHOOK_SECRET: z.string().min(1, 'Webhook secret is required'),
  VERIFICATION_ADMIN_TOKEN: z.string().optional(),
  
  // Database Configuration
  VERIFICATION_DATABASE_URL: z.string().url().optional(),
  
  // Test Configuration
  VERIFICATION_TIMEOUT: z.string().transform(Number).default('30000'),
  VERIFICATION_RETRIES: z.string().transform(Number).default('3'),
  VERIFICATION_PARALLEL: z.string().transform(val => val === 'true').default('true'),
  
  // Performance Thresholds
  VERIFICATION_MAX_RESPONSE_TIME: z.string().transform(Number).default('500'),
  VERIFICATION_MIN_THROUGHPUT: z.string().transform(Number).default('100'),
  VERIFICATION_MAX_ERROR_RATE: z.string().transform(Number).default('0.01'),
  VERIFICATION_MAX_MEMORY_USAGE: z.string().transform(Number).default('512'),
  VERIFICATION_MIN_CACHE_HIT_RATE: z.string().transform(Number).default('0.8'),
  
  // Security Settings
  VERIFICATION_ENABLE_REPLAY_TESTS: z.string().transform(val => val === 'true').default('true'),
  VERIFICATION_ENABLE_FUZZING_TESTS: z.string().transform(val => val === 'true').default('false'),
  VERIFICATION_MAX_TIMESTAMP_SKEW: z.string().transform(Number).default('300'),
  VERIFICATION_ENABLE_VULN_SCANNING: z.string().transform(val => val === 'true').default('false'),
  
  // Reporting Configuration
  VERIFICATION_GENERATE_DETAILED_REPORT: z.string().transform(val => val === 'true').default('true'),
  VERIFICATION_INCLUDE_PERF_GRAPHS: z.string().transform(val => val === 'true').default('false'),
  VERIFICATION_EXPORT_FORMATS: z.string().default('json,html'),
  VERIFICATION_EMAIL_NOTIFICATIONS: z.string().transform(val => val === 'true').default('false'),
  VERIFICATION_EMAIL_RECIPIENTS: z.string().default(''),
  VERIFICATION_SLACK_WEBHOOK: z.string().url().optional(),
  VERIFICATION_CRITICAL_THRESHOLD: z.string().transform(Number).default('1'),
  
  // Test Environment
  VERIFICATION_ENVIRONMENT: z.enum(['development', 'staging', 'production']).default('development'),
  VERIFICATION_TEST_DATA_PATH: z.string().default('./tests/verification/data'),
});

export type VerificationEnv = z.infer<typeof EnvSchema>;

/**
 * Configuration loader and validator
 */
export class ConfigurationManager {
  private static instance: ConfigurationManager;
  private config: TestConfiguration | null = null;
  private env: VerificationEnv | null = null;

  private constructor() {}

  static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  /**
   * Load and validate configuration from environment variables
   */
  async loadConfiguration(): Promise<TestConfiguration> {
    if (this.config) {
      return this.config;
    }

    // Validate environment variables
    const envResult = EnvSchema.safeParse(process.env);
    if (!envResult.success) {
      throw new Error(`Environment validation failed: ${envResult.error.message}`);
    }

    this.env = envResult.data;

    // Build configuration object
    this.config = {
      apiBaseUrl: this.env.VERIFICATION_API_BASE_URL,
      timeout: this.env.VERIFICATION_TIMEOUT,
      retries: this.env.VERIFICATION_RETRIES,
      parallelExecution: this.env.VERIFICATION_PARALLEL,
      performanceThresholds: this.buildPerformanceThresholds(),
      securitySettings: this.buildSecuritySettings(),
      reportingOptions: this.buildReportingOptions(),
    };

    return this.config;
  }

  /**
   * Get authentication credentials from environment
   */
  getAuthCredentials(): AuthCredentials {
    if (!this.env) {
      throw new Error('Configuration not loaded. Call loadConfiguration() first.');
    }

    return {
      apiKey: this.env.VERIFICATION_API_KEY,
      webhookSecret: this.env.VERIFICATION_WEBHOOK_SECRET,
      adminToken: this.env.VERIFICATION_ADMIN_TOKEN,
    };
  }

  /**
   * Get current environment name
   */
  getEnvironment(): string {
    return this.env?.VERIFICATION_ENVIRONMENT || 'development';
  }

  /**
   * Get test data path
   */
  getTestDataPath(): string {
    return this.env?.VERIFICATION_TEST_DATA_PATH || './tests/verification/data';
  }

  /**
   * Validate required credentials are present
   */
  validateCredentials(): void {
    const credentials = this.getAuthCredentials();
    
    if (!credentials.apiKey) {
      throw new Error('VERIFICATION_API_KEY environment variable is required');
    }
    
    if (!credentials.webhookSecret) {
      throw new Error('VERIFICATION_WEBHOOK_SECRET environment variable is required');
    }
  }

  /**
   * Get configuration for specific execution mode
   */
  getConfigForMode(mode: ExecutionMode): Partial<TestConfiguration> {
    const baseConfig = this.config!;
    
    switch (mode) {
      case ExecutionMode.QUICK:
        return {
          ...baseConfig,
          timeout: Math.min(baseConfig.timeout, 10000),
          retries: 1,
          performanceThresholds: {
            ...baseConfig.performanceThresholds,
            maxResponseTime: baseConfig.performanceThresholds.maxResponseTime * 2,
          },
        };
      
      case ExecutionMode.FULL:
        return baseConfig;
      
      case ExecutionMode.TARGETED:
        return {
          ...baseConfig,
          parallelExecution: false,
          retries: baseConfig.retries + 1,
        };
      
      case ExecutionMode.CONTINUOUS:
        return {
          ...baseConfig,
          timeout: baseConfig.timeout * 0.5,
          retries: 1,
          reportingOptions: {
            ...baseConfig.reportingOptions,
            generateDetailedReport: false,
            includePerformanceGraphs: false,
          },
        };
      
      default:
        return baseConfig;
    }
  }

  private buildPerformanceThresholds(): PerformanceThresholds {
    return {
      maxResponseTime: this.env!.VERIFICATION_MAX_RESPONSE_TIME,
      minThroughput: this.env!.VERIFICATION_MIN_THROUGHPUT,
      maxErrorRate: this.env!.VERIFICATION_MAX_ERROR_RATE,
      maxMemoryUsage: this.env!.VERIFICATION_MAX_MEMORY_USAGE,
      minCacheHitRate: this.env!.VERIFICATION_MIN_CACHE_HIT_RATE,
    };
  }

  private buildSecuritySettings(): SecuritySettings {
    return {
      enableReplayAttackTests: this.env!.VERIFICATION_ENABLE_REPLAY_TESTS,
      enableInputFuzzingTests: this.env!.VERIFICATION_ENABLE_FUZZING_TESTS,
      maxTimestampSkew: this.env!.VERIFICATION_MAX_TIMESTAMP_SKEW,
      enableVulnerabilityScanning: this.env!.VERIFICATION_ENABLE_VULN_SCANNING,
    };
  }

  private buildReportingOptions(): ReportingOptions {
    const exportFormats = this.env!.VERIFICATION_EXPORT_FORMATS
      .split(',')
      .map(format => format.trim())
      .filter(format => ['json', 'html', 'pdf'].includes(format)) as ('json' | 'html' | 'pdf')[];

    const emailRecipients = this.env!.VERIFICATION_EMAIL_RECIPIENTS
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);

    return {
      generateDetailedReport: this.env!.VERIFICATION_GENERATE_DETAILED_REPORT,
      includePerformanceGraphs: this.env!.VERIFICATION_INCLUDE_PERF_GRAPHS,
      exportFormats,
      notificationSettings: {
        enableEmailNotifications: this.env!.VERIFICATION_EMAIL_NOTIFICATIONS,
        emailRecipients,
        slackWebhook: this.env!.VERIFICATION_SLACK_WEBHOOK,
        criticalIssueThreshold: this.env!.VERIFICATION_CRITICAL_THRESHOLD,
      },
    };
  }
}

/**
 * Test data configuration loader
 */
export class TestDataManager {
  private static instance: TestDataManager;
  private testDataSets: Map<string, TestDataSet> = new Map();
  private configManager: ConfigurationManager;

  private constructor() {
    this.configManager = ConfigurationManager.getInstance();
  }

  static getInstance(): TestDataManager {
    if (!TestDataManager.instance) {
      TestDataManager.instance = new TestDataManager();
    }
    return TestDataManager.instance;
  }

  /**
   * Load test data sets from configuration files
   */
  async loadTestDataSets(): Promise<TestDataSet[]> {
    const testDataPath = this.configManager.getTestDataPath();
    
    // Load default test data sets
    const defaultDataSets = await this.loadDefaultDataSets();
    
    // Load custom test data sets from files
    const customDataSets = await this.loadCustomDataSets(testDataPath);
    
    // Combine and store
    const allDataSets = [...defaultDataSets, ...customDataSets];
    allDataSets.forEach(dataSet => {
      this.testDataSets.set(dataSet.id, dataSet);
    });
    
    return allDataSets;
  }

  /**
   * Get test data set by ID
   */
  getTestDataSet(id: string): TestDataSet | null {
    return this.testDataSets.get(id) || null;
  }

  /**
   * Get all available test data sets
   */
  getAllTestDataSets(): TestDataSet[] {
    return Array.from(this.testDataSets.values());
  }

  /**
   * Get test data sets for specific categories
   */
  getTestDataSetsForCategories(categories: TestCategory[]): TestDataSet[] {
    // Filter test data sets based on categories
    return this.getAllTestDataSets().filter(dataSet => {
      // For now, return all data sets
      // In the future, we could add category metadata to test data sets
      return true;
    });
  }

  private async loadDefaultDataSets(): Promise<TestDataSet[]> {
    return [
      {
        id: 'basic-api-tests',
        name: 'Basic API Test Data',
        description: 'Standard test data for basic API functionality',
        topics: [
          {
            slug: 'test-topic-1',
            title: 'Test Topic 1',
            locale: 'en',
            tags: ['test', 'api'],
            thumbnailUrl: 'https://example.com/thumbnail1.jpg',
            seoTitle: 'Test Topic 1 SEO Title',
            seoDescription: 'Test Topic 1 SEO Description',
            seoKeywords: ['test', 'topic', 'api'],
            mainQuestion: 'What is test topic 1?',
            article: {
              content: 'This is test article content for topic 1.',
              status: 'PUBLISHED',
              seoTitle: 'Test Article 1 SEO Title',
              seoDescription: 'Test Article 1 SEO Description',
              seoKeywords: ['test', 'article'],
            },
            faqItems: [
              {
                question: 'What is the purpose of this test topic?',
                answer: 'This test topic is used for API verification testing.',
                order: 1,
              },
              {
                question: 'How should this data be used?',
                answer: 'This data should be used to verify API functionality.',
                order: 2,
              },
            ],
          },
        ],
        expectedResults: [
          {
            endpoint: '/api/topics',
            method: 'GET',
            expectedStatus: 200,
            expectedFields: ['topics', 'pagination'],
            requiredFields: ['topics'],
            optionalFields: ['pagination'],
          },
          {
            endpoint: '/api/topics/test-topic-1',
            method: 'GET',
            expectedStatus: 200,
            expectedFields: ['slug', 'title', 'article', 'faqItems'],
            requiredFields: ['slug', 'title'],
            optionalFields: ['seoTitle', 'seoDescription', 'thumbnailUrl'],
          },
        ],
      },
      {
        id: 'seo-fields-tests',
        name: 'SEO Fields Test Data',
        description: 'Test data specifically for SEO field validation',
        topics: [
          {
            slug: 'seo-test-topic',
            title: 'SEO Test Topic',
            locale: 'en',
            tags: ['seo', 'test'],
            thumbnailUrl: 'https://example.com/seo-thumbnail.jpg',
            seoTitle: 'SEO Test Topic - Complete Guide',
            seoDescription: 'This is a comprehensive SEO description for the test topic with proper length and keywords.',
            seoKeywords: ['seo', 'test', 'optimization', 'guide'],
            mainQuestion: 'How to test SEO fields?',
            article: {
              content: 'Detailed content about SEO testing with proper structure and keywords.',
              status: 'PUBLISHED',
              seoTitle: 'SEO Article Title - Best Practices',
              seoDescription: 'Learn about SEO best practices and testing methodologies.',
              seoKeywords: ['seo', 'best practices', 'testing'],
            },
            faqItems: [
              {
                question: 'What are SEO fields?',
                answer: 'SEO fields are metadata that help search engines understand content.',
                order: 1,
              },
            ],
          },
        ],
        expectedResults: [
          {
            endpoint: '/api/topics/seo-test-topic',
            method: 'GET',
            expectedStatus: 200,
            expectedFields: ['seoTitle', 'seoDescription', 'seoKeywords', 'thumbnailUrl'],
            requiredFields: ['slug', 'title'],
            optionalFields: ['seoTitle', 'seoDescription', 'seoKeywords', 'thumbnailUrl'],
          },
        ],
      },
    ];
  }

  private async loadCustomDataSets(testDataPath: string): Promise<TestDataSet[]> {
    // In a real implementation, this would load from JSON files in the test data directory
    // For now, return empty array
    return [];
  }
}

// Export singleton instances
export const configManager = ConfigurationManager.getInstance();
export const testDataManager = TestDataManager.getInstance();