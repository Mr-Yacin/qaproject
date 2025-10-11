/**
 * Data Integrity Verification Tests
 * 
 * Tests to verify that data changes made through admin interface simulation
 * are immediately reflected in API responses and maintain consistency.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { AdminInterfaceSimulator, TestDataModifier, DataStateVerifier } from './utils/admin-simulation';
import { DataConsistencyValidator, HTTPAPIFetcher } from './utils/data-consistency-validator';
import { ValidationUtils, TestConfigUtils } from './utils';
import type { TopicTestData } from './types';

describe('Data Integrity Verification', () => {
  let prisma: PrismaClient;
  let adminSimulator: AdminInterfaceSimulator;
  let dataModifier: TestDataModifier;
  let stateVerifier: DataStateVerifier;
  let consistencyValidator: DataConsistencyValidator;
  let apiFetcher: HTTPAPIFetcher;
  let testTopicIds: string[] = [];
  let testUserId: string;

  beforeAll(async () => {
    // Initialize database connection
    prisma = new PrismaClient({
      log: ['error'],
    });

    // Initialize utilities
    adminSimulator = new AdminInterfaceSimulator({
      prisma,
      auditEnabled: true,
    });

    dataModifier = new TestDataModifier(prisma);
    stateVerifier = new DataStateVerifier(prisma);

    // Create test admin user
    testUserId = await adminSimulator.createTestAdminUser();

    // Initialize API fetcher
    const apiBaseUrl = TestConfigUtils.getApiBaseUrl();
    apiFetcher = new HTTPAPIFetcher(apiBaseUrl);

    // Initialize consistency validator
    consistencyValidator = new DataConsistencyValidator(
      prisma,
      apiFetcher,
      5000 // 5 second timestamp threshold
    );
  });

  afterAll(async () => {
    // Clean up test data
    if (testTopicIds.length > 0) {
      await adminSimulator.cleanupTestData(testTopicIds);
    }
    
    // Clean up test user
    await adminSimulator.cleanupTestUser();
    
    // Close database connection
    await prisma.$disconnect();
  });

  beforeEach(() => {
    // Reset test topic IDs for each test
    testTopicIds = [];
  });

  describe('Admin Interface Simulation', () => {
    it('should create topic through admin simulation and verify in database', async () => {
      // Generate test data
      const testData = dataModifier.generateTestTopicData({
        slug: `admin-sim-create-${ValidationUtils.randomString(8)}`,
        title: 'Admin Simulation Create Test',
      });

      // Create topic through admin simulation
      const result = await adminSimulator.createTopic(testData);
      
      expect(result.success).toBe(true);
      expect(result.entityId).toBeDefined();
      expect(result.auditLogId).toBeDefined();
      
      if (result.entityId) {
        testTopicIds.push(result.entityId);
        
        // Verify topic exists in database
        const exists = await stateVerifier.verifyTopicExists(result.entityId, testData);
        expect(exists).toBe(true);
      }
    });

    it('should update topic through admin simulation and verify changes', async () => {
      // Create initial topic
      const initialData = dataModifier.generateTestTopicData({
        slug: `admin-sim-update-${ValidationUtils.randomString(8)}`,
        title: 'Initial Title',
        seoTitle: 'Initial SEO Title',
      });

      const createResult = await adminSimulator.createTopic(initialData);
      expect(createResult.success).toBe(true);
      
      if (createResult.entityId) {
        testTopicIds.push(createResult.entityId);

        // Update the topic
        const updates: Partial<TopicTestData> = {
          title: 'Updated Title',
          seoTitle: 'Updated SEO Title',
          seoDescription: 'New SEO Description',
          tags: ['updated', 'test', 'admin'],
        };

        const updateResult = await adminSimulator.updateTopic(createResult.entityId, updates);
        expect(updateResult.success).toBe(true);
        expect(updateResult.auditLogId).toBeDefined();

        // Verify updates in database
        const updatedExists = await stateVerifier.verifyTopicExists(createResult.entityId, {
          ...initialData,
          ...updates,
        });
        expect(updatedExists).toBe(true);
      }
    });

    it('should delete topic through admin simulation and verify removal', async () => {
      // Create topic to delete
      const testData = dataModifier.generateTestTopicData({
        slug: `admin-sim-delete-${ValidationUtils.randomString(8)}`,
        title: 'Topic to Delete',
      });

      const createResult = await adminSimulator.createTopic(testData);
      expect(createResult.success).toBe(true);
      
      if (createResult.entityId) {
        // Verify topic exists before deletion
        const existsBefore = await stateVerifier.verifyTopicExists(createResult.entityId);
        expect(existsBefore).toBe(true);

        // Delete the topic
        const deleteResult = await adminSimulator.deleteTopic(createResult.entityId);
        expect(deleteResult.success).toBe(true);
        expect(deleteResult.auditLogId).toBeDefined();

        // Verify topic no longer exists
        const existsAfter = await stateVerifier.verifyTopicExists(createResult.entityId);
        expect(existsAfter).toBe(false);
      }
    });
  });

  describe('Data Consistency Validation', () => {
    it('should validate consistency between admin-created data and API response', async () => {
      // Create topic with complete data
      const testData = dataModifier.generateTestTopicData({
        slug: `consistency-test-${ValidationUtils.randomString(8)}`,
        title: 'Consistency Test Topic',
        seoTitle: 'Consistency SEO Title',
        seoDescription: 'Consistency SEO Description',
        seoKeywords: ['consistency', 'test', 'api'],
        thumbnailUrl: 'https://example.com/thumbnail.jpg',
      });

      const createResult = await adminSimulator.createTopic(testData);
      expect(createResult.success).toBe(true);
      
      if (createResult.entityId) {
        testTopicIds.push(createResult.entityId);

        // Wait a moment for any caching to settle
        await ValidationUtils.delay(1000);

        // Validate consistency
        const consistencyResult = await consistencyValidator.validateTopicConsistency(
          createResult.entityId,
          testData
        );

        expect(consistencyResult.consistent).toBe(true);
        expect(consistencyResult.mismatches).toHaveLength(0);
        expect(consistencyResult.timestampConsistency.withinThreshold).toBe(true);

        // Verify all field validations passed
        const failedValidations = consistencyResult.fieldValidations.filter(v => !v.valid);
        expect(failedValidations).toHaveLength(0);
      }
    });

    it('should detect inconsistencies when data differs between admin and API', async () => {
      // Create topic
      const testData = dataModifier.generateTestTopicData({
        slug: `inconsistency-test-${ValidationUtils.randomString(8)}`,
        title: 'Original Title',
      });

      const createResult = await adminSimulator.createTopic(testData);
      expect(createResult.success).toBe(true);
      
      if (createResult.entityId) {
        testTopicIds.push(createResult.entityId);

        // Manually modify database to create inconsistency (simulating a bug)
        await prisma.topic.update({
          where: { id: createResult.entityId },
          data: { title: 'Modified Title' },
        });

        // Validate consistency (should detect mismatch)
        const consistencyResult = await consistencyValidator.validateTopicConsistency(
          createResult.entityId,
          testData
        );

        expect(consistencyResult.consistent).toBe(false);
        expect(consistencyResult.mismatches.length).toBeGreaterThan(0);
        
        // Should detect title mismatch
        const titleMismatch = consistencyResult.mismatches.find(m => m.field === 'expected.title');
        expect(titleMismatch).toBeDefined();
        expect(titleMismatch?.adminValue).toBe('Original Title');
        expect(titleMismatch?.apiValue).toBe('Modified Title');
      }
    });

    it('should validate topic appears correctly in topics list API', async () => {
      // Create topic with specific locale and tags for filtering
      const testData = dataModifier.generateTestTopicData({
        slug: `list-test-${ValidationUtils.randomString(8)}`,
        title: 'List Test Topic',
        locale: 'en',
        tags: ['list-test', 'verification'],
      });

      const createResult = await adminSimulator.createTopic(testData);
      expect(createResult.success).toBe(true);
      
      if (createResult.entityId) {
        testTopicIds.push(createResult.entityId);

        // Wait for any caching to settle
        await ValidationUtils.delay(1000);

        // Validate topic appears in list
        const listResult = await consistencyValidator.validateTopicInList(
          createResult.entityId,
          { locale: 'en', tags: ['list-test'] }
        );

        expect(listResult.found).toBe(true);
        expect(listResult.consistent).toBe(true);
        expect(listResult.mismatches).toHaveLength(0);
      }
    });

    it('should validate SEO fields integration in API responses', async () => {
      // Create topics with different SEO field combinations
      const seoVariations = dataModifier.generateSEOTestVariations();
      const createdTopicIds: string[] = [];

      for (const testData of seoVariations) {
        const createResult = await adminSimulator.createTopic(testData);
        expect(createResult.success).toBe(true);
        
        if (createResult.entityId) {
          createdTopicIds.push(createResult.entityId);
          testTopicIds.push(createResult.entityId);
        }
      }

      // Wait for any caching to settle
      await ValidationUtils.delay(1000);

      // Validate consistency for all SEO variations
      const results = await consistencyValidator.validateMultipleTopicsConsistency(createdTopicIds);
      
      expect(results.size).toBe(seoVariations.length);
      
      // All topics should be consistent
      for (const [topicId, result] of results) {
        expect(result.consistent).toBe(true);
        expect(result.mismatches).toHaveLength(0);
      }

      // Generate summary report
      const report = consistencyValidator.generateConsistencyReport(results);
      expect(report.totalTopics).toBe(seoVariations.length);
      expect(report.consistentTopics).toBe(seoVariations.length);
      expect(report.inconsistentTopics).toBe(0);
    });

    it('should validate timestamp consistency and update tracking', async () => {
      // Create topic
      const testData = dataModifier.generateTestTopicData({
        slug: `timestamp-test-${ValidationUtils.randomString(8)}`,
        title: 'Timestamp Test Topic',
      });

      const createResult = await adminSimulator.createTopic(testData);
      expect(createResult.success).toBe(true);
      
      if (createResult.entityId) {
        testTopicIds.push(createResult.entityId);

        // Record creation timestamp
        const creationTime = createResult.timestamp;

        // Wait a moment then update
        await ValidationUtils.delay(1000);
        
        const updateResult = await adminSimulator.updateTopic(createResult.entityId, {
          title: 'Updated Timestamp Test Topic',
        });
        expect(updateResult.success).toBe(true);

        // Validate consistency including timestamps
        const consistencyResult = await consistencyValidator.validateTopicConsistency(createResult.entityId);
        
        expect(consistencyResult.consistent).toBe(true);
        expect(consistencyResult.timestampConsistency.withinThreshold).toBe(true);
        
        // Updated timestamp should be after creation timestamp
        expect(consistencyResult.timestampConsistency.apiTimestamp.getTime())
          .toBeGreaterThan(creationTime.getTime());
      }
    });
  });

  describe('Cross-Reference Validation', () => {
    it('should validate related data consistency across entities', async () => {
      // Create topic with multiple related entities
      const testData = dataModifier.generateTestTopicData({
        slug: `cross-ref-test-${ValidationUtils.randomString(8)}`,
        title: 'Cross Reference Test Topic',
        faqItems: [
          { question: 'Question 1?', answer: 'Answer 1', order: 1 },
          { question: 'Question 2?', answer: 'Answer 2', order: 2 },
          { question: 'Question 3?', answer: 'Answer 3', order: 3 },
        ],
      });

      const createResult = await adminSimulator.createTopic(testData);
      expect(createResult.success).toBe(true);
      
      if (createResult.entityId) {
        testTopicIds.push(createResult.entityId);

        // Validate consistency
        const consistencyResult = await consistencyValidator.validateTopicConsistency(
          createResult.entityId,
          testData
        );

        expect(consistencyResult.consistent).toBe(true);
        
        // Verify FAQ items are properly ordered and complete
        const faqValidations = consistencyResult.fieldValidations.filter(v => 
          v.field.startsWith('faqItems[')
        );
        
        // Should have validations for all FAQ fields
        expect(faqValidations.length).toBeGreaterThan(0);
        
        // All FAQ validations should pass
        const failedFaqValidations = faqValidations.filter(v => !v.valid);
        expect(failedFaqValidations).toHaveLength(0);
      }
    });

    it('should validate data state snapshots and change detection', async () => {
      // Capture initial state
      const initialState = await adminSimulator.captureDataState();
      
      // Create multiple topics
      const testTopics = dataModifier.generateMultipleTestTopics(3, {
        slug: `state-test`,
        title: 'State Test Topic',
      });

      const createdIds: string[] = [];
      for (const testData of testTopics) {
        const createResult = await adminSimulator.createTopic(testData);
        expect(createResult.success).toBe(true);
        
        if (createResult.entityId) {
          createdIds.push(createResult.entityId);
          testTopicIds.push(createResult.entityId);
        }
      }

      // Capture state after creation
      const afterCreationState = await adminSimulator.captureDataState();
      
      // Compare states
      const stateComparison = stateVerifier.compareDataStates(initialState, afterCreationState);
      
      expect(stateComparison.identical).toBe(false);
      expect(stateComparison.addedTopics).toHaveLength(3);
      expect(stateComparison.removedTopics).toHaveLength(0);
      expect(stateComparison.modifiedTopics).toHaveLength(0);
      
      // Verify added topics are the ones we created
      for (const createdId of createdIds) {
        expect(stateComparison.addedTopics).toContain(createdId);
      }

      // Update one topic
      if (createdIds.length > 0) {
        const updateResult = await adminSimulator.updateTopic(createdIds[0], {
          title: 'Modified State Test Topic',
        });
        expect(updateResult.success).toBe(true);

        // Capture state after update
        const afterUpdateState = await adminSimulator.captureDataState();
        
        // Compare with after-creation state
        const updateComparison = stateVerifier.compareDataStates(afterCreationState, afterUpdateState);
        
        expect(updateComparison.identical).toBe(false);
        expect(updateComparison.addedTopics).toHaveLength(0);
        expect(updateComparison.removedTopics).toHaveLength(0);
        expect(updateComparison.modifiedTopics).toHaveLength(1);
        expect(updateComparison.modifiedTopics[0]).toBe(createdIds[0]);
      }
    });

    it('should validate audit log entries for admin operations', async () => {
      // Create topic
      const testData = dataModifier.generateTestTopicData({
        slug: `audit-test-${ValidationUtils.randomString(8)}`,
        title: 'Audit Test Topic',
      });

      const createResult = await adminSimulator.createTopic(testData);
      expect(createResult.success).toBe(true);
      
      if (createResult.entityId) {
        testTopicIds.push(createResult.entityId);

        // Update topic
        const updateResult = await adminSimulator.updateTopic(createResult.entityId, {
          title: 'Updated Audit Test Topic',
        });
        expect(updateResult.success).toBe(true);

        // Verify audit logs exist
        const auditLogsExist = await stateVerifier.verifyAuditLogs(
          [createResult.entityId],
          ['CREATE', 'UPDATE']
        );
        
        expect(auditLogsExist).toBe(true);
      }
    });
  });
});