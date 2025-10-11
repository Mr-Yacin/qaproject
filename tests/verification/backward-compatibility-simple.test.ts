/**
 * Simple Backward Compatibility Validation Tests
 * 
 * Basic tests to verify core backward compatibility functionality
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { ResponseFormatValidator } from './utils/response-format-validator';

describe('Simple Backward Compatibility Validation', () => {
  let validator: ResponseFormatValidator;
  let apiBaseUrl: string;

  beforeAll(() => {
    validator = new ResponseFormatValidator();
    apiBaseUrl = process.env.API_BASE_URL || process.env.VERIFICATION_API_BASE_URL || 'http://localhost:3000';
  });

  describe('Core API Functionality', () => {
    it('should return valid topics list with proper structure', async () => {
      const response = await fetch(`${apiBaseUrl}/api/topics?limit=5`);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      
      // Basic structure validation
      expect(data).toHaveProperty('items');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('page');
      expect(data).toHaveProperty('limit');
      expect(data).toHaveProperty('totalPages');
      
      expect(Array.isArray(data.items)).toBe(true);
      expect(typeof data.total).toBe('number');
      expect(typeof data.page).toBe('number');
      expect(typeof data.limit).toBe('number');
      expect(typeof data.totalPages).toBe('number');
    });

    it('should maintain existing field types in topic responses', async () => {
      const response = await fetch(`${apiBaseUrl}/api/topics?limit=1`);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      
      if (data.items.length > 0) {
        const topic = data.items[0].topic;
        
        // Validate core legacy fields
        expect(typeof topic.id).toBe('string');
        expect(typeof topic.slug).toBe('string');
        expect(typeof topic.title).toBe('string');
        expect(typeof topic.locale).toBe('string');
        expect(Array.isArray(topic.tags)).toBe(true);
        expect(typeof topic.createdAt).toBe('string');
        expect(typeof topic.updatedAt).toBe('string');
      }
    });

    it('should handle new SEO fields as optional', async () => {
      const response = await fetch(`${apiBaseUrl}/api/topics?limit=5`);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      
      for (const item of data.items) {
        const topic = item.topic;
        
        // New fields should be present but can be null
        if ('seoTitle' in topic) {
          expect(topic.seoTitle === null || typeof topic.seoTitle === 'string').toBe(true);
        }
        
        if ('seoDescription' in topic) {
          expect(topic.seoDescription === null || typeof topic.seoDescription === 'string').toBe(true);
        }
        
        if ('seoKeywords' in topic) {
          expect(Array.isArray(topic.seoKeywords)).toBe(true);
        }
        
        if ('thumbnailUrl' in topic) {
          expect(topic.thumbnailUrl === null || typeof topic.thumbnailUrl === 'string').toBe(true);
        }
      }
    });
  });

  describe('Response Format Consistency', () => {
    it('should return valid JSON for all endpoints', async () => {
      const endpoints = [
        '/api/topics',
        '/api/topics?page=1&limit=5',
        '/api/topics?locale=en',
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(`${apiBaseUrl}${endpoint}`);
        expect(response.ok).toBe(true);
        
        const text = await response.text();
        
        // Should be valid JSON
        expect(() => JSON.parse(text)).not.toThrow();
        
        const data = JSON.parse(text);
        expect(typeof data).toBe('object');
        expect(data).not.toBeNull();
      }
    });

    it('should maintain consistent field naming (camelCase)', async () => {
      const response = await fetch(`${apiBaseUrl}/api/topics?limit=1`);
      const data = await response.json();
      
      const checkCamelCase = (obj: any): boolean => {
        if (typeof obj !== 'object' || obj === null) return true;
        
        if (Array.isArray(obj)) {
          return obj.every(item => checkCamelCase(item));
        }
        
        for (const key of Object.keys(obj)) {
          // Check if key follows camelCase
          if (!/^[a-z][a-zA-Z0-9]*$/.test(key)) {
            return false;
          }
          
          if (!checkCamelCase(obj[key])) {
            return false;
          }
        }
        
        return true;
      };
      
      expect(checkCamelCase(data)).toBe(true);
    });
  });

  describe('Legacy Parameter Support', () => {
    it('should accept various parameter formats', async () => {
      const parameterTests = [
        { page: '1', limit: '5' },
        { page: 1, limit: 5 },
        { locale: 'en' },
        { tags: 'javascript' },
      ];

      for (const params of parameterTests) {
        const url = new URL('/api/topics', apiBaseUrl);
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.set(key, String(value));
        });

        const response = await fetch(url.toString());
        expect(response.ok).toBe(true);
        
        const data = await response.json();
        expect(data).toHaveProperty('items');
        expect(Array.isArray(data.items)).toBe(true);
      }
    });
  });
});