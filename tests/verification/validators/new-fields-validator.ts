/**
 * Validation functions for new SEO fields and thumbnail URLs
 * Handles format validation, content validation, and JSON serialization checks
 */

import { ValidationUtils } from '../utils';

/**
 * SEO field validation results
 */
export interface SEOValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  field: string;
  value: any;
}

/**
 * Thumbnail URL validation results
 */
export interface ThumbnailValidationResult {
  valid: boolean;
  accessible: boolean;
  errors: string[];
  warnings: string[];
  url: string | null;
  resolvedUrl?: string;
}

/**
 * JSON serialization validation results
 */
export interface SerializationValidationResult {
  valid: boolean;
  errors: string[];
  originalData: any;
  serializedData: string;
  deserializedData: any;
}

/**
 * SEO Title Validator
 */
export class SEOTitleValidator {
  private static readonly RECOMMENDED_MIN_LENGTH = 30;
  private static readonly RECOMMENDED_MAX_LENGTH = 60;
  private static readonly ABSOLUTE_MAX_LENGTH = 200;

  static validate(seoTitle: string | null | undefined): SEOValidationResult {
    const result: SEOValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      field: 'seoTitle',
      value: seoTitle
    };

    // Handle null/undefined values
    if (seoTitle === null || seoTitle === undefined) {
      return result; // Null is valid (optional field)
    }

    // Check if it's a string
    if (typeof seoTitle !== 'string') {
      result.valid = false;
      result.errors.push(`SEO title must be a string, got ${typeof seoTitle}`);
      return result;
    }

    // Check for empty string
    if (seoTitle === '') {
      result.warnings.push('SEO title is empty - consider providing a meaningful title');
      return result;
    }

    // Length validation
    if (seoTitle.length > this.ABSOLUTE_MAX_LENGTH) {
      result.valid = false;
      result.errors.push(`SEO title exceeds maximum length of ${this.ABSOLUTE_MAX_LENGTH} characters (${seoTitle.length})`);
    }

    if (seoTitle.length < this.RECOMMENDED_MIN_LENGTH) {
      result.warnings.push(`SEO title is shorter than recommended minimum of ${this.RECOMMENDED_MIN_LENGTH} characters (${seoTitle.length})`);
    }

    if (seoTitle.length > this.RECOMMENDED_MAX_LENGTH) {
      result.warnings.push(`SEO title exceeds recommended maximum of ${this.RECOMMENDED_MAX_LENGTH} characters (${seoTitle.length})`);
    }

    // Content validation
    if (seoTitle.trim() !== seoTitle) {
      result.warnings.push('SEO title has leading or trailing whitespace');
    }

    // Check for potentially problematic characters
    const problematicChars = /[<>]/g;
    if (problematicChars.test(seoTitle)) {
      result.warnings.push('SEO title contains HTML-like characters that may need escaping');
    }

    // Check for excessive repetition
    const words = seoTitle.toLowerCase().split(/\s+/);
    const wordCounts = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const repeatedWords = Object.entries(wordCounts)
      .filter(([word, count]) => count > 2 && word.length > 3)
      .map(([word]) => word);

    if (repeatedWords.length > 0) {
      result.warnings.push(`SEO title has repeated words: ${repeatedWords.join(', ')}`);
    }

    return result;
  }
}

/**
 * SEO Description Validator
 */
export class SEODescriptionValidator {
  private static readonly RECOMMENDED_MIN_LENGTH = 120;
  private static readonly RECOMMENDED_MAX_LENGTH = 160;
  private static readonly ABSOLUTE_MAX_LENGTH = 500;

  static validate(seoDescription: string | null | undefined): SEOValidationResult {
    const result: SEOValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      field: 'seoDescription',
      value: seoDescription
    };

    // Handle null/undefined values
    if (seoDescription === null || seoDescription === undefined) {
      return result; // Null is valid (optional field)
    }

    // Check if it's a string
    if (typeof seoDescription !== 'string') {
      result.valid = false;
      result.errors.push(`SEO description must be a string, got ${typeof seoDescription}`);
      return result;
    }

