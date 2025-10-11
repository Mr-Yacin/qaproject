/**
 * Simple integration test to verify new field validation works
 */

import { describe, it, expect } from 'vitest';
import { NewFieldsValidator } from './validators/new-fields-validator';
import { topicsWithCompleteFields } from './test-data/new-fields-test-data';

describe('Simple New Field Integration Test', () => {
  it('should validate a topic with complete SEO fields', async () => {
    const testTopic = topicsWithCompleteFields[0];
    const validation = await NewFieldsValidator.validateTopic(testTopic);
    
    expect(validation.valid).toBe(true);
    expect(validation.results.seoTitle.valid).toBe(true);
    expect(validation.results.seoDescription.valid).toBe(true);
    expect(validation.results.seoKeywords.valid).toBe(true);
    expect(validation.results.thumbnailUrl.valid).toBe(true);
    expect(validation.results.serialization.valid).toBe(true);
  });

  it('should validate article SEO fields', () => {
    const testTopic = topicsWithCompleteFields[0];
    const articleValidation = NewFieldsValidator.validateArticle(testTopic.article);
    
    expect(articleValidation.valid).toBe(true);
    expect(articleValidation.results.seoTitle.valid).toBe(true);
    expect(articleValidation.results.seoDescription.valid).toBe(true);
    expect(articleValidation.results.seoKeywords.valid).toBe(true);
    expect(articleValidation.results.serialization.valid).toBe(true);
  });
});