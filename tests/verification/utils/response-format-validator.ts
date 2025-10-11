/**
 * Response Format Validation Utilities
 * 
 * Provides comprehensive validation to ensure existing fields maintain types and structure,
 * new optional fields don't affect existing parsers, and JSON response format consistency.
 * 
 * Requirements: 8.2, 8.3
 */

import { z } from 'zod';

export interface FieldTypeValidation {
  fieldName: string;
  expectedType: string;
  actualType: string;
  valid: boolean;
}

export interface StructureValidation {
  hasRequiredFields: boolean;
  fieldTypesCorrect: boolean;
  noExtraFields: boolean;
  validationErrors: string[];
}

export interface BackwardCompatibilityResult {
  compatible: boolean;
  breakingChanges: string[];
  warnings: string[];
  fieldValidations: FieldTypeValidation[];
}

export interface NewFieldsValidation {
  allOptional: boolean;
  properlyTyped: boolean;
  nonBreaking: boolean;
  issues: string[];
}

export interface JSONFormatValidation {
  validJSON: boolean;
  consistentStructure: boolean;
  properEncoding: boolean;
  issues: string[];
}

/**
 * Legacy field definitions for backward compatibility validation
 */
export const LEGACY_TOPIC_FIELDS = {
  required: {
    id: 'string',
    slug: 'string',
    title: 'string',
    locale: 'string',
    tags: 'array',
    createdAt: 'string',
    updatedAt: 'string',
  },
  optional: {
    // These were always optional in the original schema
  }
} as const;

export const LEGACY_QUESTION_FIELDS = {
  required: {
    id: 'string',
    topicId: 'string',
    text: 'string',
    isPrimary: 'boolean',
    createdAt: 'string',
    updatedAt: 'string',
  },
  optional: {}
} as const;

export const LEGACY_ARTICLE_FIELDS = {
  required: {
    id: 'string',
    topicId: 'string',
    content: 'string',
    status: 'string',
    createdAt: 'string',
    updatedAt: 'string',
  },
  optional: {}
} as const;

export const LEGACY_FAQ_FIELDS = {
  required: {
    id: 'string',
    topicId: 'string',
    question: 'string',
    answer: 'string',
    order: 'number',
    createdAt: 'string',
    updatedAt: 'string',
  },
  optional: {}
} as const;

export const LEGACY_PAGINATION_FIELDS = {
  required: {
    total: 'number',
    page: 'number',
    limit: 'number',
    totalPages: 'number',
  },
  optional: {}
} as const;

/**
 * New fields that were added and should be optional
 */
export const NEW_FIELDS = {
  topic: {
    seoTitle: 'string|null',
    seoDescription: 'string|null',
    seoKeywords: 'array',
    thumbnailUrl: 'string|null',
  },
  article: {
    seoTitle: 'string|null',
    seoDescription: 'string|null',
    seoKeywords: 'array',
  }
} as const;

/**
 * Validates response format for backward compatibility
 */
export class ResponseFormatValidator {
  
