/**
 * Test scenario configurations for different verification modes
 */

import { 
  TestCategory, 
  VerificationLevel, 
  ExecutionMode,
  TestDefinition 
} from '../types';

export interface TestScenarioConfig {
  name: string;
  description: string;
  mode: ExecutionMode;
  categories: TestCategory[];
  verificationLevels: VerificationLevel[];
  estimatedDuration: number; // in minutes
  prerequisites: string[];
  testSelectionCriteria: TestSelectionCriteria;
}

export interface TestSelectionCriteria {
  includeCategories: TestCategory[];
  excludeCategories?: TestCategory[];
  includeVerificationLevels: VerificationLevel[];
  excludeVerificationLevels?: VerificationLevel[];
  includeTags?: string[];
  excludeTags?: string[];
  maxExecutionTime?: number;
  requiresCleanEnvironment?: boolean;
}

/**
 * Quick verification scenario - essential tests only
 */
export const quickVerificationScenario: TestScenarioConfig = {
  name: 'Quick Verification',
  description: 'Essential API functionality tests for rapid feedback',
  mode: ExecutionMode.QUICK,
  categories: [
    TestCategory.API_ENDPOINTS,
    TestCategory.AUTHENTICATION,
  ],
  verificationLevels: [
    VerificationLevel.CRITICAL,
    VerificationLevel.HIGH,
  ],
  estimatedDuration: 5,
  prerequisites: [
    'API server running',
    'Valid authentication credentials',
  ],
  testSelectionCriteria: {
    includeCategories: [
      TestCategory.API_ENDPOINTS,
      TestCategory.AUTHENTICATION,
    ],
    includeVerificationLevels: [
      VerificationLevel.CRITICAL,
      VerificationLevel.HIGH,
    ],
    includeTags: ['smoke', 'critical'],
    maxExecutionTime: 10000, // 10 seconds per test
    requiresCleanEnvironment: false,
  },
};

/**
 * Full verification scenario - comprehensive testing
 */
export const fullVerificationScenario: TestScenarioConfig = {
  name: 'Full Verification',
  description: 'Comprehensive API verification including all test categories',
  mode: ExecutionMode.FULL,
  categories: [
    TestCategory.API_ENDPOINTS,
    TestCategory.SCHEMA_COMPATIBILITY,
    TestCategory.AUTHENTICATION,
    TestCategory.PERFORMANCE,
    TestCategory.DATA_INTEGRITY,
    TestCategory.SECURITY,
    TestCategory.BACKWARD_COMPATIBILITY,
  ],
  verificationLevels: [
    VerificationLevel.CRITICAL,
    VerificationLevel.HIGH,
    VerificationLevel.MEDIUM,
    VerificationLevel.LOW,
  ],
  estimatedDuration: 45,
  prerequisites: [
    'API server running',
    'Database accessible',
    'Valid authentication credentials',
    'Test data loaded',
  ],
  testSelectionCriteria: {
    includeCategories: [
      TestCategory.API_ENDPOINTS,
      TestCategory.SCHEMA_COMPATIBILITY,
      TestCategory.AUTHENTICATION,
      TestCategory.PERFORMANCE,
      TestCategory.DATA_INTEGRITY,
      TestCategory.SECURITY,
      TestCategory.BACKWARD_COMPATIBILITY,
    ],
    includeVerificationLevels: [
      VerificationLevel.CRITICAL,
      VerificationLevel.HIGH,
      VerificationLevel.MEDIUM,
      VerificationLevel.LOW,
    ],
    requiresCleanEnvironment: true,
  },
};

/**
 * Security-focused verification scenario
 */
