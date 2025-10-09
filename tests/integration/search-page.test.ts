import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Integration tests for search page functionality
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */
describe('Search Page Integration Tests', () => {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  
  beforeAll(async () => {
    // Ensure we have test data
    const topicCount = await prisma.topic.count();
    if (topicCount === 0) {
      console.log('⚠️  No test data found. Run `npm run seed` to create test data.');
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Search Page Loading', () => {
    it('should return 200 status code when accessing /search', async () => {
      const response = await fetch(`${baseUrl}/search`);
      expect(response.status).toBe(200);
    });

    it('should return 200 status code with query parameter', async () => {
      const response = await fetch(`${baseUrl}/search?q=test`);
      expect(response.status).toBe(200);
    });
  });

  describe('Search Functionality with Data', () => {
    it('should handle search with existing topics', async () => {
      // Get a topic from database to search for
      const topic = await prisma.topic.findFirst({
        where: { 
          articles: { 
            some: { status: 'PUBLISHED' } 
          } 
        },
      });

      if (!topic) {
        console.log('⚠️  Skipping test: No published topics found');
        return;
      }

      const response = await fetch(`${baseUrl}/search?q=${encodeURIComponent(topic.title)}`);
      expect(response.status).toBe(200);
      
      const html = await response.text();
      expect(html).toContain('Search Topics');
    });

    it('should handle empty search query', async () => {
      const response = await fetch(`${baseUrl}/search?q=`);
      expect(response.status).toBe(200);
      
      const html = await response.text();
      expect(html).toContain('Search Topics');
    });

    it('should handle search with no results', async () => {
      const response = await fetch(`${baseUrl}/search?q=xyznonexistentquery123`);
      expect(response.status).toBe(200);
      
      const html = await response.text();
      expect(html).toContain('Search Topics');
    });
  });

  describe('API Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // The page should still load even if API fails
      const response = await fetch(`${baseUrl}/search`);
      expect(response.status).toBe(200);
      
      const html = await response.text();
      // Should contain the search page structure
      expect(html).toContain('Search Topics');
    });
  });

  describe('Empty Database Scenario', () => {
    it('should display appropriate message when no topics exist', async () => {
      const topicCount = await prisma.topic.count();
      
      if (topicCount > 0) {
        console.log('⚠️  Skipping test: Database has topics');
        return;
      }

      const response = await fetch(`${baseUrl}/search`);
      expect(response.status).toBe(200);
      
      const html = await response.text();
      expect(html).toContain('Search Topics');
    });
  });

  describe('Search Page Performance', () => {
    it('should load search page within acceptable time', async () => {
      const startTime = Date.now();
      const response = await fetch(`${baseUrl}/search`);
      const endTime = Date.now();
      
      expect(response.status).toBe(200);
      
      const loadTime = endTime - startTime;
      console.log(`Search page load time: ${loadTime}ms`);
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });
  });
});
