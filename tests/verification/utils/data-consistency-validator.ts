/**
 * Data Consistency Validation Utilities
 * 
 * This module provides utilities to validate data consistency between
 * admin interface operations and API responses, ensuring that changes
 * made through the admin interface are immediately reflected in the API.
 */

import { PrismaClient } from '@prisma/client';
import { ValidationUtils } from '../utils';
import { validateTopicBySlugResponse, validateSEOFields, validateArticleSEOFields } from './response-validator';
import type { TopicTestData } from '../types';

export interface ConsistencyValidationResult {
    consistent: boolean;
    mismatches: DataMismatch[];
    fieldValidations: FieldValidationResult[];
    timestampConsistency: TimestampConsistencyResult;
}

export interface DataMismatch {
    field: string;
    adminValue: any;
    apiValue: any;
    severity: 'error' | 'warning';
    description: string;
}

export interface FieldValidationResult {
    field: string;
    valid: boolean;
    error?: string;
    adminValue: any;
    apiValue: any;
}

export interface TimestampConsistencyResult {
    consistent: boolean;
    adminTimestamp: Date;
    apiTimestamp: Date;
    timeDifference: number; // in milliseconds
    withinThreshold: boolean;
}

export interface APIFetcher {
    fetchTopicBySlug(slug: string): Promise<any>;
    fetchTopicsList(filters?: any): Promise<any>;
}

/**
 * HTTP-based API fetcher implementation
 */
export class HTTPAPIFetcher implements APIFetcher {
    private baseUrl: string;
    private headers: Record<string, string>;

    constructor(baseUrl: string, headers: Record<string, string> = {}) {
        this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
        this.headers = {
            'Content-Type': 'application/json',
            ...headers,
        };
    }