export const securityVerificationScenario: TestScenarioConfig = {
  name: 'Security Verification',
  description: 'Security and authentication focused testing',
  mode: ExecutionMode.TARGETED,
  categories: [
    TestCategory.AUTHENTICATION,
    TestCategory.SECURITY,
  ],
  verificationLevels: [
    VerificationLevel.CRITICAL,
    VerificationLevel.HIGH,
    VerificationLevel.MEDIUM,
  ],
  estimatedDuration: 15,
  prerequisites: [
    'API server running',
    'Valid authentication credentials',
    'Security testing tools available',
  ],
  testSelectionCriteria: {
    includeCategories: [
      TestCategory.AUTHENTICATION,
      TestCategory.SECURITY,
    ],
    includeVerificationLevels: [
      VerificationLevel.CRITICAL,
      VerificationLevel.HIGH,
      VerificationLevel.MEDIUM,
    ],
    includeTags: ['security', 'auth', 'hmac'],
    requiresCleanEnvironment: false,
  },
};

/**
 * Performance-focused verification scenario
 */
export const performanceVerificationScenario: TestScenarioConfig = {
  name: 'Performance Verification',
  description: 'Performance and caching focused testing',
  mode: ExecutionMode.TARGETED,
  categories: [
    TestCategory.PERFORMANCE,
    TestCategory.API_ENDPOINTS,
  ],
  verificationLevels: [
    VerificationLevel.CRITICAL,
    VerificationLevel.HIGH,
  ],
  estimatedDuration: 20,
  prerequisites: [
    'API server running',
    'Database accessible',
    'Cache system enabled',
    'Performance monitoring tools available',
  ],
  testSelectionCriteria: {
    includeCategories: [
      TestCategory.PERFORMANCE,
      TestCategory.API_ENDPOINTS,
    ],
    includeVerificationLevels: [
      VerificationLevel.CRITICAL,
      VerificationLevel.HIGH,
    ],
    includeTags: ['performance', 'cache', 'load'],
    requiresCleanEnvironment: true,
  },
};

/**
 * Schema compatibility verification scenario
 */
export const schemaVerificationScenario: TestScenarioConfig = {
  name: 'Schema Verification',
  description: 'Database schema and new field integration testing',
  mode: ExecutionMode.TARGETED,
  categories: [
    TestCategory.SCHEMA_COMPATIBILITY,
    TestCategory.DATA_INTEGRITY,
    TestCategory.API_ENDPOINTS,
  ],
  verificationLevels: [
    VerificationLevel.CRITICAL,
    VerificationLevel.HIGH,
  ],
  estimatedDuration: 10,
  prerequisites: [
    'API server running',
    'Database accessible',
    'Schema migrations applied',
    'Test data with new fields available',
  ],
  testSelectionCriteria: {
    includeCategories: [
      TestCategory.SCHEMA_COMPATIBILITY,
      TestCategory.DATA_INTEGRITY,
      TestCategory.API_ENDPOINTS,
    ],
    includeVerificationLevels: [
      VerificationLevel.CRITICAL,
      VerificationLevel.HIGH,
    ],
    includeTags: ['schema', 'seo', 'thumbnail', 'new-fields'],
    requiresCleanEnvironment: false,
  },
};

/**
 * Backward compatibility verification scenario
 */
export const backwardCompatibilityScenario: TestScenarioConfig = {
  name: 'Backward Compatibility',
  description: 'Ensure existing integrations continue to work',
  mode: ExecutionMode.TARGETED,
  categories: [
    TestCategory.BACKWARD_COMPATIBILITY,
    TestCategory.API_ENDPOINTS,
  ],
  verificationLevels: [
    VerificationLevel.CRITICAL,
    VerificationLevel.HIGH,
  ],
  estimatedDuration: 8,
  prerequisites: [
    'API server running',
    'Legacy test data available',
    'Old client simulation tools',
  ],
  testSelectionCriteria: {
    includeCategories: [
      TestCategory.BACKWARD_COMPATIBILITY,
      TestCategory.API_ENDPOINTS,
    ],
    includeVerificationLevels: [
      VerificationLevel.CRITICAL,
      VerificationLevel.HIGH,
    ],
    includeTags: ['backward-compatibility', 'legacy', 'existing-clients'],
    requiresCleanEnvironment: false,
  },
};

