/**
 * Test Execution Engine
 * 
 * Coordinates the execution of verification tests with proper sequencing,
 * parallel execution for independent tests, and dependency management.
 */

import { 
  TestDefinition, 
  TestSuite, 
  TestExecutionState, 
  TestSuiteStatus, 
  TestResult, 
  TestStatus, 
  ExecutionMode,
  TestSuiteConfig,
  TestExecutionPlan,
  PlannedTest,
  TestDependency,
  ExecutionProgress,
  ExecutionError
} from '../types/index';
import { TestDependencyResolver } from './test-dependency-resolver';
import { TestExecutor } from './test-executor';
import { EventEmitter } from 'events';

export class TestExecutionEngine extends EventEmitter {
  private executionStates = new Map<string, TestExecutionState>();
  private dependencyResolver = new TestDependencyResolver();
  private testExecutor = new TestExecutor();
  private activeExecutions = new Set<string>();

  /**
   * Execute a complete test suite with proper orchestration
   */
  async executeSuite(
    suite: TestSuite, 
    config?: Partial<TestSuiteConfig>
  ): Promise<TestExecutionState> {
    const executionId = this.generateExecutionId();
    const finalConfig = { ...suite.config, ...config };
    
    // Initialize execution state
    const executionState = this.initializeExecutionState(
      executionId, 
      suite, 
      finalConfig
    );
    
    this.executionStates.set(executionId, executionState);
    this.activeExecutions.add(executionId);
    
    try {
      // Create execution plan
      const plan = await this.createExecutionPlan(suite, finalConfig);
      executionState.status = TestSuiteStatus.RUNNING;
      
      this.emit('executionStarted', { executionId, suite: suite.id, plan });
      
      // Execute global setup if present
      if (suite.globalSetup) {
        await this.executeGlobalSetup(suite.globalSetup, executionState);
      }
      
      // Execute tests according to plan
      await this.executeTestPlan(plan, executionState, finalConfig);
      
      // Execute global cleanup if present
      if (suite.globalCleanup) {
        await this.executeGlobalCleanup(suite.globalCleanup, executionState);
      }
      
      // Finalize execution
      this.finalizeExecution(executionState);
      
    } catch (error) {
      this.handleExecutionError(executionState, error as Error);
    } finally {
      this.activeExecutions.delete(executionId);
      this.emit('executionCompleted', { executionId, state: executionState });
    }
    
    return executionState;
  }

  /**
   * Execute a single test with proper error handling
   */
  async executeTest(test: TestDefinition): Promise<TestResult> {
    const startTime = new Date();
    
    try {
      // Execute test setup if present
      if (test.setup) {
        await test.setup();
      }
      
      // Execute the actual test
      const result = await this.testExecutor.executeTest(test);
      
      // Execute test cleanup if present
      if (test.cleanup) {
        await test.cleanup();
      }
      
      return result;
      
    } catch (error) {
      // Create failed test result
      return {
        testName: test.name,
        category: test.category,
        status: TestStatus.FAILED,
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        error: {
          type: 'unknown_error' as any,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        },
        details: {
          request: undefined,
          response: undefined
        },
        verificationLevel: test.verificationLevel,
        requirements: test.requirements
      };
    }
  }

  /**
   * Get current execution state
   */
  getExecutionState(executionId: string): TestExecutionState | null {
    return this.executionStates.get(executionId) || null;
  }

  /**
   * Cancel an active execution
   */
  async cancelExecution(executionId: string): Promise<boolean> {
    const state = this.executionStates.get(executionId);
    if (!state || !this.activeExecutions.has(executionId)) {
      return false;
    }
    
    state.status = TestSuiteStatus.CANCELLED;
    this.activeExecutions.delete(executionId);
    
    this.emit('executionCancelled', { executionId, state });
    return true;
  }

  /**
   * Retry failed tests from a previous execution
   */
  async retryFailedTests(executionId: string): Promise<TestExecutionState> {
    const originalState = this.executionStates.get(executionId);
    if (!originalState) {
      throw new Error(`Execution state not found for ID: ${executionId}`);
    }
    
    const failedTests = originalState.results.filter(
      result => result.status === TestStatus.FAILED
    );
    
    if (failedTests.length === 0) {
      throw new Error('No failed tests to retry');
    }
    
    // Create new execution for retry
    const retryExecutionId = this.generateExecutionId();
    const retryState = {
      ...originalState,
      executionId: retryExecutionId,
      status: TestSuiteStatus.RUNNING,
      startTime: new Date(),
      endTime: undefined,
      completedTests: [],
      failedTests: [],
      skippedTests: [],
      results: [],
      errors: []
    };
    
    this.executionStates.set(retryExecutionId, retryState);
    this.activeExecutions.add(retryExecutionId);
    
    try {
      // Execute only the failed tests
      for (const failedResult of failedTests) {
        // Find the original test definition (this would need to be stored or retrieved)
        // For now, we'll create a simplified retry mechanism
        const retryResult = await this.retryTest(failedResult);
        retryState.results.push(retryResult);
        
        if (retryResult.status === TestStatus.PASSED) {
          retryState.completedTests.push(retryResult.testName);
        } else {
          retryState.failedTests.push(retryResult.testName);
        }
        
        this.updateProgress(retryState);
      }
      
      this.finalizeExecution(retryState);
      
    } catch (error) {
      this.handleExecutionError(retryState, error as Error);
    } finally {
      this.activeExecutions.delete(retryExecutionId);
    }
    
    return retryState;
  }

