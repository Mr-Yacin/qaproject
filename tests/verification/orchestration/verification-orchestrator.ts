/**
 * Verification Orchestrator
 * 
 * Main orchestration class that coordinates test execution, result aggregation,
 * and report generation for the complete verification process.
 */

import { EventEmitter } from 'events';
import { 
  TestSuite, 
  TestExecutionState, 
  VerificationReport, 
  TestSuiteConfig, 
  ExecutionMode,
  TestCategory,
  VerificationLevel,
  TestStatus
} from '../types/index';
import { TestExecutionEngine } from './test-execution-engine';
import { VerificationReportGenerator } from '../reporting/verification-report-generator';
import { ReportFormatter } from '../reporting/report-formatter';
import { TestResultAggregator } from '../reporting/test-result-aggregator';

export class VerificationOrchestrator extends EventEmitter {
  private executionEngine: TestExecutionEngine;
  private reportGenerator: VerificationReportGenerator;
  private reportFormatter: ReportFormatter;
  private resultAggregator: TestResultAggregator;
  private activeExecutions = new Map<string, TestExecutionState>();

  constructor() {
    super();
    this.executionEngine = new TestExecutionEngine();
    this.reportGenerator = new VerificationReportGenerator();
    this.reportFormatter = new ReportFormatter();
    this.resultAggregator = new TestResultAggregator();
    
    this.setupEventHandlers();
  }

  /**
   * Run complete verification process
   */
  async runVerification(
    suite: TestSuite,
    options: VerificationOptions = {}
  ): Promise<VerificationResult> {
    const startTime = new Date();
    
    try {
      // Validate suite
      this.validateTestSuite(suite);
      
      // Configure execution
      const config = this.createExecutionConfig(options);
      
      // Execute test suite
      this.emit('verificationStarted', { suiteId: suite.id, config });
      
      const executionState = await this.executionEngine.executeSuite(suite, config);
      this.activeExecutions.set(executionState.executionId, executionState);
      
      // Generate report
      const report = this.reportGenerator.generateReport(
        executionState,
        options.environment || 'test',
        options.schemaVersion || '1.0.0'
      );
      
      // Format and save reports
      const reportPaths = await this.saveReports(report, options);
      
      // Create verification result
      const result: VerificationResult = {
        executionId: executionState.executionId,
        suiteId: suite.id,
        success: executionState.status === 'completed' && report.summary.overallStatus !== TestStatus.FAILED,
        executionState,
        report,
        reportPaths,
        duration: Date.now() - startTime.getTime(),
        timestamp: new Date()
      };
      
      this.emit('verificationCompleted', result);
      
      return result;
      
    } catch (error) {
      const errorResult: VerificationResult = {
        executionId: 'failed',
        suiteId: suite.id,
        success: false,
        executionState: null,
        report: null,
        reportPaths: {},
        duration: Date.now() - startTime.getTime(),
        timestamp: new Date(),
        error: error as Error
      };
      
      this.emit('verificationFailed', { error, suite: suite.id });
      
      return errorResult;
    }
  }

  /**
   * Run quick verification (core tests only)
   */
  async runQuickVerification(suite: TestSuite): Promise<VerificationResult> {
    return this.runVerification(suite, {
      mode: ExecutionMode.QUICK,
      categories: [TestCategory.API_ENDPOINTS, TestCategory.AUTHENTICATION],
      verificationLevels: [VerificationLevel.CRITICAL, VerificationLevel.HIGH]
    });
  }

  /**
   * Run targeted verification for specific categories
   */
  async runTargetedVerification(
    suite: TestSuite, 
    categories: TestCategory[]
  ): Promise<VerificationResult> {
    return this.runVerification(suite, {
      mode: ExecutionMode.TARGETED,
      categories,
      verificationLevels: [VerificationLevel.CRITICAL, VerificationLevel.HIGH, VerificationLevel.MEDIUM]
    });
  }

  /**
   * Get execution status
   */
  getExecutionStatus(executionId: string): ExecutionStatus | null {
    const state = this.activeExecutions.get(executionId);
    if (!state) return null;
    
    return {
      executionId,
      status: state.status,
      progress: state.progress,
      currentTest: state.currentTest,
      startTime: state.startTime,
      estimatedCompletion: this.calculateEstimatedCompletion(state)
    };
  }

  /**
   * Cancel running verification
   */
  async cancelVerification(executionId: string): Promise<boolean> {
    const cancelled = await this.executionEngine.cancelExecution(executionId);
    if (cancelled) {
      this.activeExecutions.delete(executionId);
      this.emit('verificationCancelled', { executionId });
    }
    return cancelled;
  }

  /**
   * Generate report from existing execution state
   */
  generateReport(
    executionState: TestExecutionState,
    environment: string = 'test',
    schemaVersion: string = '1.0.0'
  ): VerificationReport {
    return this.reportGenerator.generateReport(executionState, environment, schemaVersion);
  }

  /**
   * Format report in different formats
   */
  formatReport(report: VerificationReport, format: 'json' | 'html' | 'console'): string {
    switch (format) {
      case 'html':
        return this.reportFormatter.formatAsHTML(report);
      case 'console':
        return this.reportFormatter.formatForConsole(report);
      case 'json':
      default:
        return this.reportFormatter.formatAsJSON(report);
    }
  }

