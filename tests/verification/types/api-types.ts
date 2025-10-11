/**
 * API-specific types for verification testing
 */

// API endpoint definitions
export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  requiresAuth: boolean;
  authType?: 'hmac' | 'bearer' | 'basic';
  parameters?: APIParameter[];
  requestSchema?: any;
  responseSchema?: any;
  cacheEnabled: boolean;
  rateLimit?: RateLimit;
}

export interface APIParameter {
  name: string;
  type: 'query' | 'path' | 'header' | 'body';
  dataType: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
  validation?: ParameterValidation;
}

export interface ParameterValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: string[];
  minimum?: number;
  maximum?: number;
}

export interface RateLimit {
  requests: number;
  windowMs: number;
  skipSuccessfulRequests: boolean;
}

// API test request/response types
export interface APITestRequest {
  endpoint: APIEndpoint;
  parameters: Record<string, any>;
  headers: Record<string, string>;
  body?: any;
  timeout?: number;
  followRedirects?: boolean;
}

export interface APITestResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  responseTime: number;
  size: number;
  fromCache: boolean;
}

// HMAC authentication types
export interface HMACAuthConfig {
  secretKey: string;
  algorithm: 'sha256' | 'sha512';
  timestampHeader: string;
  signatureHeader: string;
  timestampTolerance: number;
}

export interface HMACSignature {
  timestamp: number;
  signature: string;
  payload: string;
}

// API validation types
export interface APIValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  schemaCompliant: boolean;
  performanceAcceptable: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  expectedType: string;
  actualType: string;
  path: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  recommendation: string;
}

// Schema validation types
export interface SchemaValidation {
  responseSchema: any;
  requestSchema?: any;
  strictMode: boolean;
  allowAdditionalProperties: boolean;
  validateTypes: boolean;
  validateRequired: boolean;
}

// API endpoint test configuration
export interface EndpointTestConfig {
  endpoint: APIEndpoint;
  testCases: APITestCase[];
  authentication: AuthenticationConfig;
  validation: SchemaValidation;
  performance: PerformanceConfig;
  retryPolicy: RetryPolicy;
}

export interface APITestCase {
  name: string;
  description: string;
  request: APITestRequest;
  expectedResponse: ExpectedResponse;
  setup?: () => Promise<void>;
  cleanup?: () => Promise<void>;
  tags: string[];
}

export interface ExpectedResponse {
  status: number;
  headers?: Record<string, string>;
  bodySchema?: any;
  requiredFields: string[];
  optionalFields: string[];
  maxResponseTime?: number;
  minResponseSize?: number;
  maxResponseSize?: number;
}

export interface AuthenticationConfig {
  type: 'none' | 'hmac' | 'bearer' | 'basic';
  credentials: Record<string, string>;
  hmacConfig?: HMACAuthConfig;
  tokenRefresh?: boolean;
  tokenExpiry?: number;
}

export interface PerformanceConfig {
  maxResponseTime: number;
  minThroughput: number;
  concurrentRequests: number;
  warmupRequests: number;
  measurementDuration: number;
}

export interface RetryPolicy {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
  retryableStatusCodes: number[];
  retryableErrors: string[];
}

// Cache testing types
export interface CacheTestConfig {
  endpoint: string;
  cacheKey: string;
  ttl: number;
  revalidationEndpoint?: string;
  testScenarios: CacheTestScenario[];
}

export interface CacheTestScenario {
  name: string;
  description: string;
  steps: CacheTestStep[];
  expectedBehavior: CacheExpectedBehavior;
}

export interface CacheTestStep {
  action: 'request' | 'wait' | 'revalidate' | 'modify_data';
  endpoint?: string;
  parameters?: Record<string, any>;
  waitTime?: number;
  dataModification?: any;
}

export interface CacheExpectedBehavior {
  shouldHitCache: boolean;
  shouldMissCache: boolean;
  shouldRevalidate: boolean;
  maxCacheAge: number;
  expectedCacheHeaders: string[];
}