    async fetchTopicBySlug(slug: string): Promise<any> {
        const response = await fetch(`${this.baseUrl}/api/topics/${slug}`, {
            method: 'GET',
            headers: this.headers,
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    async fetchTopicsList(filters: any = {}): Promise<any> {
        const searchParams = new URLSearchParams();

        // Add common filters
        if (filters.locale) searchParams.append('locale', filters.locale);
        if (filters.tags) {
            if (Array.isArray(filters.tags)) {
                filters.tags.forEach((tag: string) => searchParams.append('tags', tag));
            } else {
                searchParams.append('tags', filters.tags);
            }
        }
        if (filters.page) searchParams.append('page', filters.page.toString());
        if (filters.limit) searchParams.append('limit', filters.limit.toString());

        const url = `${this.baseUrl}/api/topics${searchParams.toString() ? '?' + searchParams.toString() : ''}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: this.headers,
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }
}

/**
 * Data consistency validator that compares admin-created data with API responses
 */
export class DataConsistencyValidator {
    private prisma: PrismaClient;
    private apiFetcher: APIFetcher;
    private timestampThreshold: number; // milliseconds

    constructor(
        prisma: PrismaClient,
        apiFetcher: APIFetcher,
        timestampThreshold: number = 5000 // 5 seconds default
    ) {
        this.prisma = prisma;
        this.apiFetcher = apiFetcher;
        this.timestampThreshold = timestampThreshold;
    }

    /**
     * Validate consistency between admin-created topic and API response
     */
    async validateTopicConsistency(
        topicId: string,
        expectedData?: TopicTestData
    ): Promise<ConsistencyValidationResult> {
        // Fetch data from database (admin perspective)
        const adminData = await this.prisma.topic.findUnique({
            where: { id: topicId },
            include: {
                questions: { where: { isPrimary: true } },
                articles: true,
                faqItems: { orderBy: { order: 'asc' } },
            },
        });

        if (!adminData) {
            throw new Error(`Topic with ID ${topicId} not found in database`);
        }

        // Fetch data from API
        const apiResponse = await this.apiFetcher.fetchTopicBySlug(adminData.slug);

        // Validate API response structure first
        const responseValidation = validateTopicBySlugResponse(apiResponse);
        if (!responseValidation.valid) {
            throw new Error(`Invalid API response structure: ${responseValidation.errors.join(', ')}`);
        }

        const apiData = apiResponse.topic;
        const mismatches: DataMismatch[] = [];
        const fieldValidations: FieldValidationResult[] = [];

        // Compare basic topic fields
        this.compareField('id', adminData.id, apiData.id, mismatches, fieldValidations);
        this.compareField('slug', adminData.slug, apiData.slug, mismatches, fieldValidations);
        this.compareField('title', adminData.title, apiData.title, mismatches, fieldValidations);
        this.compareField('locale', adminData.locale, apiData.locale, mismatches, fieldValidations);
        this.compareArrayField('tags', adminData.tags, apiData.tags, mismatches, fieldValidations);
        this.compareField('thumbnailUrl', adminData.thumbnailUrl, apiData.thumbnailUrl, mismatches, fieldValidations);

        // Compare SEO fields
        this.compareField('seoTitle', adminData.seoTitle, apiData.seoTitle, mismatches, fieldValidations);
        this.compareField('seoDescription', adminData.seoDescription, apiData.seoDescription, mismatches, fieldValidations);
        this.compareArrayField('seoKeywords', adminData.seoKeywords, apiData.seoKeywords, mismatches, fieldValidations);

        // Validate SEO fields structure
        const seoValidation = validateSEOFields(apiData);
        if (!seoValidation.valid) {
            seoValidation.errors.forEach(error => {
                mismatches.push({
                    field: 'seoFields',
                    adminValue: 'valid',
                    apiValue: 'invalid',
                    severity: 'error',
                    description: `SEO field validation failed: ${error}`,
                });
            });
        }

        // Compare primary question
        const primaryQuestion = adminData.questions[0];
        const apiPrimaryQuestion = apiResponse.primaryQuestion;

        if (primaryQuestion && apiPrimaryQuestion) {
            this.compareField('primaryQuestion.text', primaryQuestion.text, apiPrimaryQuestion.text, mismatches, fieldValidations);
            this.compareField('primaryQuestion.isPrimary', primaryQuestion.isPrimary, apiPrimaryQuestion.isPrimary, mismatches, fieldValidations);
        } else if (primaryQuestion && !apiPrimaryQuestion) {
            mismatches.push({
                field: 'primaryQuestion',
                adminValue: primaryQuestion.text,
                apiValue: null,
                severity: 'error',
                description: 'Primary question exists in admin but not in API response',
            });
        } else if (!primaryQuestion && apiPrimaryQuestion) {
            mismatches.push({
                field: 'primaryQuestion',
                adminValue: null,
                apiValue: apiPrimaryQuestion.text,
                severity: 'error',
                description: 'Primary question exists in API but not in admin data',
            });
        }

        // Compare article
        const adminArticle = adminData.articles[0];
        const apiArticle = apiResponse.article;

        if (adminArticle && apiArticle) {
            this.compareField('article.content', adminArticle.content, apiArticle.content, mismatches, fieldValidations);
            this.compareField('article.status', adminArticle.status, apiArticle.status, mismatches, fieldValidations);
            this.compareField('article.seoTitle', adminArticle.seoTitle, apiArticle.seoTitle, mismatches, fieldValidations);
            this.compareField('article.seoDescription', adminArticle.seoDescription, apiArticle.seoDescription, mismatches, fieldValidations);
            this.compareArrayField('article.seoKeywords', adminArticle.seoKeywords, apiArticle.seoKeywords, mismatches, fieldValidations);

            // Validate article SEO fields structure
            const articleSeoValidation = validateArticleSEOFields(apiArticle);
            if (!articleSeoValidation.valid) {
                articleSeoValidation.errors.forEach(error => {
                    mismatches.push({
                        field: 'article.seoFields',
                        adminValue: 'valid',
                        apiValue: 'invalid',
                        severity: 'error',
                        description: `Article SEO field validation failed: ${error}`,
                    });
                });
            }
        } else if (adminArticle && !apiArticle) {
            mismatches.push({
                field: 'article',
                adminValue: 'exists',
                apiValue: null,
                severity: 'error',
                description: 'Article exists in admin but not in API response',
            });
        } else if (!adminArticle && apiArticle) {
            mismatches.push({
                field: 'article',
                adminValue: null,
                apiValue: 'exists',
                severity: 'error',
                description: 'Article exists in API but not in admin data',
            });
        }

        // Compare FAQ items
        const adminFaqItems = adminData.faqItems;
        const apiFaqItems = apiResponse.faqItems || [];

        if (adminFaqItems.length !== apiFaqItems.length) {
            mismatches.push({
                field: 'faqItems.length',
                adminValue: adminFaqItems.length,
                apiValue: apiFaqItems.length,
                severity: 'error',
                description: 'FAQ items count mismatch between admin and API',
            });
        } else {
            // Compare each FAQ item
            for (let i = 0; i < adminFaqItems.length; i++) {
                const adminFaq = adminFaqItems[i];
                const apiFaq = apiFaqItems[i];

                this.compareField(`faqItems[${i}].question`, adminFaq.question, apiFaq.question, mismatches, fieldValidations);
                this.compareField(`faqItems[${i}].answer`, adminFaq.answer, apiFaq.answer, mismatches, fieldValidations);
                this.compareField(`faqItems[${i}].order`, adminFaq.order, apiFaq.order, mismatches, fieldValidations);
            }
        }

        // Check timestamp consistency
        const timestampConsistency = this.validateTimestampConsistency(
            adminData.updatedAt,
            new Date(apiData.updatedAt)
        );

        // If expected data is provided, validate against it
        if (expectedData) {
            this.validateAgainstExpectedData(apiData, expectedData, mismatches, fieldValidations);
        }

        return {
            consistent: mismatches.length === 0,
            mismatches,
            fieldValidations,
            timestampConsistency,
        };
    }

    /**
     * Validate that topic appears correctly in topics list API
     */
    async validateTopicInList(
        topicId: string,
        filters?: any
    ): Promise<{ found: boolean; consistent: boolean; mismatches: DataMismatch[] }> {
        // Fetch data from database
        const adminData = await this.prisma.topic.findUnique({
            where: { id: topicId },
            include: {
                questions: { where: { isPrimary: true } },
                articles: true,
            },
        });

        if (!adminData) {
            throw new Error(`Topic with ID ${topicId} not found in database`);
        }

        // Fetch topics list from API
        const apiResponse = await this.apiFetcher.fetchTopicsList(filters);

        // Find the topic in the list
        const apiTopic = apiResponse.items?.find((item: any) => item.topic.id === topicId);

        if (!apiTopic) {
            return {
                found: false,
                consistent: false,
                mismatches: [{
                    field: 'topicInList',
                    adminValue: 'exists',
                    apiValue: 'not found',
                    severity: 'error',
                    description: 'Topic exists in admin but not found in API topics list',
                }],
            };
        }

        // Compare the topic data in the list
        const mismatches: DataMismatch[] = [];
        const fieldValidations: FieldValidationResult[] = [];

        const topicData = apiTopic.topic;
        this.compareField('id', adminData.id, topicData.id, mismatches, fieldValidations);
        this.compareField('slug', adminData.slug, topicData.slug, mismatches, fieldValidations);
        this.compareField('title', adminData.title, topicData.title, mismatches, fieldValidations);
        this.compareField('locale', adminData.locale, topicData.locale, mismatches, fieldValidations);
        this.compareArrayField('tags', adminData.tags, topicData.tags, mismatches, fieldValidations);

        return {
            found: true,
            consistent: mismatches.length === 0,
            mismatches,
        };
    }

    /**
     * Compare a single field between admin and API data
     */
    private compareField(
        fieldName: string,
        adminValue: any,
        apiValue: any,
        mismatches: DataMismatch[],
        fieldValidations: FieldValidationResult[]
    ): void {
        const isEqual = ValidationUtils.deepEqual(adminValue, apiValue);

        fieldValidations.push({
            field: fieldName,
            valid: isEqual,
            error: isEqual ? undefined : 'Values do not match',
            adminValue,
            apiValue,
        });

        if (!isEqual) {
            mismatches.push({
                field: fieldName,
                adminValue,
                apiValue,
                severity: 'error',
                description: `Field ${fieldName} mismatch between admin and API`,
            });
        }
    }

    /**
     * Compare array fields with special handling for order and content
     */
    private compareArrayField(
        fieldName: string,
        adminValue: any[] | null,
        apiValue: any[] | null,
        mismatches: DataMismatch[],
        fieldValidations: FieldValidationResult[]
    ): void {
        // Handle null/undefined arrays
        const adminArray = adminValue || [];
        const apiArray = apiValue || [];

        const isEqual = ValidationUtils.deepEqual(adminArray, apiArray);

        fieldValidations.push({
            field: fieldName,
            valid: isEqual,
            error: isEqual ? undefined : 'Array values do not match',
            adminValue: adminArray,
            apiValue: apiArray,
        });

        if (!isEqual) {
            mismatches.push({
                field: fieldName,
                adminValue: adminArray,
                apiValue: apiArray,
                severity: 'error',
                description: `Array field ${fieldName} mismatch between admin and API`,
            });
        }
    }

    /**
     * Validate timestamp consistency between admin and API data
     */
    private validateTimestampConsistency(
        adminTimestamp: Date,
        apiTimestamp: Date
    ): TimestampConsistencyResult {
        const timeDifference = Math.abs(apiTimestamp.getTime() - adminTimestamp.getTime());
        const withinThreshold = timeDifference <= this.timestampThreshold;

        return {
            consistent: withinThreshold,
            adminTimestamp,
            apiTimestamp,
            timeDifference,
            withinThreshold,
        };
    }

    /**
     * Validate API data against expected test data
     */
    private validateAgainstExpectedData(
        apiData: any,
        expectedData: TopicTestData,
        mismatches: DataMismatch[],
        fieldValidations: FieldValidationResult[]
    ): void {
        // Compare against expected values
        if (expectedData.title) {
            this.compareField('expected.title', expectedData.title, apiData.title, mismatches, fieldValidations);
        }

        if (expectedData.locale) {
            this.compareField('expected.locale', expectedData.locale, apiData.locale, mismatches, fieldValidations);
        }

        if (expectedData.tags) {
            this.compareArrayField('expected.tags', expectedData.tags, apiData.tags, mismatches, fieldValidations);
        }

        if (expectedData.seoTitle !== undefined) {
            this.compareField('expected.seoTitle', expectedData.seoTitle, apiData.seoTitle, mismatches, fieldValidations);
        }

        if (expectedData.seoDescription !== undefined) {
            this.compareField('expected.seoDescription', expectedData.seoDescription, apiData.seoDescription, mismatches, fieldValidations);
        }

        if (expectedData.seoKeywords !== undefined) {
            this.compareArrayField('expected.seoKeywords', expectedData.seoKeywords, apiData.seoKeywords, mismatches, fieldValidations);
        }

        if (expectedData.thumbnailUrl !== undefined) {
            this.compareField('expected.thumbnailUrl', expectedData.thumbnailUrl, apiData.thumbnailUrl, mismatches, fieldValidations);
        }
    }

    /**
     * Batch validate multiple topics for consistency
     */
    async validateMultipleTopicsConsistency(
        topicIds: string[]
    ): Promise<Map<string, ConsistencyValidationResult>> {
        const results = new Map<string, ConsistencyValidationResult>();

        for (const topicId of topicIds) {
            try {
                const result = await this.validateTopicConsistency(topicId);
                results.set(topicId, result);
            } catch (error) {
                // Create error result for failed validations
                results.set(topicId, {
                    consistent: false,
                    mismatches: [{
                        field: 'validation',
                        adminValue: 'accessible',
                        apiValue: 'error',
                        severity: 'error',
                        description: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    }],
                    fieldValidations: [],
                    timestampConsistency: {
                        consistent: false,
                        adminTimestamp: new Date(),
                        apiTimestamp: new Date(),
                        timeDifference: 0,
                        withinThreshold: false,
                    },
                });
            }
        }

        return results;
    }

    /**
     * Generate a summary report of consistency validation results
     */
    generateConsistencyReport(
        results: Map<string, ConsistencyValidationResult>
    ): {
        totalTopics: number;
        consistentTopics: number;
        inconsistentTopics: number;
        totalMismatches: number;
        criticalMismatches: number;
        summary: string[];
    } {
        const totalTopics = results.size;
        let consistentTopics = 0;
        let totalMismatches = 0;
        let criticalMismatches = 0;
        const summary: string[] = [];

        for (const [topicId, result] of results) {
            if (result.consistent) {
                consistentTopics++;
            } else {
                const errorMismatches = result.mismatches.filter(m => m.severity === 'error');
                totalMismatches += result.mismatches.length;
                criticalMismatches += errorMismatches.length;

                summary.push(`Topic ${topicId}: ${errorMismatches.length} critical issues, ${result.mismatches.length} total issues`);
            }
        }

        const inconsistentTopics = totalTopics - consistentTopics;

        return {
            totalTopics,
            consistentTopics,
            inconsistentTopics,
            totalMismatches,
            criticalMismatches,
            summary,
        };
    }
}