  /**
   * Validates that existing fields maintain their types and structure
   */
  validateExistingFieldTypes(data: any, entityType: 'topic' | 'question' | 'article' | 'faq' | 'pagination'): StructureValidation {
    const validationErrors: string[] = [];
    
    let requiredFields: Record<string, string>;
    let optionalFields: Record<string, string>;
    
    switch (entityType) {
      case 'topic':
        requiredFields = LEGACY_TOPIC_FIELDS.required;
        optionalFields = LEGACY_TOPIC_FIELDS.optional;
        break;
      case 'question':
        requiredFields = LEGACY_QUESTION_FIELDS.required;
        optionalFields = LEGACY_QUESTION_FIELDS.optional;
        break;
      case 'article':
        requiredFields = LEGACY_ARTICLE_FIELDS.required;
        optionalFields = LEGACY_ARTICLE_FIELDS.optional;
        break;
      case 'faq':
        requiredFields = LEGACY_FAQ_FIELDS.required;
        optionalFields = LEGACY_FAQ_FIELDS.optional;
        break;
      case 'pagination':
        requiredFields = LEGACY_PAGINATION_FIELDS.required;
        optionalFields = LEGACY_PAGINATION_FIELDS.optional;
        break;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }

    // Check required fields
    const hasRequiredFields = Object.keys(requiredFields).every(field => {
      if (!(field in data)) {
        validationErrors.push(`Missing required field: ${field}`);
        return false;
      }
      return true;
    });

    // Check field types
    const fieldTypesCorrect = Object.entries(requiredFields).every(([field, expectedType]) => {
      if (!(field in data)) return false; // Already handled above
      
      const actualValue = data[field];
      const isCorrectType = this.validateFieldType(actualValue, expectedType);
      
      if (!isCorrectType) {
        validationErrors.push(`Field ${field} has incorrect type: expected ${expectedType}, got ${typeof actualValue}`);
        return false;
      }
      return true;
    });

    // Check for extra fields that shouldn't be there (this is lenient for new fields)
    const allExpectedFields = { ...requiredFields, ...optionalFields };
    const extraFields = Object.keys(data).filter(field => 
      !(field in allExpectedFields) && 
      !this.isKnownNewField(field, entityType) &&
      !this.isKnownContextField(field, entityType)
    );
    
    const noExtraFields = extraFields.length === 0;
    if (!noExtraFields) {
      validationErrors.push(`Unexpected fields found: ${extraFields.join(', ')}`);
    }

    return {
      hasRequiredFields,
      fieldTypesCorrect,
      noExtraFields,
      validationErrors,
    };
  }

  /**
   * Validates that new optional fields don't break existing parsers
   */
  validateNewFieldsCompatibility(data: any, entityType: 'topic' | 'article'): NewFieldsValidation {
    const issues: string[] = [];
    
    const newFields = entityType === 'topic' ? NEW_FIELDS.topic : NEW_FIELDS.article;
    
    let allOptional = true;
    let properlyTyped = true;
    
    Object.entries(newFields).forEach(([fieldName, expectedType]) => {
      if (fieldName in data) {
        const value = data[fieldName];
        
        // Check if field is properly optional (can be null)
        if (expectedType.includes('null') && value !== null && value !== undefined) {
          // Field has a value, check if it's the correct type
          const baseType = expectedType.split('|')[0];
          if (!this.validateFieldType(value, baseType)) {
            properlyTyped = false;
            issues.push(`New field ${fieldName} has incorrect type when present: expected ${baseType}, got ${typeof value}`);
          }
        } else if (!expectedType.includes('null') && value === null) {
          // Field should not be null but is
          allOptional = false;
          issues.push(`New field ${fieldName} is null but should not be nullable`);
        }
        
        // Special handling for arrays
        if (expectedType === 'array' && !Array.isArray(value)) {
          properlyTyped = false;
          issues.push(`New field ${fieldName} should be an array but is ${typeof value}`);
        }
      }
    });

    const nonBreaking = allOptional && properlyTyped && issues.length === 0;

    return {
      allOptional,
      properlyTyped,
      nonBreaking,
      issues,
    };
  }

  /**
   * Validates JSON response format consistency
   */
  validateJSONFormat(responseText: string, endpoint: string): JSONFormatValidation {
    const issues: string[] = [];
    
    // Check if it's valid JSON
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (error) {
      return {
        validJSON: false,
        consistentStructure: false,
        properEncoding: false,
        issues: ['Response is not valid JSON: ' + (error instanceof Error ? error.message : 'Unknown error')],
      };
    }

    // Check for consistent structure based on endpoint
    const consistentStructure = this.validateEndpointStructure(parsedData, endpoint);
    if (!consistentStructure) {
      issues.push(`Response structure is inconsistent for endpoint ${endpoint}`);
    }

    // Check for proper encoding (no weird characters, proper UTF-8)
    const properEncoding = this.validateEncoding(responseText);
    if (!properEncoding) {
      issues.push('Response contains encoding issues');
    }

    // Check for consistent field naming (camelCase)
    const consistentNaming = this.validateFieldNaming(parsedData);
    if (!consistentNaming) {
      issues.push('Response contains inconsistent field naming');
    }

    return {
      validJSON: true,
      consistentStructure,
      properEncoding,
      issues,
    };
  }