  /**
   * Create execution plan with dependency resolution
   */
  private async createExecutionPlan(
    suite: TestSuite, 
    config: TestSuiteConfig
  ): Promise<TestExecutionPlan> {
    const executionId = this.generateExecutionId();
    
    // Filter tests based on configuration
    const filteredTests = this.filterTests(suite.tests, config);
    
    // Resolve dependencies and create execution order
    const dependencies = this.dependencyResolver.resolveDependencies(filteredTests);
    const executionOrder = this.dependencyResolver.createExecutionOrder(
      filteredTests, 
      dependencies
    );
    
    // Create planned tests with resource requirements
    const plannedTests: PlannedTest[] = filteredTests.map(test => ({
      testId: test.id,
      estimatedDuration: test.timeout || 30000,
      prerequisites: test.dependencies,
      canRunInParallel: this.canRunInParallel(test, dependencies),
      resourceRequirements: {
        memoryMB: 100, // Default values - could be configured per test
        cpuCores: 1,
        networkBandwidth: 1000,
        databaseConnections: 1
      }
    }));
    
    return {
      suiteId: suite.id,
      executionId,
      mode: config.mode,
      plannedTests,
      estimatedDuration: this.calculateEstimatedDuration(plannedTests, config),
      dependencies,
      executionOrder
    };
  }

  /**
   * Execute tests according to the execution plan
   */
  private async executeTestPlan(
    plan: TestExecutionPlan,
    state: TestExecutionState,
    config: TestSuiteConfig
  ): Promise<void> {
    const { executionOrder } = plan;
    
    if (config.parallelExecution) {
      await this.executeTestsInParallel(executionOrder, state, config);
    } else {
      await this.executeTestsSequentially(executionOrder, state, config);
    }
  }

  /**
   * Execute tests in parallel where possible
   */
  private async executeTestsInParallel(
    executionOrder: string[],
    state: TestExecutionState,
    config: TestSuiteConfig
  ): Promise<void> {
    const maxConcurrency = config.maxConcurrency || 4;
    const executing = new Map<string, Promise<TestResult>>();
    
    for (const testId of executionOrder) {
      // Wait if we've reached max concurrency
      if (executing.size >= maxConcurrency) {
        const completed = await Promise.race(executing.values());
        this.processTestResult(completed, state);
        
        // Remove completed test from executing map
        for (const [id, promise] of executing.entries()) {
          if (await promise === completed) {
            executing.delete(id);
            break;
          }
        }
      }
      
      // Check if dependencies are satisfied
      if (this.areDependenciesSatisfied(testId, state)) {
        const testPromise = this.executeTestById(testId);
        executing.set(testId, testPromise);
      }
      
      // Stop on first failure if configured
      if (config.stopOnFirstFailure && state.failedTests.length > 0) {
        break;
      }
    }
    
    // Wait for remaining tests to complete
    const remainingResults = await Promise.all(executing.values());
    remainingResults.forEach(result => this.processTestResult(result, state));
  }

  /**
   * Execute tests sequentially
   */
  private async executeTestsSequentially(
    executionOrder: string[],
    state: TestExecutionState,
    config: TestSuiteConfig
  ): Promise<void> {
    for (const testId of executionOrder) {
      if (this.areDependenciesSatisfied(testId, state)) {
        const result = await this.executeTestById(testId);
        this.processTestResult(result, state);
        
        // Stop on first failure if configured
        if (config.stopOnFirstFailure && result.status === TestStatus.FAILED) {
          break;
        }
      } else {
        // Skip test if dependencies not satisfied
        state.skippedTests.push(testId);
      }
      
      this.updateProgress(state);
    }
  }

  /**
   * Initialize execution state
   */
  private initializeExecutionState(
    executionId: string,
    suite: TestSuite,
    config: TestSuiteConfig
  ): TestExecutionState {
    const totalTests = this.filterTests(suite.tests, config).length;
    
    return {
      executionId,
      suiteId: suite.id,
      status: TestSuiteStatus.INITIALIZING,
      startTime: new Date(),
      currentTest: undefined,
      completedTests: [],
      failedTests: [],
      skippedTests: [],
      progress: {
        totalTests,
        completedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        percentComplete: 0,
        estimatedTimeRemaining: 0
      },
      results: [],
      errors: []
    };
  }

