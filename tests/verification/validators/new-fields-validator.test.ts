/**
 * Unit tests for new fields validators
 */

import { describe, it, expect } from 'vitest';
import { 
  SEOTitleValidator,
  SEODescriptionValidator,
  SEOKeywordsValidator,
  ThumbnailURLValidator,
  JSONSerializationValidator,
  NewFieldsValidator
} from './new-fields-validator';

describe('SEOTitleValidator', () => {
  it('should validate null/undefined values as valid', () => {
    expect(SEOTitleValidator.validate(null).valid).toBe(true);
    expect(SEOTitleValidator.validate(undefined).valid).toBe(true);
  });

  it('should validate normal SEO titles', () => {
    const result = SEOTitleValidator.validate('Great SEO Title for Testing');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should flag overly long titles', () => {
    const longTitle = 'A'.repeat(250);
    const result = SEOTitleValidator.validate(longTitle);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should warn about short titles', () => {
    const result = SEOTitleValidator.validate('Short');
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe('SEODescriptionValidator', () => {
  it('should validate null/undefined values as valid', () => {
    expect(SEODescriptionValidator.validate(null).valid).toBe(true);
    expect(SEODescriptionValidator.validate(undefined).valid).toBe(true);
  });

  it('should validate normal descriptions', () => {
    const desc = 'This is a comprehensive description that provides valuable information about the content and helps users understand what they can expect.';
    const result = SEODescriptionValidator.validate(desc);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should flag overly long descriptions', () => {
    const longDesc = 'A'.repeat(600);
    const result = SEODescriptionValidator.validate(longDesc);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('SEOKeywordsValidator', () => {
  it('should validate null/undefined values as valid', () => {
    expect(SEOKeywordsValidator.validate(null).valid).toBe(true);
    expect(SEOKeywordsValidator.validate(undefined).valid).toBe(true);
  });

  it('should validate normal keyword arrays', () => {
    const keywords = ['seo', 'optimization', 'content', 'marketing'];
    const result = SEOKeywordsValidator.validate(keywords);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should flag too many keywords', () => {
    const manyKeywords = Array(25).fill('keyword');
    const result = SEOKeywordsValidator.validate(manyKeywords);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should detect duplicate keywords', () => {
    const keywords = ['seo', 'SEO', 'optimization', 'seo'];
    const result = SEOKeywordsValidator.validate(keywords);
    expect(result.warnings.some(w => w.includes('Duplicate'))).toBe(true);
  });
});

describe('ThumbnailURLValidator', () => {
  it('should validate null/undefined values as valid', async () => {
    const result1 = await ThumbnailURLValidator.validate(null);
    const result2 = await ThumbnailURLValidator.validate(undefined);
    expect(result1.valid).toBe(true);
    expect(result2.valid).toBe(true);
  });

  it('should validate HTTPS URLs', async () => {
    const result = await ThumbnailURLValidator.validate('https://example.com/image.jpg');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate relative paths', async () => {
    const result = await ThumbnailURLValidator.validate('/uploads/image.jpg');
    expect(result.valid).toBe(true);
    expect(result.resolvedUrl).toBe('/uploads/image.jpg');
  });

  it('should flag invalid URLs', async () => {
    const result = await ThumbnailURLValidator.validate('not-a-url');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should use sync validation correctly', () => {
    const result = ThumbnailURLValidator.validateSync('https://example.com/image.jpg');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('JSONSerializationValidator', () => {
  it('should validate simple objects', () => {
    const data = { title: 'Test', description: 'Test description' };
    const result = JSONSerializationValidator.validate(data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should handle null values correctly', () => {
    const data = { title: 'Test', description: null, keywords: null };
    const result = JSONSerializationValidator.validate(data);
    expect(result.valid).toBe(true);
    expect(result.deserializedData.description).toBe(null);
  });

  it('should handle arrays correctly', () => {
    const data = { keywords: ['seo', 'test'], tags: [] };
    const result = JSONSerializationValidator.validate(data);
    expect(result.valid).toBe(true);
    expect(Array.isArray(result.deserializedData.keywords)).toBe(true);
    expect(Array.isArray(result.deserializedData.tags)).toBe(true);
  });
});

describe('NewFieldsValidator', () => {
  const sampleTopic = {
    slug: 'test-topic',
    title: 'Test Topic',
    locale: 'en',
    tags: ['test'],
    thumbnailUrl: 'https://example.com/image.jpg',
    seoTitle: 'Test SEO Title',
    seoDescription: 'Test SEO description for validation',
    seoKeywords: ['test', 'seo', 'validation'],
    mainQuestion: 'What is this test about?',
    article: {
      content: '<h1>Test</h1><p>Content</p>',
      status: 'PUBLISHED' as const,
      seoTitle: 'Article SEO Title',
      seoDescription: 'Article SEO description',
      seoKeywords: ['article', 'test']
    },
    faqItems: []
  };

  it('should validate complete topic with all fields', async () => {
    const result = await NewFieldsValidator.validateTopic(sampleTopic);
    expect(result.valid).toBe(true);
    expect(result.results.seoTitle.valid).toBe(true);
    expect(result.results.seoDescription.valid).toBe(true);
    expect(result.results.seoKeywords.valid).toBe(true);
    expect(result.results.thumbnailUrl.valid).toBe(true);
    expect(result.results.serialization.valid).toBe(true);
  });

  it('should validate article fields', () => {
    const result = NewFieldsValidator.validateArticle(sampleTopic.article);
    expect(result.valid).toBe(true);
    expect(result.results.seoTitle.valid).toBe(true);
    expect(result.results.seoDescription.valid).toBe(true);
    expect(result.results.seoKeywords.valid).toBe(true);
    expect(result.results.serialization.valid).toBe(true);
  });

  it('should generate validation summary', async () => {
    const validation = await NewFieldsValidator.validateTopic(sampleTopic);
    const summary = NewFieldsValidator.generateValidationSummary(validation.results);
    
    expect(summary.totalFields).toBeGreaterThan(0);
    expect(summary.validFields).toBeGreaterThan(0);
    expect(Array.isArray(summary.errors)).toBe(true);
    expect(Array.isArray(summary.warnings)).toBe(true);
  });
});