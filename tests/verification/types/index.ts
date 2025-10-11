/**
 * Core types and interfaces for API verification testing
 */

// Re-export all types from sub-modules
export * from './test-suite';
export * from './api-types';

// Test execution status enums
export enum TestStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  PASSED = 'passed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  WARNING = 'warning'
}

// Error classification for test failures
export enum ErrorType {
  NETWORK_ERROR = 'network_error',
  AUTHENTICATION_ERROR = 'auth_error',
  VALIDATION_ERROR = 'validation_error',
  PERFORMANCE_ERROR = 'performance_error',
  DATA_INTEGRITY_ERROR = 'data_integrity_error',
  SCHEMA_ERROR = 'schema_error',
  SECURITY_ERROR = 'security_error',
  UNKNOWN_ERROR = 'unknown_error'
}

// Verification levels for different test categories
export enum VerificationLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

// Test categories for organization
export enum TestCategory {
  API_ENDPOINTS = 'api_endpoints',
  SCHEMA_COMPATIBILITY = 'schema_compatibility',
  AUTHENTICATION = 'authentication',
  PERFORMANCE = 'performance',
  DATA_INTEGRITY = 'data_integrity',
  SECURITY = 'security',
  BACKWARD_COMPATIBILITY = 'backward_compatibility'
}

// Base test result interface
export interface TestResult {
  testName: string;
  category: TestCategory;
  status: TestStatus;
  duration: number;
  startTime: Date;
  endTime?: Date;
  error?: TestError;
  details: TestDetails;
  verificationLevel: VerificationLevel;
  requirements: string[];
}

// Test error details
export interface TestError {
  type: ErrorType;
  message: string;
  stack?: string;
  code?: string;
  details?: Record<string, any>;
}

// Test execution details
export interface TestDetails {
  request?: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: any;
  };
  response?: {
    status: number;
    headers?: Record<string, string>;
    body?: any;
    responseTime?: number;
  };
  expectedSchema?: any;
  validationErrors?: string[];
  performanceMetrics?: PerformanceMetrics;
  securityChecks?: SecurityCheckResult[];
}

// Performance measurement data
export interface PerformanceMetrics {
  responseTime: number;
  throughput?: number;
  memoryUsage?: number;
  cpuUsage?: number;
  cacheHitRate?: number;
  databaseQueryTime?: number;
}