  /**
   * Comprehensive backward compatibility validation
   */
  validateBackwardCompatibility(data: any, endpoint: string): BackwardCompatibilityResult {
    const breakingChanges: string[] = [];
    const warnings: string[] = [];
    const fieldValidations: FieldTypeValidation[] = [];

    // Validate based on endpoint type
    if (endpoint === '/api/topics') {
      // Paginated topics response
      const paginationValidation = this.validateExistingFieldTypes(data, 'pagination');
      if (!paginationValidation.hasRequiredFields || !paginationValidation.fieldTypesCorrect) {
        breakingChanges.push(...paginationValidation.validationErrors);
      }

      if (data.items && Array.isArray(data.items)) {
        data.items.forEach((item: any, index: number) => {
          if (item.topic) {
            const topicValidation = this.validateExistingFieldTypes(item.topic, 'topic');
            if (!topicValidation.hasRequiredFields || !topicValidation.fieldTypesCorrect) {
              breakingChanges.push(...topicValidation.validationErrors.map(err => `Item ${index}: ${err}`));
            }

            // Check new fields compatibility
            const newFieldsValidation = this.validateNewFieldsCompatibility(item.topic, 'topic');
            if (!newFieldsValidation.nonBreaking) {
              warnings.push(...newFieldsValidation.issues.map(issue => `Item ${index}: ${issue}`));
            }
          }

          if (item.article) {
            const articleValidation = this.validateExistingFieldTypes(item.article, 'article');
            if (!articleValidation.hasRequiredFields || !articleValidation.fieldTypesCorrect) {
              breakingChanges.push(...articleValidation.validationErrors.map(err => `Item ${index} article: ${err}`));
            }

            // Check new fields compatibility
            const newFieldsValidation = this.validateNewFieldsCompatibility(item.article, 'article');
            if (!newFieldsValidation.nonBreaking) {
              warnings.push(...newFieldsValidation.issues.map(issue => `Item ${index} article: ${issue}`));
            }
          }
        });
      } else {
        breakingChanges.push('Missing or invalid items array');
      }
    } else if (endpoint.startsWith('/api/topics/')) {
      // Single topic response
      if (data.topic) {
        const topicValidation = this.validateExistingFieldTypes(data.topic, 'topic');
        if (!topicValidation.hasRequiredFields || !topicValidation.fieldTypesCorrect) {
          breakingChanges.push(...topicValidation.validationErrors);
        }

        const newFieldsValidation = this.validateNewFieldsCompatibility(data.topic, 'topic');
        if (!newFieldsValidation.nonBreaking) {
          warnings.push(...newFieldsValidation.issues);
        }
      } else {
        breakingChanges.push('Missing topic object');
      }

      if (data.article) {
        const articleValidation = this.validateExistingFieldTypes(data.article, 'article');
        if (!articleValidation.hasRequiredFields || !articleValidation.fieldTypesCorrect) {
          breakingChanges.push(...articleValidation.validationErrors.map(err => `Article: ${err}`));
        }

        const newFieldsValidation = this.validateNewFieldsCompatibility(data.article, 'article');
        if (!newFieldsValidation.nonBreaking) {
          warnings.push(...newFieldsValidation.issues.map(issue => `Article: ${issue}`));
        }
      }
    }

    return {
      compatible: breakingChanges.length === 0,
      breakingChanges,
      warnings,
      fieldValidations,
    };
  }