    // Check for empty string
    if (seoDescription === '') {
      result.warnings.push('SEO description is empty - consider providing a meaningful description');
      return result;
    }

    // Length validation
    if (seoDescription.length > this.ABSOLUTE_MAX_LENGTH) {
      result.valid = false;
      result.errors.push(`SEO description exceeds maximum length of ${this.ABSOLUTE_MAX_LENGTH} characters (${seoDescription.length})`);
    }

    if (seoDescription.length < this.RECOMMENDED_MIN_LENGTH) {
      result.warnings.push(`SEO description is shorter than recommended minimum of ${this.RECOMMENDED_MIN_LENGTH} characters (${seoDescription.length})`);
    }

    if (seoDescription.length > this.RECOMMENDED_MAX_LENGTH) {
      result.warnings.push(`SEO description exceeds recommended maximum of ${this.RECOMMENDED_MAX_LENGTH} characters (${seoDescription.length})`);
    }

    // Content validation
    if (seoDescription.trim() !== seoDescription) {
      result.warnings.push('SEO description has leading or trailing whitespace');
    }

    // Check for HTML tags (should be plain text)
    const htmlTags = /<[^>]+>/g;
    if (htmlTags.test(seoDescription)) {
      result.warnings.push('SEO description contains HTML tags - should be plain text');
    }

    // Check for call-to-action phrases (good practice)
    const ctaPhrases = /\b(learn more|read more|click here|find out|discover|explore)\b/i;
    if (!ctaPhrases.test(seoDescription)) {
      result.warnings.push('SEO description might benefit from a call-to-action phrase');
    }

    return result;
  }
}

/**
 * SEO Keywords Validator
 */
export class SEOKeywordsValidator {
  private static readonly RECOMMENDED_MIN_KEYWORDS = 3;
  private static readonly RECOMMENDED_MAX_KEYWORDS = 10;
  private static readonly ABSOLUTE_MAX_KEYWORDS = 20;
  private static readonly MAX_KEYWORD_LENGTH = 50;

  static validate(seoKeywords: string[] | null | undefined): SEOValidationResult {
    const result: SEOValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      field: 'seoKeywords',
      value: seoKeywords
    };

    // Handle null/undefined values
    if (seoKeywords === null || seoKeywords === undefined) {
      return result; // Null is valid (optional field)
    }

    // Check if it's an array
    if (!Array.isArray(seoKeywords)) {
      result.valid = false;
      result.errors.push(`SEO keywords must be an array, got ${typeof seoKeywords}`);
      return result;
    }

    // Check for empty array
    if (seoKeywords.length === 0) {
      result.warnings.push('SEO keywords array is empty - consider adding relevant keywords');
      return result;
    }

    // Length validation
    if (seoKeywords.length > this.ABSOLUTE_MAX_KEYWORDS) {
      result.valid = false;
      result.errors.push(`Too many SEO keywords: ${seoKeywords.length} (maximum: ${this.ABSOLUTE_MAX_KEYWORDS})`);
    }

    if (seoKeywords.length < this.RECOMMENDED_MIN_KEYWORDS) {
      result.warnings.push(`Few SEO keywords: ${seoKeywords.length} (recommended minimum: ${this.RECOMMENDED_MIN_KEYWORDS})`);
    }

    if (seoKeywords.length > this.RECOMMENDED_MAX_KEYWORDS) {
      result.warnings.push(`Many SEO keywords: ${seoKeywords.length} (recommended maximum: ${this.RECOMMENDED_MAX_KEYWORDS})`);
    }

    // Validate individual keywords
    const duplicates: string[] = [];
    const seen = new Set<string>();

