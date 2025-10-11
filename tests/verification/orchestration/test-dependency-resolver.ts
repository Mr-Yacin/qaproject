/**
 * Test Dependency Resolver
 * 
 * Manages test dependencies and creates optimal execution order
 * for test suites with complex interdependencies.
 */

import { TestDefinition, TestDependency } from '../types/index';

export class TestDependencyResolver {
  /**
   * Resolve dependencies between tests
   */
  resolveDependencies(tests: TestDefinition[]): TestDependency[] {
    const dependencies: TestDependency[] = [];
    
    for (const test of tests) {
      if (test.dependencies && test.dependencies.length > 0) {
        dependencies.push({
          testId: test.id,
          dependsOn: test.dependencies,
          dependencyType: 'hard' // All dependencies are hard by default
        });
      }
    }
    
    // Validate that all dependencies exist
    this.validateDependencies(tests, dependencies);
    
    // Check for circular dependencies
    this.checkCircularDependencies(dependencies);
    
    return dependencies;
  }

  /**
   * Create execution order based on dependencies
   */
  createExecutionOrder(
    tests: TestDefinition[], 
    dependencies: TestDependency[]
  ): string[] {
    const testMap = new Map(tests.map(test => [test.id, test]));
    const dependencyMap = new Map(dependencies.map(dep => [dep.testId, dep.dependsOn]));
    
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const executionOrder: string[] = [];
    
    // Topological sort to determine execution order
    const visit = (testId: string): void => {
      if (visited.has(testId)) {
        return;
      }
      
      if (visiting.has(testId)) {
        throw new Error(`Circular dependency detected involving test: ${testId}`);
      }
      
      visiting.add(testId);
      
      // Visit all dependencies first
      const deps = dependencyMap.get(testId) || [];
      for (const depId of deps) {
        if (testMap.has(depId)) {
          visit(depId);
        }
      }
      
      visiting.delete(testId);
      visited.add(testId);
      executionOrder.push(testId);
    };
    
    // Visit all tests
    for (const test of tests) {
      visit(test.id);
    }
    
    return executionOrder;
  }

  /**
   * Get tests that can run in parallel
   */
  getParallelizableGroups(
    tests: TestDefinition[], 
    dependencies: TestDependency[]
  ): string[][] {
    const executionOrder = this.createExecutionOrder(tests, dependencies);
    const dependencyMap = new Map(dependencies.map(dep => [dep.testId, dep.dependsOn]));
    
    const groups: string[][] = [];
    const processed = new Set<string>();
    
    for (const testId of executionOrder) {
      if (processed.has(testId)) {
        continue;
      }
      
      const group: string[] = [];
      const candidates = executionOrder.filter(id => !processed.has(id));
      
      for (const candidateId of candidates) {
        const deps = dependencyMap.get(candidateId) || [];
        
        // Check if all dependencies are already processed
        const canRun = deps.every(depId => processed.has(depId));
        
        if (canRun) {
          group.push(candidateId);
          processed.add(candidateId);
        }
      }
      
      if (group.length > 0) {
        groups.push(group);
      }
    }
    
    return groups;
  }

  /**
   * Check if a test can be executed given current state
   */
  canExecuteTest(
    testId: string, 
    dependencies: TestDependency[], 
    completedTests: Set<string>
  ): boolean {
    const dependency = dependencies.find(dep => dep.testId === testId);
    
    if (!dependency) {
      return true; // No dependencies
    }
    
    // Check if all dependencies are completed
    return dependency.dependsOn.every(depId => completedTests.has(depId));
  }

  /**
   * Get immediate dependencies for a test
   */
  getImmediateDependencies(testId: string, dependencies: TestDependency[]): string[] {
    const dependency = dependencies.find(dep => dep.testId === testId);
    return dependency ? dependency.dependsOn : [];
  }