// Security check results
export interface SecurityCheckResult {
  checkName: string;
  passed: boolean;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Test result aggregation for reporting
export interface TestResultAggregation {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  warningTests: number;
  executionTime: number;
  overallStatus: TestStatus;
  categoryResults: Record<TestCategory, CategoryResult>;
  criticalFailures: TestResult[];
  performanceSummary: PerformanceSummary;
}

// Category-specific results
export interface CategoryResult {
  category: TestCategory;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  averageExecutionTime: number;
  status: TestStatus;
}

// Performance summary across all tests
export interface PerformanceSummary {
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  slowestEndpoint: string;
  fastestEndpoint: string;
  cacheEffectiveness: number;
}

// Verification report structure
export interface VerificationReport {
  timestamp: Date;
  environment: string;
  schemaVersion: string;
  testSuiteVersion: string;
  summary: TestResultAggregation;
  sections: {
    apiEndpoints: EndpointTestResults;
    schemaCompatibility: SchemaTestResults;
    security: SecurityTestResults;
    performance: PerformanceTestResults;
    dataIntegrity: IntegrityTestResults;
    backwardCompatibility: CompatibilityTestResults;
  };
  recommendations: Recommendation[];
  criticalIssues: CriticalIssue[];
}

// Section-specific result types
export interface EndpointTestResults {
  endpoints: EndpointResult[];
  totalEndpoints: number;
  workingEndpoints: number;
  brokenEndpoints: number;
}

export interface EndpointResult {
  endpoint: string;
  method: string;
  status: TestStatus;
  responseTime: number;
  statusCode: number;
  schemaValid: boolean;
  authenticationWorking: boolean;
}

export interface SchemaTestResults {
  newFieldsWorking: boolean;
  databaseQueriesWorking: boolean;
  indexPerformance: boolean;
  constraintsValid: boolean;
  migrationIssues: string[];
}

export interface SecurityTestResults {
  hmacAuthenticationWorking: boolean;
  signatureValidationWorking: boolean;
  replayAttackPrevention: boolean;
  inputValidationWorking: boolean;
  vulnerabilities: SecurityVulnerability[];
}

export interface SecurityVulnerability {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  endpoint?: string;
  recommendation: string;
}

export interface PerformanceTestResults {
  responseTimesAcceptable: boolean;
  cacheWorking: boolean;
  databasePerformance: boolean;
  memoryUsageNormal: boolean;
  bottlenecks: PerformanceBottleneck[];
}

export interface PerformanceBottleneck {
  component: string;
  issue: string;
  impact: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface IntegrityTestResults {
  adminApiConsistency: boolean;
  dataConsistency: boolean;
  newFieldsIntegrated: boolean;
  crossReferenceValid: boolean;
  inconsistencies: DataInconsistency[];
}

export interface DataInconsistency {
  type: string;
  description: string;
  affectedData: string;
  severity: 'low' | 'medium' | 'high';
}

export interface CompatibilityTestResults {
  existingParametersWork: boolean;
  responseStructureUnchanged: boolean;
  authenticationBackwardCompatible: boolean;
  breakingChanges: BreakingChange[];
}

export interface BreakingChange {
  type: string;
  description: string;
  affectedEndpoints: string[];
  migrationRequired: boolean;
  recommendation: string;
}

// Recommendations and issues
export interface Recommendation {
  category: TestCategory;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  actionItems: string[];
  estimatedEffort: string;
}

export interface CriticalIssue {
  title: string;
  description: string;
  impact: string;
  affectedComponents: string[];
  immediateAction: string;
  rollbackRequired: boolean;
}

// Test execution context
export interface TestExecutionContext {
  environment: string;
  apiBaseUrl: string;
  authCredentials: AuthCredentials;
  testDataSets: TestDataSet[];
  configuration: TestConfiguration;
}

export interface AuthCredentials {
  apiKey: string;
  webhookSecret: string;
  adminToken?: string;
}

export interface TestDataSet {
  id: string;
  name: string;
  description: string;
  topics: TopicTestData[];
  expectedResults: ExpectedAPIResponse[];
}

export interface TopicTestData {
  slug: string;
  title: string;
  locale: string;
  tags: string[];
  thumbnailUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  mainQuestion: string;
  article: ArticleTestData;
  faqItems: FAQItemTestData[];
}

export interface ArticleTestData {
  content: string;
  status: 'DRAFT' | 'PUBLISHED';
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}

export interface FAQItemTestData {
  question: string;
  answer: string;
  order: number;
}

export interface ExpectedAPIResponse {
  endpoint: string;
  method: string;
  expectedStatus: number;
  expectedFields: string[];
  requiredFields: string[];
  optionalFields: string[];
}

// Test configuration interface
export interface TestConfiguration {
  apiBaseUrl: string;
  timeout: number;
  retries: number;
  parallelExecution: boolean;
  performanceThresholds: PerformanceThresholds;
  securitySettings: SecuritySettings;
  reportingOptions: ReportingOptions;
}

export interface PerformanceThresholds {
  maxResponseTime: number;
  minThroughput: number;
  maxErrorRate: number;
  maxMemoryUsage: number;
  minCacheHitRate: number;
}

export interface SecuritySettings {
  enableReplayAttackTests: boolean;
  enableInputFuzzingTests: boolean;
  maxTimestampSkew: number;
  enableVulnerabilityScanning: boolean;
}

export interface ReportingOptions {
  generateDetailedReport: boolean;
  includePerformanceGraphs: boolean;
  exportFormats: ('json' | 'html' | 'pdf')[];
  notificationSettings: NotificationSettings;
}

export interface NotificationSettings {
  enableEmailNotifications: boolean;
  emailRecipients: string[];
  slackWebhook?: string;
  criticalIssueThreshold: number;
}