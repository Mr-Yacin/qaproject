/**
 * Verification test setup and configuration
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { configManager, testDataManager } from './config';
import { TestExecutionContext } from './types';
import path from 'path';

// Load environment variables from .env file
try {
  const dotenv = require('dotenv');
  // Load from root .env file first
  const rootEnvPath = path.resolve(__dirname, '../../.env');
  dotenv.config({ path: rootEnvPath });
  
  // Then load verification-specific .env if it exists
  const verificationEnvPath = path.resolve(__dirname, '.env');
  dotenv.config({ path: verificationEnvPath });
} catch (error) {
  console.warn('Could not load .env file, using system environment variables');
}

// Global test context
let globalTestContext: TestExecutionContext | null = null;

/**
 * Global setup - runs once before all tests
 */
beforeAll(async () => {
  console.log('🚀 Setting up API verification test environment...');
  
  try {
    // Load configuration
    const config = await configManager.loadConfiguration();
    console.log(`📋 Configuration loaded for environment: ${configManager.getEnvironment()}`);
    
    // Validate credentials
    configManager.validateCredentials();
    console.log('🔐 Authentication credentials validated');
    
    // Load test data sets
    const testDataSets = await testDataManager.loadTestDataSets();
    console.log(`📊 Loaded ${testDataSets.length} test data sets`);
    
    // Create global test context
    globalTestContext = {
      environment: configManager.getEnvironment(),
      apiBaseUrl: config.apiBaseUrl,
      authCredentials: configManager.getAuthCredentials(),
      testDataSets,
      configuration: config,
    };
    
    // Verify API is accessible
    await verifyAPIAccessibility();
    console.log('✅ API accessibility verified');
    
    console.log('🎯 Verification test environment ready');
  } catch (error) {
    console.error('❌ Failed to set up test environment:', error);
    throw error;
  }
});

/**
 * Global teardown - runs once after all tests
 */
afterAll(async () => {
  console.log('🧹 Cleaning up verification test environment...');
  
  try {
    // Cleanup any global resources
    await cleanupGlobalResources();
    
    // Reset global context
    globalTestContext = null;
    
    console.log('✅ Verification test environment cleaned up');
  } catch (error) {
    console.error('⚠️ Error during cleanup:', error);
    // Don't throw here to avoid masking test failures
  }
});

/**
 * Test setup - runs before each test
 */
beforeEach(async (context) => {
  // Set test start time for performance measurement
  (context as any).testStartTime = Date.now();
  
  // Log test start
  console.log(`🧪 Starting test: ${context.task?.name || 'Unknown'}`);
});

/**
 * Test teardown - runs after each test
 */
afterEach(async (context) => {
  const duration = Date.now() - ((context as any).testStartTime || 0);
  const status = context.task?.result?.state || 'unknown';
  
  console.log(`📊 Test completed: ${context.task?.name || 'Unknown'} (${status}) - ${duration}ms`);
  
  // Cleanup test-specific resources if needed
  await cleanupTestResources();
});

/**
 * Verify API accessibility
 */
async function verifyAPIAccessibility(): Promise<void> {
  if (!globalTestContext) {
    throw new Error('Global test context not initialized');
  }
  
  const { apiBaseUrl } = globalTestContext;
  
  try {
    // Simple health check - try to access the API root
    const response = await fetch(`${apiBaseUrl}/api/topics?limit=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}: ${response.statusText}`);
    }
    
    // Try to parse JSON response
    await response.json();
  } catch (error) {
    throw new Error(`API accessibility check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Cleanup global resources
 */
async function cleanupGlobalResources(): Promise<void> {
  // Add any global cleanup logic here
  // For example: close database connections, cleanup temp files, etc.
}

/**
 * Cleanup test-specific resources
 */
async function cleanupTestResources(): Promise<void> {
  // Add any test-specific cleanup logic here
  // For example: cleanup test data, reset state, etc.
}

/**
 * Get global test context
 */
export function getTestContext(): TestExecutionContext {
  if (!globalTestContext) {
    throw new Error('Test context not initialized. Make sure tests are running with proper setup.');
  }
  return globalTestContext;
}

/**
 * Helper function to get API base URL
 */
export function getApiBaseUrl(): string {
  return getTestContext().apiBaseUrl;
}

/**
 * Helper function to get auth credentials
 */
export function getAuthCredentials() {
  return getTestContext().authCredentials;
}

/**
 * Helper function to get test configuration
 */
export function getTestConfiguration() {
  return getTestContext().configuration;
}

/**
 * Helper function to get test data sets
 */
export function getTestDataSets() {
  return getTestContext().testDataSets;
}

/**
 * Helper function to create authenticated headers for HMAC
 */
export function createAuthHeaders(payload: string = ''): Record<string, string> {
  const credentials = getAuthCredentials();
  const timestamp = Math.floor(Date.now() / 1000);
  
  // Create HMAC signature
  const crypto = require('crypto');
  const message = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', credentials.webhookSecret)
    .update(message)
    .digest('hex');
  
  return {
    'X-API-Key': credentials.apiKey,
    'X-Timestamp': timestamp.toString(),
    'X-Signature': signature,
    'Content-Type': 'application/json',
  };
}

/**
 * Helper function to make authenticated API requests
 */
export async function makeAuthenticatedRequest(
  endpoint: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<Response> {
  const apiBaseUrl = getApiBaseUrl();
  const url = `${apiBaseUrl}${endpoint}`;
  
  const body = options.body ? JSON.stringify(options.body) : '';
  const authHeaders = createAuthHeaders(body);
  
  const requestOptions: RequestInit = {
    method: options.method || 'GET',
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  };
  
  if (body && (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH')) {
    requestOptions.body = body;
  }
  
  return fetch(url, requestOptions);
}

// Export test utilities for use in test files
export * from './utils';
export * from './types';
export * from './config';