  /**
   * Get all transitive dependencies for a test
   */
  getTransitiveDependencies(
    testId: string, 
    dependencies: TestDependency[]
  ): string[] {
    const allDeps = new Set<string>();
    const visited = new Set<string>();
    
    const collectDeps = (id: string): void => {
      if (visited.has(id)) {
        return;
      }
      
      visited.add(id);
      const immediateDeps = this.getImmediateDependencies(id, dependencies);
      
      for (const depId of immediateDeps) {
        allDeps.add(depId);
        collectDeps(depId);
      }
    };
    
    collectDeps(testId);
    return Array.from(allDeps);
  }

  /**
   * Get tests that depend on a given test
   */
  getDependentTests(testId: string, dependencies: TestDependency[]): string[] {
    return dependencies
      .filter(dep => dep.dependsOn.includes(testId))
      .map(dep => dep.testId);
  }

  /**
   * Validate that all dependencies exist
   */
  private validateDependencies(
    tests: TestDefinition[], 
    dependencies: TestDependency[]
  ): void {
    const testIds = new Set(tests.map(test => test.id));
    
    for (const dependency of dependencies) {
      for (const depId of dependency.dependsOn) {
        if (!testIds.has(depId)) {
          throw new Error(
            `Test '${dependency.testId}' depends on non-existent test '${depId}'`
          );
        }
      }
    }
  }

  /**
   * Check for circular dependencies
   */
  private checkCircularDependencies(dependencies: TestDependency[]): void {
    const dependencyMap = new Map(dependencies.map(dep => [dep.testId, dep.dependsOn]));
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const visit = (testId: string, path: string[] = []): void => {
      if (visited.has(testId)) {
        return;
      }
      
      if (visiting.has(testId)) {
        const cycle = [...path, testId].join(' -> ');
        throw new Error(`Circular dependency detected: ${cycle}`);
      }
      
      visiting.add(testId);
      
      const deps = dependencyMap.get(testId) || [];
      for (const depId of deps) {
        visit(depId, [...path, testId]);
      }
      
      visiting.delete(testId);
      visited.add(testId);
    };
    
    // Check all tests for circular dependencies
    for (const dependency of dependencies) {
      visit(dependency.testId);
    }
  }

  /**
   * Optimize execution order for performance
   */
  optimizeExecutionOrder(
    tests: TestDefinition[], 
    dependencies: TestDependency[]
  ): string[] {
    const baseOrder = this.createExecutionOrder(tests, dependencies);
    const testMap = new Map(tests.map(test => [test.id, test]));
    
    // Sort by verification level (critical first) and estimated duration
    return baseOrder.sort((a, b) => {
      const testA = testMap.get(a)!;
      const testB = testMap.get(b)!;
      
      // Priority order: critical > high > medium > low
      const levelPriority = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1
      };
      
      const priorityA = levelPriority[testA.verificationLevel];
      const priorityB = levelPriority[testB.verificationLevel];
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Higher priority first
      }
      
      // If same priority, shorter tests first for faster feedback
      const durationA = testA.timeout || 30000;
      const durationB = testB.timeout || 30000;
      
      return durationA - durationB;
    });
  }

  /**
   * Create dependency graph visualization data
   */
  createDependencyGraph(
    tests: TestDefinition[], 
    dependencies: TestDependency[]
  ): DependencyGraph {
    const nodes = tests.map(test => ({
      id: test.id,
      name: test.name,
      category: test.category,
      verificationLevel: test.verificationLevel
    }));
    
    const edges = dependencies.flatMap(dep =>
      dep.dependsOn.map(depId => ({
        from: depId,
        to: dep.testId,
        type: dep.dependencyType
      }))
    );
    
    return { nodes, edges };
  }
}

/**
 * Dependency graph structure for visualization
 */
export interface DependencyGraph {
  nodes: Array<{
    id: string;
    name: string;
    category: string;
    verificationLevel: string;
  }>;
  edges: Array<{
    from: string;
    to: string;
    type: 'hard' | 'soft';
  }>;
}