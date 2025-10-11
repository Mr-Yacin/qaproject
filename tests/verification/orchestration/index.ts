/**
 * Test Orchestration and Reporting System
 * 
 * Main exports for the verification test orchestration system including
 * test execution engine, dependency resolution, and comprehensive reporting.
 */

// Core orchestration components
export { TestExecutionEngine } from './test-execution-engine';
export { TestDependencyResolver, type DependencyGraph } from './test-dependency-resolver';
export { TestExecutor, type ExecutionStats } from './test-executor';
export { 
  VerificationOrchestrator, 
  type VerificationOptions,
  type VerificationResult,
  type ReportPaths,
  type ExecutionStatus,
  type ComparisonResult,
  type VerificationSummary
} from './verification-orchestrator';

// Reporting components
export { VerificationReportGenerator } from '../reporting/verification-report-generator';
export { ReportFormatter } from '../reporting/report-formatter';
export { 
  TestResultAggregator,
  type CategoryAggregation,
  type LevelAggregation,
  type ErrorAggregation,
  type PerformanceAggregation,
  type TrendAnalysis,
  type CoverageAnalysis
} from '../reporting/test-result-aggregator';

// Re-export types for convenience
export * from '../types';