/**
 * Database Constraint Validation Tests
 * 
 * Tests to verify database constraint enforcement, foreign key relationships,
 * and unique constraint validation with the updated schema.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { PrismaClient, Prisma } from '@prisma/client';
import { ValidationUtils } from './utils';

// Create a separate Prisma client for testing
const testPrisma = new PrismaClient({
  log: ['error'],
});

interface ConstraintTestResult {
  testName: string;
  constraintType: 'unique' | 'foreign_key' | 'enum' | 'not_null' | 'check';
  success: boolean;
  expectedBehavior: 'should_pass' | 'should_fail';
  actualBehavior: 'passed' | 'failed';
  error?: string;
}

describe('Database Constraint Validation Tests', () => {
  let testResults: ConstraintTestResult[] = [];
  let createdTestData: any[] = [];

  beforeAll(async () => {
    console.log('🔗 Connecting to test database for constraint validation...');
    await testPrisma.$connect();
    console.log('✅ Database connection established');
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up test data...');
    
    // Clean up any test data created during tests
    for (const data of createdTestData.reverse()) {
      try {
        if (data.model && data.id) {
          await (testPrisma as any)[data.model].delete({
            where: { id: data.id }
          });
        }
      } catch (error) {
        console.warn(`⚠️ Could not clean up ${data.model} with id ${data.id}:`, error);
      }
    }

    console.log('📊 Constraint Test Results Summary:');
    testResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const behavior = result.actualBehavior === result.expectedBehavior ? '✓' : '✗';
      console.log(`${status} ${behavior} ${result.testName} (${result.constraintType})`);
      if (result.error && !result.success) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    await testPrisma.$disconnect();
    console.log('🔌 Database connection closed');
  });

  /**
   * Helper function to test constraint behavior
   */
  async function testConstraint(
    testName: string,
    constraintType: ConstraintTestResult['constraintType'],
    expectedBehavior: 'should_pass' | 'should_fail',
    testFn: () => Promise<any>
  ): Promise<ConstraintTestResult> {
    let success = false;
    let actualBehavior: 'passed' | 'failed' = 'failed';
    let error: string | undefined;

    try {
      const result = await testFn();
      actualBehavior = 'passed';
      success = expectedBehavior === 'should_pass';
      
      // Track created data for cleanup
      if (result && typeof result === 'object' && result.id) {
        createdTestData.push({
          model: testName.toLowerCase().includes('topic') ? 'topic' :
                 testName.toLowerCase().includes('article') ? 'article' :
                 testName.toLowerCase().includes('question') ? 'question' :
                 testName.toLowerCase().includes('faq') ? 'fAQItem' :
                 testName.toLowerCase().includes('user') ? 'user' : 'unknown',
          id: result.id
        });
      }
    } catch (err) {
      actualBehavior = 'failed';
      success = expectedBehavior === 'should_fail';
      error = err instanceof Error ? err.message : 'Unknown error';
    }

    const result: ConstraintTestResult = {
      testName,
      constraintType,
      success,
      expectedBehavior,
      actualBehavior,
      error
    };

    testResults.push(result);
    return result;
  }

  describe('Unique Constraint Validation', () => {
    it('should enforce unique slug constraint on topics', async () => {
      // First create a topic with a unique slug
      const uniqueSlug = `test-unique-${ValidationUtils.randomString(8)}`;
      
      await testConstraint(
        'Create Topic with Unique Slug',
        'unique',
        'should_pass',
        () => testPrisma.topic.create({
          data: {
            slug: uniqueSlug,
            title: 'Test Topic',
            locale: 'en',
            tags: ['test'],
            seoKeywords: []
          }
        })
      );

      // Then try to create another topic with the same slug
      const result = await testConstraint(
        'Duplicate Topic Slug Constraint',
        'unique',
        'should_fail',
        () => testPrisma.topic.create({
          data: {
            slug: uniqueSlug,
            title: 'Another Test Topic',
            locale: 'en',
            tags: ['test'],
            seoKeywords: []
          }
        })
      );

      expect(result.success).toBe(true);
      expect(result.actualBehavior).toBe('failed');
    });

    it('should enforce unique email constraint on users', async () => {
      const uniqueEmail = `test-${ValidationUtils.randomString(8)}@example.com`;
      
      // Create first user
      await testConstraint(
        'Create User with Unique Email',
        'unique',
        'should_pass',
        () => testPrisma.user.create({
          data: {
            email: uniqueEmail,
            password: 'hashedpassword123',
            name: 'Test User',
            role: 'VIEWER'
          }
        })
      );

      // Try to create duplicate user
      const result = await testConstraint(
        'Duplicate User Email Constraint',
        'unique',
        'should_fail',
        () => testPrisma.user.create({
          data: {
            email: uniqueEmail,
            password: 'anotherhashedpassword',
            name: 'Another Test User',
            role: 'EDITOR'
          }
        })
      );

      expect(result.success).toBe(true);
      expect(result.actualBehavior).toBe('failed');
    });

    it('should enforce unique page slug constraint', async () => {
      const uniqueSlug = `page-${ValidationUtils.randomString(8)}`;
      
      // Create first page
      await testConstraint(
        'Create Page with Unique Slug',
        'unique',
        'should_pass',
        () => testPrisma.page.create({
          data: {
            slug: uniqueSlug,
            title: 'Test Page',
            content: 'Test content',
            status: 'PUBLISHED',
            seoKeywords: []
          }
        })
      );

      // Try to create duplicate page
      const result = await testConstraint(
        'Duplicate Page Slug Constraint',
        'unique',
        'should_fail',
        () => testPrisma.page.create({
          data: {
            slug: uniqueSlug,
            title: 'Another Test Page',
            content: 'Another test content',
            status: 'DRAFT',
            seoKeywords: []
          }
        })
      );

      expect(result.success).toBe(true);
      expect(result.actualBehavior).toBe('failed');
    });

    it('should enforce unique topicId constraint on articles', async () => {
      // First create a topic
      const topic = await testPrisma.topic.create({
        data: {
          slug: `topic-for-article-${ValidationUtils.randomString(8)}`,
          title: 'Topic for Article Test',
          locale: 'en',
          tags: ['test'],
          seoKeywords: []
        }
      });

      createdTestData.push({ model: 'topic', id: topic.id });

      // Create first article
      await testConstraint(
        'Create Article with Unique TopicId',
        'unique',
        'should_pass',
        () => testPrisma.article.create({
          data: {
            topicId: topic.id,
            content: 'Test article content',
            status: 'PUBLISHED',
            seoKeywords: []
          }
        })
      );

      // Try to create another article for the same topic
      const result = await testConstraint(
        'Duplicate Article TopicId Constraint',
        'unique',
        'should_fail',
        () => testPrisma.article.create({
          data: {
            topicId: topic.id,
            content: 'Another test article content',
            status: 'DRAFT',
            seoKeywords: []
          }
        })
      );

      expect(result.success).toBe(true);
      expect(result.actualBehavior).toBe('failed');
    });
  });

  describe('Foreign Key Constraint Validation', () => {
    it('should enforce foreign key constraint on article.topicId', async () => {
      const nonExistentTopicId = 'non-existent-topic-id';

      const result = await testConstraint(
        'Article Foreign Key Constraint',
        'foreign_key',
        'should_fail',
        () => testPrisma.article.create({
          data: {
            topicId: nonExistentTopicId,
            content: 'Test content',
            status: 'PUBLISHED',
            seoKeywords: []
          }
        })
      );

      expect(result.success).toBe(true);
      expect(result.actualBehavior).toBe('failed');
    });

    it('should enforce foreign key constraint on question.topicId', async () => {
      const nonExistentTopicId = 'non-existent-topic-id';

      const result = await testConstraint(
        'Question Foreign Key Constraint',
        'foreign_key',
        'should_fail',
        () => testPrisma.question.create({
          data: {
            topicId: nonExistentTopicId,
            text: 'Test question?',
            isPrimary: false
          }
        })
      );

      expect(result.success).toBe(true);
      expect(result.actualBehavior).toBe('failed');
    });

    it('should enforce foreign key constraint on faqItem.topicId', async () => {
      const nonExistentTopicId = 'non-existent-topic-id';

      const result = await testConstraint(
        'FAQ Item Foreign Key Constraint',
        'foreign_key',
        'should_fail',
        () => testPrisma.fAQItem.create({
          data: {
            topicId: nonExistentTopicId,
            question: 'Test FAQ question?',
            answer: 'Test FAQ answer',
            order: 1
          }
        })
      );

      expect(result.success).toBe(true);
      expect(result.actualBehavior).toBe('failed');
    });

    it('should enforce foreign key constraint on auditLog.userId', async () => {
      const nonExistentUserId = 'non-existent-user-id';

      const result = await testConstraint(
        'Audit Log Foreign Key Constraint',
        'foreign_key',
        'should_fail',
        () => testPrisma.auditLog.create({
          data: {
            userId: nonExistentUserId,
            action: 'CREATE',
            entityType: 'Topic',
            entityId: 'some-entity-id'
          }
        })
      );

      expect(result.success).toBe(true);
      expect(result.actualBehavior).toBe('failed');
    });

    it('should maintain foreign key relationships after updates', async () => {
      // Create a topic and related entities
      const topic = await testPrisma.topic.create({
        data: {
          slug: `fk-test-topic-${ValidationUtils.randomString(8)}`,
          title: 'FK Test Topic',
          locale: 'en',
          tags: ['test'],
          seoKeywords: []
        }
      });

      createdTestData.push({ model: 'topic', id: topic.id });

      const question = await testPrisma.question.create({
        data: {
          topicId: topic.id,
          text: 'Test question?',
          isPrimary: true
        }
      });

      createdTestData.push({ model: 'question', id: question.id });

      // Update the topic and verify relationship is maintained
      const result = await testConstraint(
        'Foreign Key Relationship Maintenance',
        'foreign_key',
        'should_pass',
        async () => {
          await testPrisma.topic.update({
            where: { id: topic.id },
            data: { title: 'Updated FK Test Topic' }
          });

          // Verify the question still references the topic correctly
          const updatedQuestion = await testPrisma.question.findUnique({
            where: { id: question.id },
            include: { topic: true }
          });

          if (!updatedQuestion || updatedQuestion.topicId !== topic.id) {
            throw new Error('Foreign key relationship broken after update');
          }

          return updatedQuestion;
        }
      );

      expect(result.success).toBe(true);
      expect(result.actualBehavior).toBe('passed');
    });
  });

  describe('Enum Constraint Validation', () => {
    it('should enforce ContentStatus enum constraint on articles', async () => {
      // First create a topic for the article
      const topic = await testPrisma.topic.create({
        data: {
          slug: `enum-test-topic-${ValidationUtils.randomString(8)}`,
          title: 'Enum Test Topic',
          locale: 'en',
          tags: ['test'],
          seoKeywords: []
        }
      });

      createdTestData.push({ model: 'topic', id: topic.id });

      const result = await testConstraint(
        'Article Status Enum Constraint',
        'enum',
        'should_fail',
        () => testPrisma.article.create({
          data: {
            topicId: topic.id,
            content: 'Test content',
            status: 'INVALID_STATUS' as any, // Invalid enum value
            seoKeywords: []
          }
        })
      );

      expect(result.success).toBe(true);
      expect(result.actualBehavior).toBe('failed');
    });

    it('should accept valid ContentStatus enum values', async () => {
      const topic = await testPrisma.topic.create({
        data: {
          slug: `valid-enum-topic-${ValidationUtils.randomString(8)}`,
          title: 'Valid Enum Test Topic',
          locale: 'en',
          tags: ['test'],
          seoKeywords: []
        }
      });

      createdTestData.push({ model: 'topic', id: topic.id });

      // Test DRAFT status
      const draftResult = await testConstraint(
        'Valid DRAFT Status Enum',
        'enum',
        'should_pass',
        () => testPrisma.article.create({
          data: {
            topicId: topic.id,
            content: 'Draft content',
            status: 'DRAFT',
            seoKeywords: []
          }
        })
      );

      expect(draftResult.success).toBe(true);
      expect(draftResult.actualBehavior).toBe('passed');
    });

    it('should enforce UserRole enum constraint', async () => {
      const result = await testConstraint(
        'User Role Enum Constraint',
        'enum',
        'should_fail',
        () => testPrisma.user.create({
          data: {
            email: `invalid-role-${ValidationUtils.randomString(8)}@example.com`,
            password: 'hashedpassword123',
            name: 'Invalid Role User',
            role: 'INVALID_ROLE' as any // Invalid enum value
          }
        })
      );

      expect(result.success).toBe(true);
      expect(result.actualBehavior).toBe('failed');
    });

    it('should accept valid UserRole enum values', async () => {
      const validRoles = ['ADMIN', 'EDITOR', 'VIEWER'];
      
      for (const role of validRoles) {
        const result = await testConstraint(
          `Valid ${role} Role Enum`,
          'enum',
          'should_pass',
          () => testPrisma.user.create({
            data: {
              email: `valid-${role.toLowerCase()}-${ValidationUtils.randomString(8)}@example.com`,
              password: 'hashedpassword123',
              name: `Valid ${role} User`,
              role: role as any
            }
          })
        );

        expect(result.success).toBe(true);
        expect(result.actualBehavior).toBe('passed');
      }
    });

    it('should enforce AuditAction enum constraint', async () => {
      // First create a user for the audit log
      const user = await testPrisma.user.create({
        data: {
          email: `audit-test-${ValidationUtils.randomString(8)}@example.com`,
          password: 'hashedpassword123',
          name: 'Audit Test User',
          role: 'ADMIN'
        }
      });

      createdTestData.push({ model: 'user', id: user.id });

      const result = await testConstraint(
        'Audit Action Enum Constraint',
        'enum',
        'should_fail',
        () => testPrisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'INVALID_ACTION' as any, // Invalid enum value
            entityType: 'Topic',
            entityId: 'some-entity-id'
          }
        })
      );

      expect(result.success).toBe(true);
      expect(result.actualBehavior).toBe('failed');
    });
  });

  describe('Cascading Delete Validation', () => {
    it('should cascade delete questions when topic is deleted', async () => {
      // Create topic with questions
      const topic = await testPrisma.topic.create({
        data: {
          slug: `cascade-test-${ValidationUtils.randomString(8)}`,
          title: 'Cascade Test Topic',
          locale: 'en',
          tags: ['test'],
          seoKeywords: []
        }
      });

      const question = await testPrisma.question.create({
        data: {
          topicId: topic.id,
          text: 'Test question for cascade?',
          isPrimary: true
        }
      });

      // Delete the topic
      const result = await testConstraint(
        'Cascade Delete Questions',
        'foreign_key',
        'should_pass',
        async () => {
          await testPrisma.topic.delete({
            where: { id: topic.id }
          });

          // Verify question was also deleted
          const deletedQuestion = await testPrisma.question.findUnique({
            where: { id: question.id }
          });

          if (deletedQuestion !== null) {
            throw new Error('Question was not cascade deleted');
          }

          return { deleted: true };
        }
      );

      expect(result.success).toBe(true);
      expect(result.actualBehavior).toBe('passed');
    });

    it('should cascade delete articles when topic is deleted', async () => {
      // Create topic with article
      const topic = await testPrisma.topic.create({
        data: {
          slug: `cascade-article-test-${ValidationUtils.randomString(8)}`,
          title: 'Cascade Article Test Topic',
          locale: 'en',
          tags: ['test'],
          seoKeywords: []
        }
      });

      const article = await testPrisma.article.create({
        data: {
          topicId: topic.id,
          content: 'Test article for cascade delete',
          status: 'PUBLISHED',
          seoKeywords: []
        }
      });

      // Delete the topic
      const result = await testConstraint(
        'Cascade Delete Articles',
        'foreign_key',
        'should_pass',
        async () => {
          await testPrisma.topic.delete({
            where: { id: topic.id }
          });

          // Verify article was also deleted
          const deletedArticle = await testPrisma.article.findUnique({
            where: { id: article.id }
          });

          if (deletedArticle !== null) {
            throw new Error('Article was not cascade deleted');
          }

          return { deleted: true };
        }
      );

      expect(result.success).toBe(true);
      expect(result.actualBehavior).toBe('passed');
    });

    it('should cascade delete FAQ items when topic is deleted', async () => {
      // Create topic with FAQ items
      const topic = await testPrisma.topic.create({
        data: {
          slug: `cascade-faq-test-${ValidationUtils.randomString(8)}`,
          title: 'Cascade FAQ Test Topic',
          locale: 'en',
          tags: ['test'],
          seoKeywords: []
        }
      });

      const faqItem = await testPrisma.fAQItem.create({
        data: {
          topicId: topic.id,
          question: 'Test FAQ question?',
          answer: 'Test FAQ answer',
          order: 1
        }
      });

      // Delete the topic
      const result = await testConstraint(
        'Cascade Delete FAQ Items',
        'foreign_key',
        'should_pass',
        async () => {
          await testPrisma.topic.delete({
            where: { id: topic.id }
          });

          // Verify FAQ item was also deleted
          const deletedFAQ = await testPrisma.fAQItem.findUnique({
            where: { id: faqItem.id }
          });

          if (deletedFAQ !== null) {
            throw new Error('FAQ item was not cascade deleted');
          }

          return { deleted: true };
        }
      );

      expect(result.success).toBe(true);
      expect(result.actualBehavior).toBe('passed');
    });

    it('should cascade delete audit logs when user is deleted', async () => {
      // Create user with audit log
      const user = await testPrisma.user.create({
        data: {
          email: `cascade-audit-${ValidationUtils.randomString(8)}@example.com`,
          password: 'hashedpassword123',
          name: 'Cascade Audit Test User',
          role: 'EDITOR'
        }
      });

      const auditLog = await testPrisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE',
          entityType: 'Topic',
          entityId: 'some-entity-id'
        }
      });

      // Delete the user
      const result = await testConstraint(
        'Cascade Delete Audit Logs',
        'foreign_key',
        'should_pass',
        async () => {
          await testPrisma.user.delete({
            where: { id: user.id }
          });

          // Verify audit log was also deleted
          const deletedAuditLog = await testPrisma.auditLog.findUnique({
            where: { id: auditLog.id }
          });

          if (deletedAuditLog !== null) {
            throw new Error('Audit log was not cascade deleted');
          }

          return { deleted: true };
        }
      );

      expect(result.success).toBe(true);
      expect(result.actualBehavior).toBe('passed');
    });
  });

  describe('Array Field Constraints', () => {
    it('should handle empty arrays in tags field', async () => {
      const result = await testConstraint(
        'Empty Tags Array',
        'not_null',
        'should_pass',
        () => testPrisma.topic.create({
          data: {
            slug: `empty-tags-${ValidationUtils.randomString(8)}`,
            title: 'Empty Tags Test',
            locale: 'en',
            tags: [], // Empty array should be allowed
            seoKeywords: []
          }
        })
      );

      expect(result.success).toBe(true);
      expect(result.actualBehavior).toBe('passed');
    });

    it('should handle empty arrays in seoKeywords field', async () => {
      const result = await testConstraint(
        'Empty SEO Keywords Array',
        'not_null',
        'should_pass',
        () => testPrisma.topic.create({
          data: {
            slug: `empty-seo-${ValidationUtils.randomString(8)}`,
            title: 'Empty SEO Keywords Test',
            locale: 'en',
            tags: ['test'],
            seoKeywords: [] // Empty array should be allowed
          }
        })
      );

      expect(result.success).toBe(true);
      expect(result.actualBehavior).toBe('passed');
    });

    it('should handle populated arrays correctly', async () => {
      const result = await testConstraint(
        'Populated Arrays',
        'not_null',
        'should_pass',
        () => testPrisma.topic.create({
          data: {
            slug: `populated-arrays-${ValidationUtils.randomString(8)}`,
            title: 'Populated Arrays Test',
            locale: 'en',
            tags: ['technology', 'programming', 'api'],
            seoKeywords: ['api', 'documentation', 'guide', 'tutorial']
          }
        })
      );

      expect(result.success).toBe(true);
      expect(result.actualBehavior).toBe('passed');
    });
  });
});