    seoKeywords.forEach((keyword, index) => {
      // Check if keyword is a string
      if (typeof keyword !== 'string') {
        result.valid = false;
        result.errors.push(`SEO keyword at index ${index} must be a string, got ${typeof keyword}`);
        return;
      }

      // Check keyword length
      if (keyword.length > this.MAX_KEYWORD_LENGTH) {
        result.valid = false;
        result.errors.push(`SEO keyword "${keyword}" exceeds maximum length of ${this.MAX_KEYWORD_LENGTH} characters`);
      }

      // Check for empty keywords
      if (keyword.trim() === '') {
        result.warnings.push(`Empty SEO keyword at index ${index}`);
        return;
      }

      // Check for duplicates (case-insensitive)
      const normalizedKeyword = keyword.toLowerCase().trim();
      if (seen.has(normalizedKeyword)) {
        duplicates.push(keyword);
      } else {
        seen.add(normalizedKeyword);
      }

      // Check for whitespace issues
      if (keyword.trim() !== keyword) {
        result.warnings.push(`SEO keyword "${keyword}" has leading or trailing whitespace`);
      }

      // Check for overly generic keywords
      const genericKeywords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
      if (genericKeywords.includes(normalizedKeyword)) {
        result.warnings.push(`SEO keyword "${keyword}" is very generic and may not be effective`);
      }
    });

    if (duplicates.length > 0) {
      result.warnings.push(`Duplicate SEO keywords found: ${duplicates.join(', ')}`);
    }

    return result;
  }
}

/**
 * Thumbnail URL Validator
 */
export class ThumbnailURLValidator {
  private static readonly SUPPORTED_PROTOCOLS = ['http:', 'https:'];
  private static readonly SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
  private static readonly MAX_URL_LENGTH = 2048;

