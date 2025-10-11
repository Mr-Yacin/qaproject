/**
 * Type definitions for verification tests
 */

export interface TopicTestData {
  slug: string;
  title: string;
  locale: string;
  tags: string[];
  thumbnailUrl?: string | null | undefined;
  seoTitle?: string | null | undefined;
  seoDescription?: string | null | undefined;
  seoKeywords?: string[] | null | undefined;
  mainQuestion: string;
  article: ArticleTestData;
  faqItems: FAQItemTestData[];
}

export interface ArticleTestData {
  content: string;
  status: 'DRAFT' | 'PUBLISHED';
  seoTitle?: string | null | undefined;
  seoDescription?: string | null | undefined;
  seoKeywords?: string[] | null | undefined;
}

export interface FAQItemTestData {
  question: string;
  answer: string;
  order: number;
}

export interface TestConfiguration {
  apiBaseUrl: string;
  authCredentials: {
    apiKey: string;
    webhookSecret: string;
  };
  testDataSets: TopicTestData[];
  performanceThresholds: {
    maxResponseTime: number;
    minThroughput: number;
    maxErrorRate: number;
  };
  securitySettings: {
    enableReplayAttackTests: boolean;
    enableInputFuzzingTests: boolean;
    maxTimestampSkew: number;
  };
}

export interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  error?: string;
  details: {
    request: any;
    response: any;
    expectedSchema?: any;
    validationErrors?: string[];
  };
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  performance?: PerformanceMetrics;
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  field?: string;
  value?: any;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number;
  errorRate: number;
}

export interface ExpectedAPIResponse {
  status: number;
  headers?: Record<string, string>;
  body: any;
  schema?: any;
}