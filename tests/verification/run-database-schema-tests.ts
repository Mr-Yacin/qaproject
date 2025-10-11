#!/usr/bin/env node

/**
 * Database Schema Compatibility Test Runner
 * 
 * Runs database schema compatibility validation tests including
 * performance tests and constraint validation tests.
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

interface TestRunResult {
  testFile: string;
  success: boolean;
  duration: number;
  output: string;
  error?: string;
}

class DatabaseSchemaTestRunner {
  private testResults: TestRunResult[] = [];
  private startTime: number = 0;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Run all database schema compatibility tests
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Database Schema Compatibility Validation');
    console.log('=' .repeat(60));

    // Verify environment setup
    await this.verifyEnvironment();

    // Define test files to run
    const testFiles = [
      'database-schema-compatibility.test.ts',
      'database-performance.test.ts',
      'database-constraints.test.ts'
    ];

    // Run each test file
    for (const testFile of testFiles) {
      await this.runTestFile(testFile);
    }

    // Generate summary report
    this.generateSummaryReport();
  }

  /**
   * Verify environment is set up correctly for testing
   */
  private async verifyEnvironment(): Promise<void> {
    console.log('🔍 Verifying test environment...');

    // Check if .env file exists
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) {
      console.warn('⚠️  No .env file found, using system environment variables');
    }

    // Check required environment variables
    const requiredVars = ['DATABASE_URL'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Verify database connectivity
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.$connect();
      await prisma.$disconnect();
      console.log('✅ Database connectivity verified');
    } catch (error) {
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    console.log('✅ Environment verification complete');
  }

  /**
   * Run a specific test file
   */
  private async runTestFile(testFile: string): Promise<void> {
    console.log(`\n🧪 Running ${testFile}...`);
    const testStartTime = Date.now();
    
    try {
      const testPath = path.join(__dirname, testFile);
      
      if (!fs.existsSync(testPath)) {
        throw new Error(`Test file not found: ${testPath}`);
      }

      // Run the test using vitest
      const command = `npx vitest run ${testFile} --config ${path.join(__dirname, 'vitest.config.ts')}`;
      const output = execSync(command, {
        cwd: __dirname,
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const duration = Date.now() - testStartTime;
      
      this.testResults.push({
        testFile,
        success: true,
        duration,
        output
      });

      console.log(`✅ ${testFile} completed successfully (${duration}ms)`);
      
    } catch (error) {
      const duration = Date.now() - testStartTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.testResults.push({
        testFile,
        success: false,
        duration,
        output: '',
        error: errorMessage
      });

      console.log(`❌ ${testFile} failed (${duration}ms)`);
      console.log(`   Error: ${errorMessage}`);
    }
  }

  /**
   * Generate and display summary report
   */
  private generateSummaryReport(): void {
    const totalDuration = Date.now() - this.startTime;
    const successfulTests = this.testResults.filter(r => r.success);
    const failedTests = this.testResults.filter(r => !r.success);

    console.log('\n📊 Database Schema Compatibility Validation Summary');
    console.log('=' .repeat(60));
    
    console.log(`Total Test Files: ${this.testResults.length}`);
    console.log(`Successful: ${successfulTests.length}`);
    console.log(`Failed: ${failedTests.length}`);
    console.log(`Total Duration: ${totalDuration}ms`);
    
    if (successfulTests.length > 0) {
      console.log('\n✅ Successful Tests:');
      successfulTests.forEach(result => {
        console.log(`   ✓ ${result.testFile} (${result.duration}ms)`);
      });
    }
    
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      failedTests.forEach(result => {
        console.log(`   ✗ ${result.testFile} (${result.duration}ms)`);
        console.log(`     Error: ${result.error}`);
      });
    }

    // Performance summary
    const avgDuration = this.testResults.length > 0 
      ? Math.round(this.testResults.reduce((sum, r) => sum + r.duration, 0) / this.testResults.length)
      : 0;
    
    console.log(`\n⏱️  Performance Summary:`);
    console.log(`   Average test duration: ${avgDuration}ms`);
    console.log(`   Total execution time: ${totalDuration}ms`);

    // Recommendations
    console.log('\n💡 Recommendations:');
    
    if (failedTests.length > 0) {
      console.log('   • Review and fix failed tests before proceeding');
      console.log('   • Check database schema migrations are up to date');
      console.log('   • Verify all required indexes are in place');
    } else {
      console.log('   • All database schema compatibility tests passed');
      console.log('   • Schema changes appear to be backward compatible');
      console.log('   • Performance is within acceptable thresholds');
    }

    // Exit with appropriate code
    if (failedTests.length > 0) {
      console.log('\n🚨 Some tests failed. Please review and fix issues before deployment.');
      process.exit(1);
    } else {
      console.log('\n🎉 All database schema compatibility tests passed!');
      process.exit(0);
    }
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  const runner = new DatabaseSchemaTestRunner();
  
  runner.runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

export { DatabaseSchemaTestRunner };