  /**
   * Validates field type against expected type
   */
  private validateFieldType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'null':
        return value === null;
      default:
        return false;
    }
  }

  /**
   * Checks if a field is a known new field
   */
  private isKnownNewField(fieldName: string, entityType: string): boolean {
    if (entityType === 'topic') {
      return fieldName in NEW_FIELDS.topic;
    } else if (entityType === 'article') {
      return fieldName in NEW_FIELDS.article;
    }
    return false;
  }

  /**
   * Checks if a field is a known context field (like items in pagination responses)
   */
  private isKnownContextField(fieldName: string, entityType: string): boolean {
    if (entityType === 'pagination') {
      // For pagination validation, items is expected to be present in the full response
      return fieldName === 'items';
    }
    return false;
  }

  /**
   * Validates endpoint-specific structure
   */
  private validateEndpointStructure(data: any, endpoint: string): boolean {
    if (endpoint === '/api/topics') {
      return (
        typeof data === 'object' &&
        'items' in data &&
        Array.isArray(data.items) &&
        'total' in data &&
        'page' in data &&
        'limit' in data &&
        'totalPages' in data
      );
    } else if (endpoint.startsWith('/api/topics/')) {
      return (
        typeof data === 'object' &&
        'topic' in data &&
        typeof data.topic === 'object'
      );
    }
    return true; // For other endpoints, assume valid
  }

  /**
   * Validates text encoding
   */
  private validateEncoding(text: string): boolean {
    try {
      // Check for common encoding issues
      const hasInvalidChars = /[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(text);
      return !hasInvalidChars;
    } catch {
      return false;
    }
  }

  /**
   * Validates consistent field naming (camelCase)
   */
  private validateFieldNaming(data: any): boolean {
    const checkNaming = (obj: any): boolean => {
      if (typeof obj !== 'object' || obj === null) return true;
      
      if (Array.isArray(obj)) {
        return obj.every(item => checkNaming(item));
      }

      for (const key of Object.keys(obj)) {
        // Check if key follows camelCase convention
        if (!/^[a-z][a-zA-Z0-9]*$/.test(key)) {
          return false;
        }
        
        // Recursively check nested objects
        if (!checkNaming(obj[key])) {
          return false;
        }
      }
      
      return true;
    };

    return checkNaming(data);
  }
}

/**
 * Schema-based validation for existing field structures
 */
export class SchemaBasedValidator {
  
  /**
   * Creates a schema for legacy topic structure (without new fields)
   */
  static createLegacyTopicSchema() {
    return z.object({
      id: z.string(),
      slug: z.string(),
      title: z.string(),
      locale: z.string(),
      tags: z.array(z.string()),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
    });
  }

  /**
   * Creates a schema for legacy article structure (without new fields)
   */
  static createLegacyArticleSchema() {
    return z.object({
      id: z.string(),
      topicId: z.string(),
      content: z.string(),
      status: z.enum(['DRAFT', 'PUBLISHED']),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
    });
  }

  /**
   * Creates a schema for legacy pagination structure
   */
  static createLegacyPaginationSchema() {
    return z.object({
      total: z.number().int().min(0),
      page: z.number().int().min(1),
      limit: z.number().int().min(1),
      totalPages: z.number().int().min(0),
    });
  }

  /**
   * Validates that current response can be parsed by legacy schema
   */
  static validateLegacyCompatibility(data: any, schemaType: 'topic' | 'article' | 'pagination'): {
    compatible: boolean;
    errors: string[];
  } {
    let schema: z.ZodSchema;
    
    switch (schemaType) {
      case 'topic':
        schema = this.createLegacyTopicSchema();
        break;
      case 'article':
        schema = this.createLegacyArticleSchema();
        break;
      case 'pagination':
        schema = this.createLegacyPaginationSchema();
        break;
      default:
        throw new Error(`Unknown schema type: ${schemaType}`);
    }

    const result = schema.safeParse(data);
    
    if (result.success) {
      return { compatible: true, errors: [] };
    } else {
      const errors = result.error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      );
      return { compatible: false, errors };
    }
  }
}