/**
 * Test suite management types and interfaces
 */

import { TestResult, TestStatus, TestCategory, VerificationLevel } from './index';

// Test suite execution status
export enum TestSuiteStatus {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// Test execution modes
export enum ExecutionMode {
  FULL = 'full',           // Complete test suite
  QUICK = 'quick',         // Core functionality only
  TARGETED = 'targeted',   // Specific components
  CONTINUOUS = 'continuous' // Ongoing monitoring
}

// Test suite configuration
export interface TestSuiteConfig {
  mode: ExecutionMode;
  categories: TestCategory[];
  verificationLevels: VerificationLevel[];
  parallelExecution: boolean;
  maxConcurrency: number;
  stopOnFirstFailure: boolean;
  retryFailedTests: boolean;
  maxRetries: number;
}

// Individual test definition
export interface TestDefinition {
  id: string;
  name: string;
  description: string;
  category: TestCategory;
  verificationLevel: VerificationLevel;
  requirements: string[];
  dependencies: string[];
  timeout: number;
  retryable: boolean;
  setup?: () => Promise<void>;
  execute: () => Promise<TestResult>;
  cleanup?: () => Promise<void>;
  tags: string[];
}

// Test suite definition
export interface TestSuite {
  id: string;
  name: string;
  description: string;
  version: string;
  tests: TestDefinition[];
  globalSetup?: () => Promise<void>;
  globalCleanup?: () => Promise<void>;
  config: TestSuiteConfig;
}

// Test execution plan
export interface TestExecutionPlan {
  suiteId: string;
  executionId: string;
  mode: ExecutionMode;
  plannedTests: PlannedTest[];
  estimatedDuration: number;
  dependencies: TestDependency[];
  executionOrder: string[];
}

export interface PlannedTest {
  testId: string;
  estimatedDuration: number;
  prerequisites: string[];
  canRunInParallel: boolean;
  resourceRequirements: ResourceRequirements;
}

export interface TestDependency {
  testId: string;
  dependsOn: string[];
  dependencyType: 'hard' | 'soft';
}

export interface ResourceRequirements {
  memoryMB: number;
  cpuCores: number;
  networkBandwidth: number;
  databaseConnections: number;
}

// Test execution state
export interface TestExecutionState {
  executionId: string;
  suiteId: string;
  status: TestSuiteStatus;
  startTime: Date;
  endTime?: Date;
  currentTest?: string;
  completedTests: string[];
  failedTests: string[];
  skippedTests: string[];
  progress: ExecutionProgress;
  results: TestResult[];
  errors: ExecutionError[];
}

export interface ExecutionProgress {
  totalTests: number;
  completedTests: number;
  failedTests: number;
  skippedTests: number;
  percentComplete: number;
  estimatedTimeRemaining: number;
}

export interface ExecutionError {
  testId?: string;
  phase: 'setup' | 'execution' | 'cleanup' | 'teardown';
  error: Error;
  timestamp: Date;
  recoverable: boolean;
}

// Test runner interface
export interface TestRunner {
  executeTest(test: TestDefinition): Promise<TestResult>;
  executeSuite(suite: TestSuite, config?: Partial<TestSuiteConfig>): Promise<TestExecutionState>;
  getExecutionState(executionId: string): TestExecutionState | null;
  cancelExecution(executionId: string): Promise<boolean>;
  retryFailedTests(executionId: string): Promise<TestExecutionState>;
}

// Test registry for managing test definitions
export interface TestRegistry {
  registerTest(test: TestDefinition): void;
  registerSuite(suite: TestSuite): void;
  getTest(testId: string): TestDefinition | null;
  getSuite(suiteId: string): TestSuite | null;
  getTestsByCategory(category: TestCategory): TestDefinition[];
  getTestsByLevel(level: VerificationLevel): TestDefinition[];
  listAllTests(): TestDefinition[];
  listAllSuites(): TestSuite[];
}

// Test scheduler for managing execution timing
export interface TestScheduler {
  scheduleExecution(suiteId: string, schedule: ExecutionSchedule): string;
  cancelScheduledExecution(scheduleId: string): boolean;
  getScheduledExecutions(): ScheduledExecution[];
  executeNow(suiteId: string, config?: Partial<TestSuiteConfig>): Promise<string>;
}

export interface ExecutionSchedule {
  cronExpression: string;
  timezone: string;
  enabled: boolean;
  config: TestSuiteConfig;
  notificationSettings: {
    onSuccess: boolean;
    onFailure: boolean;
    onCriticalFailure: boolean;
  };
}

export interface ScheduledExecution {
  scheduleId: string;
  suiteId: string;
  schedule: ExecutionSchedule;
  nextExecution: Date;
  lastExecution?: Date;
  lastResult?: TestExecutionState;
}

// Test result storage and retrieval
export interface TestResultStore {
  saveResult(result: TestResult): Promise<void>;
  saveExecutionState(state: TestExecutionState): Promise<void>;
  getResult(testId: string, executionId: string): Promise<TestResult | null>;
  getExecutionState(executionId: string): Promise<TestExecutionState | null>;
  getExecutionHistory(suiteId: string, limit?: number): Promise<TestExecutionState[]>;
  getTestHistory(testId: string, limit?: number): Promise<TestResult[]>;
  cleanup(olderThan: Date): Promise<number>;
}

// Test monitoring and alerting
export interface TestMonitor {
  startMonitoring(executionId: string): void;
  stopMonitoring(executionId: string): void;
  getMetrics(executionId: string): ExecutionMetrics;
  setAlertThresholds(thresholds: AlertThresholds): void;
  onAlert(callback: (alert: TestAlert) => void): void;
}

export interface ExecutionMetrics {
  executionId: string;
  duration: number;
  memoryUsage: number;
  cpuUsage: number;
  networkUsage: number;
  testThroughput: number;
  errorRate: number;
  resourceUtilization: ResourceUtilization;
}

export interface ResourceUtilization {
  memory: {
    used: number;
    available: number;
    peak: number;
  };
  cpu: {
    usage: number;
    cores: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    requestsPerSecond: number;
  };
  database: {
    connections: number;
    queryTime: number;
    queriesPerSecond: number;
  };
}

export interface AlertThresholds {
  maxExecutionTime: number;
  maxMemoryUsage: number;
  maxCpuUsage: number;
  maxErrorRate: number;
  minSuccessRate: number;
}

export interface TestAlert {
  type: 'performance' | 'failure' | 'resource' | 'timeout';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  executionId: string;
  testId?: string;
  timestamp: Date;
  metrics: Partial<ExecutionMetrics>;
  actionRequired: boolean;
}