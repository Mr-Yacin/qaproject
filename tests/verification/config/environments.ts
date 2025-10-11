/**
 * Environment-specific configuration presets
 */

import { TestConfiguration, ExecutionMode } from '../types';

export interface EnvironmentConfig {
  name: string;
  description: string;
  apiBaseUrl: string;
  defaultMode: ExecutionMode;
  configuration: Partial<TestConfiguration>;
}

/**
 * Development environment configuration
 */
export const developmentConfig: EnvironmentConfig = {
  name: 'development',
  description: 'Local development environment',
  apiBaseUrl: 'http://localhost:3000',
  defaultMode: ExecutionMode.QUICK,
  configuration: {
    timeout: 10000,
    retries: 2,
    parallelExecution: true,
    performanceThresholds: {
      maxResponseTime: 1000,
      minThroughput: 50,
      maxErrorRate: 0.05,
      maxMemoryUsage: 1024,
      minCacheHitRate: 0.7,
    },
    securitySettings: {
      enableReplayAttackTests: true,
      enableInputFuzzingTests: false,
      maxTimestampSkew: 600,
      enableVulnerabilityScanning: false,
    },
    reportingOptions: {
      generateDetailedReport: true,
      includePerformanceGraphs: false,
      exportFormats: ['json'],
      notificationSettings: {
        enableEmailNotifications: false,
        emailRecipients: [],
        criticalIssueThreshold: 1,
      },
    },
  },
};

/**
 * Staging environment configuration
 */
export const stagingConfig: EnvironmentConfig = {
  name: 'staging',
  description: 'Staging environment for pre-production testing',
  apiBaseUrl: 'https://staging-api.example.com',
  defaultMode: ExecutionMode.FULL,
  configuration: {
    timeout: 15000,
    retries: 3,
    parallelExecution: true,
    performanceThresholds: {
      maxResponseTime: 750,
      minThroughput: 75,
      maxErrorRate: 0.02,
      maxMemoryUsage: 768,
      minCacheHitRate: 0.8,
    },
    securitySettings: {
      enableReplayAttackTests: true,
      enableInputFuzzingTests: true,
      maxTimestampSkew: 300,
      enableVulnerabilityScanning: true,
    },
    reportingOptions: {
      generateDetailedReport: true,
      includePerformanceGraphs: true,
      exportFormats: ['json', 'html'],
      notificationSettings: {
        enableEmailNotifications: true,
        emailRecipients: ['dev-team@example.com'],
        criticalIssueThreshold: 1,
      },
    },
  },
};

/**
 * Production environment configuration
 */
export const productionConfig: EnvironmentConfig = {
  name: 'production',
  description: 'Production environment for critical validation',
  apiBaseUrl: 'https://api.example.com',
  defaultMode: ExecutionMode.TARGETED,
  configuration: {
    timeout: 30000,
    retries: 5,
    parallelExecution: false, // More conservative in production
    performanceThresholds: {
      maxResponseTime: 500,
      minThroughput: 100,
      maxErrorRate: 0.01,
      maxMemoryUsage: 512,
      minCacheHitRate: 0.85,
    },
    securitySettings: {
      enableReplayAttackTests: true,
      enableInputFuzzingTests: false, // Disabled in production
      maxTimestampSkew: 300,
      enableVulnerabilityScanning: false, // Use dedicated security tools
    },
    reportingOptions: {
      generateDetailedReport: true,
      includePerformanceGraphs: true,
      exportFormats: ['json', 'html', 'pdf'],
      notificationSettings: {
        enableEmailNotifications: true,
        emailRecipients: ['ops-team@example.com', 'dev-leads@example.com'],
        criticalIssueThreshold: 0, // Alert on any critical issue
      },
    },
  },
};

/**
 * CI/CD environment configuration
 */
export const cicdConfig: EnvironmentConfig = {
  name: 'cicd',
  description: 'Continuous integration/deployment environment',
  apiBaseUrl: 'http://test-api:3000',
  defaultMode: ExecutionMode.QUICK,
  configuration: {
    timeout: 20000,
    retries: 2,
    parallelExecution: true,
    performanceThresholds: {
      maxResponseTime: 2000, // More lenient for CI environment
      minThroughput: 25,
      maxErrorRate: 0.1,
      maxMemoryUsage: 2048,
      minCacheHitRate: 0.6,
    },
    securitySettings: {
      enableReplayAttackTests: true,
      enableInputFuzzingTests: false,
      maxTimestampSkew: 600,
      enableVulnerabilityScanning: false,
    },
    reportingOptions: {
      generateDetailedReport: false,
      includePerformanceGraphs: false,
      exportFormats: ['json'],
      notificationSettings: {
        enableEmailNotifications: false,
        emailRecipients: [],
        criticalIssueThreshold: 5,
      },
    },
  },
};

/**
 * Get configuration for specific environment
 */
export function getEnvironmentConfig(environment: string): EnvironmentConfig {
  switch (environment.toLowerCase()) {
    case 'development':
    case 'dev':
      return developmentConfig;
    
    case 'staging':
    case 'stage':
      return stagingConfig;
    
    case 'production':
    case 'prod':
      return productionConfig;
    
    case 'ci':
    case 'cicd':
    case 'continuous-integration':
      return cicdConfig;
    
    default:
      console.warn(`Unknown environment: ${environment}. Using development config.`);
      return developmentConfig;
  }
}

/**
 * List all available environment configurations
 */
export function listEnvironments(): EnvironmentConfig[] {
  return [
    developmentConfig,
    stagingConfig,
    productionConfig,
    cicdConfig,
  ];
}

/**
 * Validate environment configuration
 */
export function validateEnvironmentConfig(config: EnvironmentConfig): string[] {
  const errors: string[] = [];
  
  if (!config.name) {
    errors.push('Environment name is required');
  }
  
  if (!config.apiBaseUrl) {
    errors.push('API base URL is required');
  }
  
  try {
    new URL(config.apiBaseUrl);
  } catch {
    errors.push('API base URL must be a valid URL');
  }
  
  if (config.configuration.timeout && config.configuration.timeout < 1000) {
    errors.push('Timeout must be at least 1000ms');
  }
  
  if (config.configuration.retries && config.configuration.retries < 0) {
    errors.push('Retries must be non-negative');
  }
  
  const perfThresholds = config.configuration.performanceThresholds;
  if (perfThresholds) {
    if (perfThresholds.maxResponseTime && perfThresholds.maxResponseTime < 100) {
      errors.push('Max response time must be at least 100ms');
    }
    
    if (perfThresholds.maxErrorRate && (perfThresholds.maxErrorRate < 0 || perfThresholds.maxErrorRate > 1)) {
      errors.push('Max error rate must be between 0 and 1');
    }
    
    if (perfThresholds.minCacheHitRate && (perfThresholds.minCacheHitRate < 0 || perfThresholds.minCacheHitRate > 1)) {
      errors.push('Min cache hit rate must be between 0 and 1');
    }
  }
  
  return errors;
}