// Security testing types
export interface SecurityTestConfig {
  endpoint: APIEndpoint;
  vulnerabilityTests: VulnerabilityTest[];
  authenticationTests: AuthenticationTest[];
  inputValidationTests: InputValidationTest[];
}

export interface VulnerabilityTest {
  name: string;
  type: 'sql_injection' | 'xss' | 'csrf' | 'path_traversal' | 'command_injection';
  payloads: string[];
  expectedBehavior: 'block' | 'sanitize' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AuthenticationTest {
  name: string;
  scenario: 'missing_auth' | 'invalid_signature' | 'expired_timestamp' | 'replay_attack';
  requestModification: RequestModification;
  expectedStatus: number;
  expectedMessage?: string;
}

export interface RequestModification {
  removeHeaders?: string[];
  modifyHeaders?: Record<string, string>;
  modifyBody?: any;
  modifyTimestamp?: number;
}

export interface InputValidationTest {
  name: string;
  field: string;
  invalidInputs: InvalidInput[];
  expectedValidationBehavior: ValidationBehavior;
}

export interface InvalidInput {
  value: any;
  type: 'too_long' | 'too_short' | 'invalid_format' | 'invalid_type' | 'malicious';
  description: string;
}

export interface ValidationBehavior {
  shouldReject: boolean;
  expectedStatus: number;
  expectedErrorField?: string;
  shouldSanitize?: boolean;
}

// Performance testing types
export interface PerformanceTestConfig {
  endpoint: APIEndpoint;
  loadTests: LoadTest[];
  stressTests: StressTest[];
  spikeTests: SpikeTest[];
  enduranceTests: EnduranceTest[];
}

export interface LoadTest {
  name: string;
  concurrentUsers: number;
  duration: number;
  rampUpTime: number;
  requestsPerSecond: number;
  expectedResponseTime: number;
  expectedThroughput: number;
}

export interface StressTest {
  name: string;
  maxConcurrentUsers: number;
  incrementStep: number;
  incrementInterval: number;
  breakingPoint: number;
  recoveryTime: number;
}

export interface SpikeTest {
  name: string;
  baselineUsers: number;
  spikeUsers: number;
  spikeDuration: number;
  spikeInterval: number;
  expectedRecoveryTime: number;
}

export interface EnduranceTest {
  name: string;
  concurrentUsers: number;
  duration: number;
  memoryLeakThreshold: number;
  performanceDegradationThreshold: number;
}

// Data integrity testing types
export interface DataIntegrityTestConfig {
  testScenarios: DataIntegrityScenario[];
  consistencyChecks: ConsistencyCheck[];
  crossReferenceValidation: CrossReferenceValidation[];
}

export interface DataIntegrityScenario {
  name: string;
  description: string;
  dataSetup: DataSetupStep[];
  apiOperations: APIOperation[];
  validationSteps: ValidationStep[];
  cleanup: CleanupStep[];
}

export interface DataSetupStep {
  action: 'create' | 'update' | 'delete';
  entity: string;
  data: any;
  method: 'direct_db' | 'admin_api' | 'public_api';
}

export interface APIOperation {
  endpoint: string;
  method: string;
  parameters: Record<string, any>;
  expectedResult: any;
}

export interface ValidationStep {
  type: 'field_comparison' | 'count_verification' | 'relationship_check';
  description: string;
  validation: (data: any) => boolean;
  errorMessage: string;
}

export interface CleanupStep {
  action: 'delete' | 'restore';
  entity: string;
  identifier: any;
}

export interface ConsistencyCheck {
  name: string;
  description: string;
  adminQuery: string;
  apiEndpoint: string;
  comparisonFunction: (adminData: any, apiData: any) => boolean;
}

export interface CrossReferenceValidation {
  name: string;
  primaryEntity: string;
  relatedEntities: string[];
  validationRules: ValidationRule[];
}

export interface ValidationRule {
  field: string;
  relationship: 'one_to_one' | 'one_to_many' | 'many_to_many';
  constraint: 'required' | 'optional' | 'unique';
  validationFunction: (data: any) => boolean;
}