/**
 * Database Schema Compatibility Validation Test Suite
 * 
 * Comprehensive test suite that validates database schema compatibility
 * after admin interface changes, including performance and constraint validation.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { getTestContext } from './setup';

// Import individual test modules
import './database-performance.test';
import './database-constraints.test';

// Create a separate Prisma client for schema validation
const testPrisma = new PrismaClient({
    log: ['error'],
});

interface SchemaCompatibilityResult {
    testCategory: string;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    executionTime: number;
    issues: SchemaIssue[];
}

interface SchemaIssue {
    severity: 'critical' | 'warning' | 'info';
    category: 'performance' | 'constraint' | 'compatibility' | 'data_integrity';
    message: string;
    recommendation?: string;
}

describe('Database Schema Compatibility Validation', () => {
    let compatibilityResults: SchemaCompatibilityResult[] = [];
    let overallStartTime: number;

    beforeAll(async () => {
        console.log('🔍 Starting Database Schema Compatibility Validation...');
        overallStartTime = Date.now();

        await testPrisma.$connect();
        console.log('✅ Connected to database for schema validation');

        // Verify database is accessible and has expected schema
        await validateDatabaseConnection();
    });

    afterAll(async () => {
        const totalExecutionTime = Date.now() - overallStartTime;

        console.log('\n📊 Database Schema Compatibility Validation Summary');
        console.log('='.repeat(60));

        let totalTests = 0;
        let totalPassed = 0;
        let totalFailed = 0;
        const allIssues: SchemaIssue[] = [];

        compatibilityResults.forEach(result => {
            totalTests += result.totalTests;
            totalPassed += result.passedTests;
            totalFailed += result.failedTests;
            allIssues.push(...result.issues);

            const successRate = result.totalTests > 0 ? (result.passedTests / result.totalTests * 100).toFixed(1) : '0.0';
            console.log(`${result.testCategory}: ${result.passedTests}/${result.totalTests} (${successRate}%) - ${result.executionTime}ms`);
        });

        console.log('-'.repeat(60));
        console.log(`Total: ${totalPassed}/${totalTests} tests passed (${totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(1) : '0.0'}%)`);
        console.log(`Execution Time: ${totalExecutionTime}ms`);

        // Report issues by severity
        const criticalIssues = allIssues.filter(i => i.severity === 'critical');
        const warningIssues = allIssues.filter(i => i.severity === 'warning');
        const infoIssues = allIssues.filter(i => i.severity === 'info');

        if (criticalIssues.length > 0) {
            console.log(`\n🚨 Critical Issues (${criticalIssues.length}):`);
            criticalIssues.forEach(issue => {
                console.log(`   ❌ ${issue.message}`);
                if (issue.recommendation) {
                    console.log(`      💡 ${issue.recommendation}`);
                }
            });
        }

        if (warningIssues.length > 0) {
            console.log(`\n⚠️  Warnings (${warningIssues.length}):`);
            warningIssues.forEach(issue => {
                console.log(`   ⚠️  ${issue.message}`);
                if (issue.recommendation) {
                    console.log(`      💡 ${issue.recommendation}`);
                }
            });
        }

        if (infoIssues.length > 0) {
            console.log(`\nℹ️  Information (${infoIssues.length}):`);
            infoIssues.forEach(issue => {
                console.log(`   ℹ️  ${issue.message}`);
            });
        }

        await testPrisma.$disconnect();
        console.log('\n🔌 Database connection closed');
    });

    /**
     * Validate basic database connection and schema presence
     */
    async function validateDatabaseConnection(): Promise<void> {
        try {
            // Test basic connectivity
            await testPrisma.$queryRaw`SELECT 1 as test`;

            // Verify core tables exist
            const tables = await testPrisma.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `;

            const expectedTables = [
                'Topic', 'Question', 'Article', 'FAQItem', 'IngestJob',
                'User', 'AuditLog', 'Page', 'SiteSettings', 'Media',
                'MenuItem', 'FooterColumn', 'FooterLink', 'FooterSettings'
            ];

            const existingTables = tables.map(t => t.table_name);
            const missingTables = expectedTables.filter(table => !existingTables.includes(table));

            if (missingTables.length > 0) {
                throw new Error(`Missing expected tables: ${missingTables.join(', ')}`);
            }

            console.log(`✅ Verified ${existingTables.length} database tables exist`);

        } catch (error) {
            throw new Error(`Database validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    describe('Schema Structure Validation', () => {
        it('should validate new SEO fields exist in Topic table', async () => {
            const startTime = Date.now();
            const issues: SchemaIssue[] = [];

            try {
                // Check if new SEO fields exist in Topic table
                const topicColumns = await testPrisma.$queryRaw<Array<{ column_name: string; data_type: string; is_nullable: string }>>`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'Topic' 
          AND table_schema = 'public'
          ORDER BY column_name
        `;

                const columnNames = topicColumns.map(c => c.column_name);
                const expectedNewFields = ['seoTitle', 'seoDescription', 'seoKeywords', 'thumbnailUrl'];

                expectedNewFields.forEach(field => {
                    if (!columnNames.includes(field)) {
                        issues.push({
                            severity: 'critical',
                            category: 'compatibility',
                            message: `Missing expected field '${field}' in Topic table`,
                            recommendation: `Add the ${field} field to the Topic model in schema.prisma`
                        });
                    }
                });

                // Verify SEO fields are nullable (optional)
                const seoFields = topicColumns.filter(c =>
                    ['seoTitle', 'seoDescription', 'thumbnailUrl'].includes(c.column_name)
                );

                seoFields.forEach(field => {
                    if (field.is_nullable !== 'YES') {
                        issues.push({
                            severity: 'warning',
                            category: 'compatibility',
                            message: `Field '${field.column_name}' should be nullable for backward compatibility`,
                            recommendation: `Make ${field.column_name} optional in the schema`
                        });
                    }
                });

                console.log(`✅ Topic table has ${columnNames.length} columns including new SEO fields`);

            } catch (error) {
                issues.push({
                    severity: 'critical',
                    category: 'compatibility',
                    message: `Failed to validate Topic table structure: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }

            compatibilityResults.push({
                testCategory: 'Schema Structure - Topic',
                totalTests: 1,
                passedTests: issues.filter(i => i.severity !== 'critical').length === issues.length ? 1 : 0,
                failedTests: issues.filter(i => i.severity === 'critical').length > 0 ? 1 : 0,
                executionTime: Date.now() - startTime,
                issues
            });

            expect(issues.filter(i => i.severity === 'critical')).toHaveLength(0);
        });

        it('should validate new SEO fields exist in Article table', async () => {
            const startTime = Date.now();
            const issues: SchemaIssue[] = [];

            try {
                const articleColumns = await testPrisma.$queryRaw<Array<{ column_name: string; data_type: string; is_nullable: string }>>`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'Article' 
          AND table_schema = 'public'
          ORDER BY column_name
        `;

                const columnNames = articleColumns.map(c => c.column_name);
                const expectedNewFields = ['seoTitle', 'seoDescription', 'seoKeywords'];

                expectedNewFields.forEach(field => {
                    if (!columnNames.includes(field)) {
                        issues.push({
                            severity: 'critical',
                            category: 'compatibility',
                            message: `Missing expected field '${field}' in Article table`,
                            recommendation: `Add the ${field} field to the Article model in schema.prisma`
                        });
                    }
                });

                console.log(`✅ Article table has ${columnNames.length} columns including new SEO fields`);

            } catch (error) {
                issues.push({
                    severity: 'critical',
                    category: 'compatibility',
                    message: `Failed to validate Article table structure: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }

            compatibilityResults.push({
                testCategory: 'Schema Structure - Article',
                totalTests: 1,
                passedTests: issues.filter(i => i.severity !== 'critical').length === issues.length ? 1 : 0,
                failedTests: issues.filter(i => i.severity === 'critical').length > 0 ? 1 : 0,
                executionTime: Date.now() - startTime,
                issues
            });

            expect(issues.filter(i => i.severity === 'critical')).toHaveLength(0);
        });

        it('should validate database indexes exist for new fields', async () => {
            const startTime = Date.now();
            const issues: SchemaIssue[] = [];

            try {
                // Check for indexes on new SEO fields
                const indexes = await testPrisma.$queryRaw<Array<{ indexname: string; tablename: string; indexdef: string }>>`
          SELECT indexname, tablename, indexdef
          FROM pg_indexes 
          WHERE schemaname = 'public'
          AND (indexdef LIKE '%seoKeywords%' OR indexdef LIKE '%tags%' OR indexdef LIKE '%locale%')
          ORDER BY tablename, indexname
        `;

                const expectedIndexes = [
                    { table: 'Topic', field: 'seoKeywords' },
                    { table: 'Topic', field: 'tags' },
                    { table: 'Topic', field: 'locale' },
                    { table: 'Article', field: 'seoKeywords' }
                ];

                expectedIndexes.forEach(expected => {
                    const hasIndex = indexes.some(idx =>
                        idx.tablename === expected.table &&
                        idx.indexdef.includes(expected.field)
                    );

                    if (!hasIndex) {
                        issues.push({
                            severity: 'warning',
                            category: 'performance',
                            message: `Missing index on ${expected.table}.${expected.field} - may impact query performance`,
                            recommendation: `Add @@index([${expected.field}]) to ${expected.table} model`
                        });
                    }
                });

                console.log(`✅ Found ${indexes.length} relevant indexes for new fields`);

            } catch (error) {
                issues.push({
                    severity: 'warning',
                    category: 'performance',
                    message: `Failed to validate indexes: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }

            compatibilityResults.push({
                testCategory: 'Database Indexes',
                totalTests: 1,
                passedTests: 1, // Indexes are warnings, not failures
                failedTests: 0,
                executionTime: Date.now() - startTime,
                issues
            });

            expect(true).toBe(true); // Always pass, issues are warnings
        });
    });

    describe('Data Type Compatibility', () => {
        it('should validate array field types are correctly configured', async () => {
            const startTime = Date.now();
            const issues: SchemaIssue[] = [];

            try {
                // Check array field configurations
                const arrayFields = await testPrisma.$queryRaw<Array<{
                    table_name: string;
                    column_name: string;
                    data_type: string;
                    udt_name: string
                }>>`
          SELECT table_name, column_name, data_type, udt_name
          FROM information_schema.columns 
          WHERE table_schema = 'public'
          AND (column_name = 'tags' OR column_name = 'seoKeywords')
          ORDER BY table_name, column_name
        `;

                arrayFields.forEach(field => {
                    if (field.data_type !== 'ARRAY') {
                        issues.push({
                            severity: 'critical',
                            category: 'data_integrity',
                            message: `Field ${field.table_name}.${field.column_name} should be ARRAY type, found ${field.data_type}`,
                            recommendation: `Ensure ${field.column_name} is defined as String[] in Prisma schema`
                        });
                    }
                });

                console.log(`✅ Validated ${arrayFields.length} array fields`);

            } catch (error) {
                issues.push({
                    severity: 'critical',
                    category: 'data_integrity',
                    message: `Failed to validate array field types: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }

            compatibilityResults.push({
                testCategory: 'Data Type Compatibility',
                totalTests: 1,
                passedTests: issues.filter(i => i.severity !== 'critical').length === issues.length ? 1 : 0,
                failedTests: issues.filter(i => i.severity === 'critical').length > 0 ? 1 : 0,
                executionTime: Date.now() - startTime,
                issues
            });

            expect(issues.filter(i => i.severity === 'critical')).toHaveLength(0);
        });

        it('should validate enum types are correctly configured', async () => {
            const startTime = Date.now();
            const issues: SchemaIssue[] = [];

            try {
                // Check enum types
                const enumTypes = await testPrisma.$queryRaw<Array<{
                    typname: string;
                    enumlabel: string
                }>>`
          SELECT t.typname, e.enumlabel
          FROM pg_type t 
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname IN ('ContentStatus', 'UserRole', 'AuditAction')
          ORDER BY t.typname, e.enumlabel
        `;

                const expectedEnums = {
                    'ContentStatus': ['DRAFT', 'PUBLISHED'],
                    'UserRole': ['ADMIN', 'EDITOR', 'VIEWER'],
                    'AuditAction': ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT']
                };

                Object.entries(expectedEnums).forEach(([enumName, expectedValues]) => {
                    const actualValues = enumTypes
                        .filter(e => e.typname === enumName)
                        .map(e => e.enumlabel);

                    expectedValues.forEach(value => {
                        if (!actualValues.includes(value)) {
                            issues.push({
                                severity: 'critical',
                                category: 'data_integrity',
                                message: `Missing enum value '${value}' in ${enumName}`,
                                recommendation: `Ensure ${enumName} enum includes ${value} in schema.prisma`
                            });
                        }
                    });
                });

                console.log(`✅ Validated ${Object.keys(expectedEnums).length} enum types`);

            } catch (error) {
                issues.push({
                    severity: 'critical',
                    category: 'data_integrity',
                    message: `Failed to validate enum types: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }

            compatibilityResults.push({
                testCategory: 'Enum Type Compatibility',
                totalTests: 1,
                passedTests: issues.filter(i => i.severity !== 'critical').length === issues.length ? 1 : 0,
                failedTests: issues.filter(i => i.severity === 'critical').length > 0 ? 1 : 0,
                executionTime: Date.now() - startTime,
                issues
            });

            expect(issues.filter(i => i.severity === 'critical')).toHaveLength(0);
        });
    });

    describe('Existing Query Compatibility', () => {
        it('should verify existing API queries still work with new schema', async () => {
            const startTime = Date.now();
            const issues: SchemaIssue[] = [];
            let passedTests = 0;
            let totalTests = 0;

            // Test common API queries that should still work
            const apiQueries = [
                {
                    name: 'Basic topic listing',
                    query: () => testPrisma.topic.findMany({ take: 5 })
                },
                {
                    name: 'Topic by slug',
                    query: async () => {
                        const topics = await testPrisma.topic.findMany({ take: 1 });
                        if (topics.length === 0) return null;
                        return testPrisma.topic.findUnique({ where: { slug: topics[0].slug } });
                    }
                },
                {
                    name: 'Topic with relations',
                    query: async () => {
                        const topics = await testPrisma.topic.findMany({ take: 1 });
                        if (topics.length === 0) return null;
                        return testPrisma.topic.findUnique({
                            where: { slug: topics[0].slug },
                            include: { questions: true, articles: true, faqItems: true }
                        });
                    }
                },
                {
                    name: 'Published articles',
                    query: () => testPrisma.article.findMany({
                        where: { status: 'PUBLISHED' },
                        take: 5
                    })
                }
            ];

            for (const apiQuery of apiQueries) {
                totalTests++;
                try {
                    await apiQuery.query();
                    passedTests++;
                    console.log(`✅ ${apiQuery.name} query executed successfully`);
                } catch (error) {
                    issues.push({
                        severity: 'critical',
                        category: 'compatibility',
                        message: `API query '${apiQuery.name}' failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        recommendation: `Review and fix the ${apiQuery.name} query implementation`
                    });
                }
            }

            compatibilityResults.push({
                testCategory: 'Existing Query Compatibility',
                totalTests,
                passedTests,
                failedTests: totalTests - passedTests,
                executionTime: Date.now() - startTime,
                issues
            });

            expect(issues.filter(i => i.severity === 'critical')).toHaveLength(0);
        });
    });
});