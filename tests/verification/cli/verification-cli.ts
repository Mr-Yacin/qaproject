#!/usr/bin/env node

/**
 * Verification CLI
 * 
 * Command-line interface for running API verification tests with
 * comprehensive orchestration and reporting capabilities.
 */

import { 
  VerificationOrchestrator, 
  ExecutionMode, 
  TestCategory, 
  VerificationLevel 
} from '../orchestration';

export class VerificationCLI {
  private orchestrator: VerificationOrchestrator;

  constructor() {
    this.orchestrator = new VerificationOrchestrator();
    this.setupEventListeners();
  }

  /**
   * Run verification from command line
   */
  async run(args: string[]): Promise<void> {
    try {
      const options = this.parseArguments(args);
      
      console.log('🚀 Starting API Verification...');
      console.log(`Mode: ${options.mode}`);
      console.log(`Categories: ${options.categories?.join(', ') || 'All'}`);
      console.log(`Levels: ${options.verificationLevels?.join(', ') || 'All'}`);
      console.log('');

      // Create a sample test suite (in real implementation, this would be loaded)
      const testSuite = this.createSampleTestSuite();
      
      // Run verification
      const result = await this.orchestrator.runVerification(testSuite, options);
      
      // Display results
      this.displayResults(result);
      
      // Exit with appropriate code
      process.exit(result.success ? 0 : 1);
      
    } catch (error) {
      console.error('❌ Verification failed:', error);
      process.exit(1);
    }
  }

  /**
   * Parse command line arguments
   */
  private parseArguments(args: string[]): any {
    const options: any = {
      mode: ExecutionMode.FULL,
      formats: ['json', 'console']
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '--mode':
          options.mode = args[++i] as ExecutionMode;
          break;
        case '--quick':
          options.mode = ExecutionMode.QUICK;
          break;
        case '--categories':
          options.categories = args[++i].split(',') as TestCategory[];
          break;
        case '--levels':
          options.verificationLevels = args[++i].split(',') as VerificationLevel[];
          break;
        case '--output':
          options.outputDirectory = args[++i];
          break;
        case '--formats':
          options.formats = args[++i].split(',');
          break;
        case '--parallel':
          options.parallelExecution = true;
          break;
        case '--sequential':
          options.parallelExecution = false;
          break;
        case '--stop-on-failure':
          options.stopOnFirstFailure = true;
          break;
        case '--retry':
          options.retryFailedTests = true;
          break;
        case '--help':
          this.showHelp();
          process.exit(0);
          break;
      }
    }

    return options;
  }

  /**
   * Setup event listeners for progress reporting
   */
  private setupEventListeners(): void {
    this.orchestrator.on('verificationStarted', (data) => {
      console.log(`📋 Starting test suite: ${data.suiteId}`);
    });

    this.orchestrator.on('testCompleted', (data) => {
      const { result } = data;
      const icon = result.status === 'passed' ? '✅' : 
                   result.status === 'failed' ? '❌' : '⏭️';
      console.log(`${icon} ${result.testName} (${result.duration}ms)`);
    });

    this.orchestrator.on('progressUpdated', (data) => {
      const { state } = data;
      const progress = state.progress;
      const percent = progress.percentComplete.toFixed(1);
      process.stdout.write(`\r📊 Progress: ${percent}% (${progress.completedTests}/${progress.totalTests})`);
    });

    this.orchestrator.on('verificationCompleted', () => {
      console.log('\n✨ Verification completed!');
    });

    this.orchestrator.on('verificationFailed', (data) => {
      console.error('\n💥 Verification failed:', data.error.message);
    });
  }

  /**
   * Display verification results
   */
  private displayResults(result: any): void {
    console.log('\n' + '='.repeat(60));
    console.log('                VERIFICATION RESULTS');
    console.log('='.repeat(60));
    
    if (result.report) {
      const summary = result.report.summary;
      console.log(`Overall Status: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`Total Tests: ${summary.totalTests}`);
      console.log(`Passed: ${summary.passedTests}`);
      console.log(`Failed: ${summary.failedTests}`);
      console.log(`Skipped: ${summary.skippedTests}`);
      console.log(`Success Rate: ${((summary.passedTests / summary.totalTests) * 100).toFixed(1)}%`);
      console.log(`Execution Time: ${this.formatDuration(summary.executionTime)}`);
      
      if (result.report.criticalIssues.length > 0) {
        console.log('\n🚨 Critical Issues:');
        result.report.criticalIssues.forEach((issue: any) => {
          console.log(`  • ${issue.title}`);
        });
      }
      
      if (result.reportPaths.json) {
        console.log(`\n📄 Detailed report saved to: ${result.reportPaths.json}`);
      }
    }
    
    console.log('='.repeat(60));
  }

  /**
   * Create sample test suite for demonstration
   */
  private createSampleTestSuite(): any {
    return {
      id: 'api-verification-suite',
      name: 'API Verification Test Suite',
      description: 'Comprehensive API verification after admin changes',
      version: '1.0.0',
      tests: [
        {
          id: 'api-endpoints-test',
          name: 'API Endpoints Test',
          description: 'Test all API endpoints functionality',
          category: TestCategory.API_ENDPOINTS,
          verificationLevel: VerificationLevel.CRITICAL,
          requirements: ['1.1', '1.2', '1.3'],
          dependencies: [],
          timeout: 30000,
          retryable: true,
          execute: async () => ({
            testName: 'API Endpoints Test',
            category: TestCategory.API_ENDPOINTS,
            status: 'passed' as any,
            duration: 1500,
            startTime: new Date(),
            endTime: new Date(),
            details: {},
            verificationLevel: VerificationLevel.CRITICAL,
            requirements: ['1.1', '1.2', '1.3']
          }),
          tags: ['api', 'endpoints']
        }
      ],
      config: {
        mode: ExecutionMode.FULL,
        categories: Object.values(TestCategory),
        verificationLevels: Object.values(VerificationLevel),
        parallelExecution: true,
        maxConcurrency: 4,
        stopOnFirstFailure: false,
        retryFailedTests: false,
        maxRetries: 3
      }
    };
  }

  /**
   * Show help information
   */
  private showHelp(): void {
    console.log(`
API Verification CLI

Usage: verification-cli [options]

Options:
  --mode <mode>           Execution mode (full, quick, targeted, continuous)
  --quick                 Run quick verification (critical tests only)
  --categories <list>     Comma-separated list of test categories
  --levels <list>         Comma-separated list of verification levels
  --output <dir>          Output directory for reports
  --formats <list>        Report formats (json, html, txt)
  --parallel              Enable parallel test execution (default)
  --sequential            Disable parallel test execution
  --stop-on-failure       Stop execution on first failure
  --retry                 Retry failed tests
  --help                  Show this help message

Examples:
  verification-cli --quick
  verification-cli --mode targeted --categories api_endpoints,security
  verification-cli --levels critical,high --output ./reports
  verification-cli --formats json,html --parallel
    `);
  }

  /**
   * Format duration for display
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  const cli = new VerificationCLI();
  cli.run(process.argv.slice(2));
}