/**
 * Continuous monitoring scenario
 */
export const continuousMonitoringScenario: TestScenarioConfig = {
  name: 'Continuous Monitoring',
  description: 'Lightweight continuous health checks',
  mode: ExecutionMode.CONTINUOUS,
  categories: [
    TestCategory.API_ENDPOINTS,
    TestCategory.AUTHENTICATION,
  ],
  verificationLevels: [
    VerificationLevel.CRITICAL,
  ],
  estimatedDuration: 2,
  prerequisites: [
    'API server running',
    'Valid authentication credentials',
  ],
  testSelectionCriteria: {
    includeCategories: [
      TestCategory.API_ENDPOINTS,
      TestCategory.AUTHENTICATION,
    ],
    includeVerificationLevels: [
      VerificationLevel.CRITICAL,
    ],
    includeTags: ['health-check', 'monitoring'],
    maxExecutionTime: 5000, // 5 seconds per test
    requiresCleanEnvironment: false,
  },
};

/**
 * Get all available test scenarios
 */
export function getAllTestScenarios(): TestScenarioConfig[] {
  return [
    quickVerificationScenario,
    fullVerificationScenario,
    securityVerificationScenario,
    performanceVerificationScenario,
    schemaVerificationScenario,
    backwardCompatibilityScenario,
    continuousMonitoringScenario,
  ];
}

/**
 * Get test scenario by name
 */
export function getTestScenario(name: string): TestScenarioConfig | null {
  const scenarios = getAllTestScenarios();
  return scenarios.find(scenario => 
    scenario.name.toLowerCase() === name.toLowerCase()
  ) || null;
}

/**
 * Get test scenarios by execution mode
 */
export function getTestScenariosByMode(mode: ExecutionMode): TestScenarioConfig[] {
  return getAllTestScenarios().filter(scenario => scenario.mode === mode);
}

/**
 * Filter tests based on scenario criteria
 */
export function filterTestsForScenario(
  tests: TestDefinition[], 
  scenario: TestScenarioConfig
): TestDefinition[] {
  const criteria = scenario.testSelectionCriteria;
  
  return tests.filter(test => {
    // Check categories
    if (!criteria.includeCategories.includes(test.category)) {
      return false;
    }
    
    if (criteria.excludeCategories?.includes(test.category)) {
      return false;
    }
    
    // Check verification levels
    if (!criteria.includeVerificationLevels.includes(test.verificationLevel)) {
      return false;
    }
    
    if (criteria.excludeVerificationLevels?.includes(test.verificationLevel)) {
      return false;
    }
    
    // Check tags
    if (criteria.includeTags) {
      const hasIncludedTag = criteria.includeTags.some(tag => 
        test.tags.includes(tag)
      );
      if (!hasIncludedTag) {
        return false;
      }
    }
    
    if (criteria.excludeTags) {
      const hasExcludedTag = criteria.excludeTags.some(tag => 
        test.tags.includes(tag)
      );
      if (hasExcludedTag) {
        return false;
      }
    }
    
    // Check execution time
    if (criteria.maxExecutionTime && test.timeout > criteria.maxExecutionTime) {
      return false;
    }
    
    return true;
  });
}

/**
 * Estimate scenario execution time
 */
export function estimateScenarioExecutionTime(
  tests: TestDefinition[], 
  scenario: TestScenarioConfig,
  parallelExecution: boolean = true
): number {
  const filteredTests = filterTestsForScenario(tests, scenario);
  
  if (parallelExecution) {
    // Estimate based on longest running test plus some overhead
    const maxTestTime = Math.max(...filteredTests.map(test => test.timeout));
    const overhead = filteredTests.length * 100; // 100ms overhead per test
    return maxTestTime + overhead;
  } else {
    // Sum all test times plus overhead
    const totalTestTime = filteredTests.reduce((sum, test) => sum + test.timeout, 0);
    const overhead = filteredTests.length * 200; // 200ms overhead per test
    return totalTestTime + overhead;
  }
}