  /**
   * Save reports to files
   */
  async saveReports(
    report: VerificationReport, 
    options: VerificationOptions
  ): Promise<ReportPaths> {
    const reportPaths: ReportPaths = {};
    const timestamp = report.timestamp.toISOString().replace(/[:.]/g, '-');
    const baseDir = options.outputDirectory || './test-results';
    
    try {
      // Save JSON report
      if (!options.formats || options.formats.includes('json')) {
        const jsonPath = `${baseDir}/verification-report-${timestamp}.json`;
        this.reportFormatter.saveReport(report, jsonPath, 'json');
        reportPaths.json = jsonPath;
      }
      
      // Save HTML report
      if (options.formats?.includes('html')) {
        const htmlPath = `${baseDir}/verification-report-${timestamp}.html`;
        this.reportFormatter.saveReport(report, htmlPath, 'html');
        reportPaths.html = htmlPath;
      }
      
      // Save text report
      if (options.formats?.includes('txt')) {
        const txtPath = `${baseDir}/verification-report-${timestamp}.txt`;
        this.reportFormatter.saveReport(report, txtPath, 'txt');
        reportPaths.txt = txtPath;
      }
      
    } catch (error) {
      this.emit('reportSaveError', { error, report });
    }
    
    return reportPaths;
  }

  /**
   * Compare with previous results
   */
  async compareWithPrevious(
    currentReport: VerificationReport,
    previousReportPath?: string
  ): Promise<ComparisonResult | null> {
    if (!previousReportPath) return null;
    
    try {
      // Load previous report (implementation would read from file)
      // For now, return null as placeholder
      return null;
    } catch (error) {
      this.emit('comparisonError', { error, currentReport, previousReportPath });
      return null;
    }
  }

  /**
   * Get verification summary
   */
  getVerificationSummary(report: VerificationReport): VerificationSummary {
    return {
      overallStatus: report.summary.overallStatus,
      totalTests: report.summary.totalTests,
      passedTests: report.summary.passedTests,
      failedTests: report.summary.failedTests,
      successRate: (report.summary.passedTests / report.summary.totalTests) * 100,
      executionTime: report.summary.executionTime,
      criticalIssues: report.criticalIssues.length,
      recommendations: report.recommendations.length,
      timestamp: report.timestamp
    };
  }

  /**
   * Setup event handlers for execution engine
   */
  private setupEventHandlers(): void {
    this.executionEngine.on('executionStarted', (data) => {
      this.emit('testExecutionStarted', data);
    });
    
    this.executionEngine.on('testCompleted', (data) => {
      this.emit('testCompleted', data);
    });
    
    this.executionEngine.on('progressUpdated', (data) => {
      this.emit('progressUpdated', data);
    });
    
    this.executionEngine.on('executionCompleted', (data) => {
      this.emit('testExecutionCompleted', data);
    });
    
    this.executionEngine.on('executionError', (data) => {
      this.emit('testExecutionError', data);
    });
  }

  /**
   * Validate test suite before execution
   */
  private validateTestSuite(suite: TestSuite): void {
    if (!suite.id || !suite.name) {
      throw new Error('Test suite must have id and name');
    }
    
    if (!suite.tests || suite.tests.length === 0) {
      throw new Error('Test suite must contain at least one test');
    }
    
    // Validate test definitions
    suite.tests.forEach(test => {
      if (!test.id || !test.name || !test.execute) {
        throw new Error(`Invalid test definition: ${test.id || 'unknown'}`);
      }
    });
  }

  /**
   * Create execution configuration from options
   */
  private createExecutionConfig(options: VerificationOptions): Partial<TestSuiteConfig> {
    return {
      mode: options.mode || ExecutionMode.FULL,
      categories: options.categories || Object.values(TestCategory),
      verificationLevels: options.verificationLevels || Object.values(VerificationLevel),
      parallelExecution: options.parallelExecution !== false,
      maxConcurrency: options.maxConcurrency || 4,
      stopOnFirstFailure: options.stopOnFirstFailure || false,
      retryFailedTests: options.retryFailedTests || false,
      maxRetries: options.maxRetries || 3
    };
  }

  /**
   * Calculate estimated completion time
   */
  private calculateEstimatedCompletion(state: TestExecutionState): Date | null {
    if (state.progress.estimatedTimeRemaining <= 0) return null;
    
    return new Date(Date.now() + state.progress.estimatedTimeRemaining);
  }
}

// Interface definitions
export interface VerificationOptions {
  mode?: ExecutionMode;
  categories?: TestCategory[];
  verificationLevels?: VerificationLevel[];
  parallelExecution?: boolean;
  maxConcurrency?: number;
  stopOnFirstFailure?: boolean;
  retryFailedTests?: boolean;
  maxRetries?: number;
  environment?: string;
  schemaVersion?: string;
  outputDirectory?: string;
  formats?: ('json' | 'html' | 'txt')[];
}

export interface VerificationResult {
  executionId: string;
  suiteId: string;
  success: boolean;
  executionState: TestExecutionState | null;
  report: VerificationReport | null;
  reportPaths: ReportPaths;
  duration: number;
  timestamp: Date;
  error?: Error;
}

export interface ReportPaths {
  json?: string;
  html?: string;
  txt?: string;
}

export interface ExecutionStatus {
  executionId: string;
  status: string;
  progress: {
    totalTests: number;
    completedTests: number;
    failedTests: number;
    skippedTests: number;
    percentComplete: number;
    estimatedTimeRemaining: number;
  };
  currentTest?: string;
  startTime: Date;
  estimatedCompletion: Date | null;
}

export interface ComparisonResult {
  previousReport: VerificationReport;
  currentReport: VerificationReport;
  trends: {
    successRateChange: number;
    executionTimeChange: number;
    newFailures: string[];
    resolvedFailures: string[];
  };
}

export interface VerificationSummary {
  overallStatus: TestStatus;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  successRate: number;
  executionTime: number;
  criticalIssues: number;
  recommendations: number;
  timestamp: Date;
}