  static async validate(thumbnailUrl: string | null | undefined): Promise<ThumbnailValidationResult> {
    const result: ThumbnailValidationResult = {
      valid: true,
      accessible: false,
      errors: [],
      warnings: [],
      url: thumbnailUrl || null
    };

    // Handle null/undefined values
    if (thumbnailUrl === null || thumbnailUrl === undefined) {
      return result; // Null is valid (optional field)
    }

    // Check if it's a string
    if (typeof thumbnailUrl !== 'string') {
      result.valid = false;
      result.errors.push(`Thumbnail URL must be a string, got ${typeof thumbnailUrl}`);
      return result;
    }

    // Check for empty string
    if (thumbnailUrl === '') {
      result.warnings.push('Thumbnail URL is empty string - consider using null instead');
      return result;
    }

    // Length validation
    if (thumbnailUrl.length > this.MAX_URL_LENGTH) {
      result.valid = false;
      result.errors.push(`Thumbnail URL exceeds maximum length of ${this.MAX_URL_LENGTH} characters`);
      return result;
    }

    // URL format validation
    let parsedUrl: URL;
    try {
      // Handle relative URLs by providing a base
      if (thumbnailUrl.startsWith('/')) {
        parsedUrl = new URL(thumbnailUrl, 'https://example.com');
        result.resolvedUrl = thumbnailUrl; // Keep as relative
      } else {
        parsedUrl = new URL(thumbnailUrl);
        result.resolvedUrl = parsedUrl.href;
      }
    } catch (error) {
      result.valid = false;
      result.errors.push(`Invalid URL format: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }

    // Protocol validation (for absolute URLs)
    if (!thumbnailUrl.startsWith('/') && !this.SUPPORTED_PROTOCOLS.includes(parsedUrl.protocol)) {
      result.warnings.push(`Unsupported protocol: ${parsedUrl.protocol} (supported: ${this.SUPPORTED_PROTOCOLS.join(', ')})`);
    }

    // HTTPS recommendation
    if (parsedUrl.protocol === 'http:' && !thumbnailUrl.startsWith('/')) {
      result.warnings.push('Consider using HTTPS for thumbnail URLs for better security');
    }

    // File extension validation
    const pathname = parsedUrl.pathname.toLowerCase();
    const hasValidExtension = this.SUPPORTED_EXTENSIONS.some(ext => pathname.endsWith(ext));
    
    if (!hasValidExtension && !pathname.includes('?')) { // Skip validation if query params present (dynamic images)
      result.warnings.push(`Thumbnail URL doesn't have a recognized image extension (${this.SUPPORTED_EXTENSIONS.join(', ')})`);
    }

    // Accessibility check (only for absolute URLs in test environment)
    if (!thumbnailUrl.startsWith('/') && process.env.NODE_ENV === 'test') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(parsedUrl.href, { 
          method: 'HEAD',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        result.accessible = response.ok;
        
        if (!response.ok) {
          result.warnings.push(`Thumbnail URL returned status ${response.status}: ${response.statusText}`);
        }

        // Check content type
        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.startsWith('image/')) {
          result.warnings.push(`Thumbnail URL content-type is not an image: ${contentType}`);
        }

      } catch (error) {
        result.warnings.push(`Thumbnail URL accessibility check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return result;
  }

  /**
   * Synchronous validation (without accessibility check)
   */
  static validateSync(thumbnailUrl: string | null | undefined): Omit<ThumbnailValidationResult, 'accessible'> {
    const result = {
      valid: true,
      errors: [] as string[],
      warnings: [] as string[],
      url: thumbnailUrl || null,
      resolvedUrl: undefined as string | undefined
    };

    // Handle null/undefined values
    if (thumbnailUrl === null || thumbnailUrl === undefined) {
      return result;
    }

    // Check if it's a string
    if (typeof thumbnailUrl !== 'string') {
      result.valid = false;
      result.errors.push(`Thumbnail URL must be a string, got ${typeof thumbnailUrl}`);
      return result;
    }

    // Check for empty string
    if (thumbnailUrl === '') {
      result.warnings.push('Thumbnail URL is empty string - consider using null instead');
      return result;
    }

    // Length validation
    if (thumbnailUrl.length > this.MAX_URL_LENGTH) {
      result.valid = false;
      result.errors.push(`Thumbnail URL exceeds maximum length of ${this.MAX_URL_LENGTH} characters`);
      return result;
    }

    // URL format validation
    try {
      if (thumbnailUrl.startsWith('/')) {
        new URL(thumbnailUrl, 'https://example.com');
        result.resolvedUrl = thumbnailUrl;
      } else {
        const parsedUrl = new URL(thumbnailUrl);
        result.resolvedUrl = parsedUrl.href;
        
        // Protocol validation
        if (!this.SUPPORTED_PROTOCOLS.includes(parsedUrl.protocol)) {
          result.warnings.push(`Unsupported protocol: ${parsedUrl.protocol}`);
        }
        
        // HTTPS recommendation
        if (parsedUrl.protocol === 'http:') {
          result.warnings.push('Consider using HTTPS for thumbnail URLs');
        }
      }
    } catch (error) {
      result.valid = false;
      result.errors.push(`Invalid URL format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }
}

/**
 * JSON Serialization Validator
 */
export class JSONSerializationValidator {
  /**
   * Validate that new fields serialize and deserialize correctly
   */
  static validate(data: any): SerializationValidationResult {
    const result: SerializationValidationResult = {
      valid: true,
      errors: [],
      originalData: data,
      serializedData: '',
      deserializedData: null
    };

    try {
      // Serialize to JSON
      result.serializedData = JSON.stringify(data);
      
      // Deserialize back
      result.deserializedData = JSON.parse(result.serializedData);
      
      // Compare original and deserialized data
      const comparisonResult = this.deepCompare(data, result.deserializedData);
      
      if (!comparisonResult.equal) {
        result.valid = false;
        result.errors.push(`Data changed during serialization: ${comparisonResult.differences.join(', ')}`);
      }
      
    } catch (error) {
      result.valid = false;
      result.errors.push(`JSON serialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Deep comparison of objects to detect serialization issues
   */
  private static deepCompare(obj1: any, obj2: any, path: string = ''): { equal: boolean; differences: string[] } {
    const differences: string[] = [];

    if (obj1 === obj2) {
      return { equal: true, differences: [] };
    }

    if (obj1 === null || obj2 === null || obj1 === undefined || obj2 === undefined) {
      if (obj1 !== obj2) {
        differences.push(`${path}: ${obj1} !== ${obj2}`);
      }
      return { equal: differences.length === 0, differences };
    }

    if (typeof obj1 !== typeof obj2) {
      differences.push(`${path}: type mismatch (${typeof obj1} !== ${typeof obj2})`);
      return { equal: false, differences };
    }

    if (Array.isArray(obj1) !== Array.isArray(obj2)) {
      differences.push(`${path}: array mismatch`);
      return { equal: false, differences };
    }

    if (Array.isArray(obj1)) {
      if (obj1.length !== obj2.length) {
        differences.push(`${path}: array length mismatch (${obj1.length} !== ${obj2.length})`);
      }
      
      const maxLength = Math.max(obj1.length, obj2.length);
      for (let i = 0; i < maxLength; i++) {
        const itemPath = `${path}[${i}]`;
        const itemComparison = this.deepCompare(obj1[i], obj2[i], itemPath);
        differences.push(...itemComparison.differences);
      }
    } else if (typeof obj1 === 'object') {
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);
      const allKeys = new Set([...keys1, ...keys2]);
      
      for (const key of allKeys) {
        const keyPath = path ? `${path}.${key}` : key;
        const keyComparison = this.deepCompare(obj1[key], obj2[key], keyPath);
        differences.push(...keyComparison.differences);
      }
    } else if (obj1 !== obj2) {
      differences.push(`${path}: ${obj1} !== ${obj2}`);
    }

    return { equal: differences.length === 0, differences };
  }
}

/**
 * Comprehensive new fields validator
 */
export class NewFieldsValidator {
  /**
   * Validate all new fields in a topic object
   */
  static async validateTopic(topic: any): Promise<{
    valid: boolean;
    results: {
      seoTitle: SEOValidationResult;
      seoDescription: SEOValidationResult;
      seoKeywords: SEOValidationResult;
      thumbnailUrl: ThumbnailValidationResult;
      serialization: SerializationValidationResult;
    };
  }> {
    const results = {
      seoTitle: SEOTitleValidator.validate(topic.seoTitle),
      seoDescription: SEODescriptionValidator.validate(topic.seoDescription),
      seoKeywords: SEOKeywordsValidator.validate(topic.seoKeywords),
      thumbnailUrl: await ThumbnailURLValidator.validate(topic.thumbnailUrl),
      serialization: JSONSerializationValidator.validate(topic)
    };

    const valid = Object.values(results).every(result => result.valid);

    return { valid, results };
  }

  /**
   * Validate all new fields in an article object
   */
  static validateArticle(article: any): {
    valid: boolean;
    results: {
      seoTitle: SEOValidationResult;
      seoDescription: SEOValidationResult;
      seoKeywords: SEOValidationResult;
      serialization: SerializationValidationResult;
    };
  } {
    const results = {
      seoTitle: SEOTitleValidator.validate(article.seoTitle),
      seoDescription: SEODescriptionValidator.validate(article.seoDescription),
      seoKeywords: SEOKeywordsValidator.validate(article.seoKeywords),
      serialization: JSONSerializationValidator.validate(article)
    };

    const valid = Object.values(results).every(result => result.valid);

    return { valid, results };
  }

  /**
   * Generate validation summary
   */
  static generateValidationSummary(validationResults: any): {
    totalFields: number;
    validFields: number;
    invalidFields: number;
    warningsCount: number;
    errors: string[];
    warnings: string[];
  } {
    const summary = {
      totalFields: 0,
      validFields: 0,
      invalidFields: 0,
      warningsCount: 0,
      errors: [] as string[],
      warnings: [] as string[]
    };

    const processResults = (results: any, prefix: string = '') => {
      Object.entries(results).forEach(([key, result]: [string, any]) => {
        if (result && typeof result === 'object' && 'valid' in result) {
          summary.totalFields++;
          
          if (result.valid) {
            summary.validFields++;
          } else {
            summary.invalidFields++;
          }
          
          if (result.errors && Array.isArray(result.errors)) {
            result.errors.forEach((error: string) => {
              summary.errors.push(`${prefix}${key}: ${error}`);
            });
          }
          
          if (result.warnings && Array.isArray(result.warnings)) {
            result.warnings.forEach((warning: string) => {
              summary.warnings.push(`${prefix}${key}: ${warning}`);
            });
            summary.warningsCount += result.warnings.length;
          }
        } else if (result && typeof result === 'object') {
          processResults(result, `${prefix}${key}.`);
        }
      });
    };

    processResults(validationResults);

    return summary;
  }
}