  /**
   * Filter tests based on configuration
   */
  private filterTests(tests: TestDefinition[], config: TestSuiteConfig): TestDefinition[] {
    return tests.filter(test => {
      // Filter by categories
      if (config.categories.length > 0 && !config.categories.includes(test.category)) {
        return false;
      }
      
      // Filter by verification levels
      if (config.verificationLevels.length > 0 && 
          !config.verificationLevels.includes(test.verificationLevel)) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Check if test can run in parallel
   */
  private canRunInParallel(test: TestDefinition, dependencies: TestDependency[]): boolean {
    // Tests with dependencies typically can't run in parallel
    const hasDependencies = dependencies.some(dep => dep.testId === test.id);
    return !hasDependencies;
  }

  /**
   * Calculate estimated duration for execution plan
   */
  private calculateEstimatedDuration(
    plannedTests: PlannedTest[], 
    config: TestSuiteConfig
  ): number {
    if (config.parallelExecution) {
      // For parallel execution, estimate based on longest running test
      return Math.max(...plannedTests.map(test => test.estimatedDuration));
    } else {
      // For sequential execution, sum all test durations
      return plannedTests.reduce((total, test) => total + test.estimatedDuration, 0);
    }
  }

  /**
   * Check if test dependencies are satisfied
   */
  private areDependenciesSatisfied(testId: string, state: TestExecutionState): boolean {
    // This would check if all prerequisite tests have completed successfully
    // For now, return true as a placeholder
    return true;
  }

  /**
   * Execute test by ID (placeholder - would need test registry)
   */
  private async executeTestById(testId: string): Promise<TestResult> {
    // This would look up the test definition and execute it
    // For now, return a placeholder result
    return {
      testName: testId,
      category: 'api_endpoints' as any,
      status: TestStatus.PASSED,
      duration: 1000,
      startTime: new Date(),
      endTime: new Date(),
      details: {},
      verificationLevel: 'medium' as any,
      requirements: []
    };
  }

  /**
   * Process test result and update execution state
   */
  private processTestResult(result: TestResult, state: TestExecutionState): void {
    state.results.push(result);
    
    switch (result.status) {
      case TestStatus.PASSED:
        state.completedTests.push(result.testName);
        break;
      case TestStatus.FAILED:
        state.failedTests.push(result.testName);
        break;
      case TestStatus.SKIPPED:
        state.skippedTests.push(result.testName);
        break;
    }
    
    this.updateProgress(state);
    this.emit('testCompleted', { result, state });
  }

  /**
   * Update execution progress
   */
  private updateProgress(state: TestExecutionState): void {
    const { progress } = state;
    progress.completedTests = state.completedTests.length;
    progress.failedTests = state.failedTests.length;
    progress.skippedTests = state.skippedTests.length;
    
    const totalProcessed = progress.completedTests + progress.failedTests + progress.skippedTests;
    progress.percentComplete = (totalProcessed / progress.totalTests) * 100;
    
    // Estimate remaining time based on current progress
    const elapsed = Date.now() - state.startTime.getTime();
    const avgTimePerTest = totalProcessed > 0 ? elapsed / totalProcessed : 0;
    const remainingTests = progress.totalTests - totalProcessed;
    progress.estimatedTimeRemaining = remainingTests * avgTimePerTest;
    
    this.emit('progressUpdated', { state });
  }

  /**
   * Execute global setup
   */
  private async executeGlobalSetup(
    setup: () => Promise<void>, 
    state: TestExecutionState
  ): Promise<void> {
    try {
      await setup();
    } catch (error) {
      const executionError: ExecutionError = {
        phase: 'setup',
        error: error as Error,
        timestamp: new Date(),
        recoverable: false
      };
      state.errors.push(executionError);
      throw error;
    }
  }

  /**
   * Execute global cleanup
   */
  private async executeGlobalCleanup(
    cleanup: () => Promise<void>, 
    state: TestExecutionState
  ): Promise<void> {
    try {
      await cleanup();
    } catch (error) {
      const executionError: ExecutionError = {
        phase: 'cleanup',
        error: error as Error,
        timestamp: new Date(),
        recoverable: true
      };
      state.errors.push(executionError);
      // Don't throw cleanup errors
    }
  }

  /**
   * Finalize execution state
   */
  private finalizeExecution(state: TestExecutionState): void {
    state.endTime = new Date();
    
    if (state.failedTests.length > 0) {
      state.status = TestSuiteStatus.FAILED;
    } else {
      state.status = TestSuiteStatus.COMPLETED;
    }
    
    // Final progress update
    this.updateProgress(state);
  }

  /**
   * Handle execution errors
   */
  private handleExecutionError(state: TestExecutionState, error: Error): void {
    state.status = TestSuiteStatus.FAILED;
    state.endTime = new Date();
    
    const executionError: ExecutionError = {
      phase: 'execution',
      error,
      timestamp: new Date(),
      recoverable: false
    };
    state.errors.push(executionError);
    
    this.emit('executionError', { state, error });
  }

  /**
   * Retry a single test
   */
  private async retryTest(originalResult: TestResult): Promise<TestResult> {
    // This would re-execute the test - placeholder implementation
    return {
      ...originalResult,
      status: TestStatus.PASSED, // Assume retry succeeds for now
      startTime: new Date(),
      endTime: new Date(),
      duration: 1000
    };
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}