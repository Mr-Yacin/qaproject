/**
 * End-to-End Tests for Public Pages
 * Tests homepage, topics listing, topic detail pages, SEO, and search functionality
 * Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 9.1, 9.2
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

describe('Public Pages E2E Tests', () => {
  let testTopicSlug: string;

  beforeAll(async () => {
    // Create test data
    const topic = await prisma.topic.create({
      data: {
        slug: 'e2e-test-topic',
        title: 'E2E Test Topic',
        locale: 'en',
        tags: ['test', 'e2e'],
      },
    });
    testTopicSlug = topic.slug;

    const question = await prisma.question.create({
      data: {
        topicId: topic.id,
        text: 'What is E2E testing?',
        isPrimary: true,
      },
    });

    await prisma.article.create({
      data: {
        topicId: topic.id,
        content: '<h2>Understanding E2E Testing</h2><p>End-to-end testing is a comprehensive testing methodology.</p>',
        status: 'PUBLISHED',
      },
    });

    await prisma.fAQItem.create({
      data: {
        topicId: topic.id,
        question: 'Why is E2E testing important?',
        answer: 'E2E testing validates the entire application flow.',
        order: 0,
      },
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.fAQItem.deleteMany({ where: { topic: { slug: testTopicSlug } } });
    await prisma.article.deleteMany({ where: { topic: { slug: testTopicSlug } } });
    await prisma.question.deleteMany({ where: { topic: { slug: testTopicSlug } } });
    await prisma.topic.deleteMany({ where: { slug: testTopicSlug } });
    await prisma.$disconnect();
  });

  describe('Homepage Tests (Requirement 1.1)', () => {
    it('should load homepage successfully', async () => {
      const response = await fetch(`${BASE_URL}/`);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');
    });

    it('should display featured topics on homepage', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      // Check for topic cards or featured content
      expect(html).toContain('topic');
      expect(html).toContain('Topics');
    });

    it('should include search functionality on homepage', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      // Check for search input
      expect(html).toMatch(/search|Search/i);
    });

    it('should be responsive with proper viewport meta tag', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      expect(html).toContain('viewport');
      expect(html).toContain('width=device-width');
    });
  });

  describe('Topics Listing Page Tests (Requirement 1.2)', () => {
    it('should load topics listing page successfully', async () => {
      const response = await fetch(`${BASE_URL}/topics`);
      expect(response.status).toBe(200);
    });

    it('should display list of topics', async () => {
      const response = await fetch(`${BASE_URL}/topics`);
      const html = await response.text();
      
      // Should contain our test topic
      expect(html).toContain('E2E Test Topic');
    });

    it('should support filtering by tags', async () => {
      const response = await fetch(`${BASE_URL}/topics?tag=test`);
      expect(response.status).toBe(200);
      const html = await response.text();
      
      // Should show filtered results
      expect(html).toContain('test');
    });

    it('should support filtering by locale', async () => {
      const response = await fetch(`${BASE_URL}/topics?locale=en`);
      expect(response.status).toBe(200);
    });
  });

  describe('Topic Detail Page Tests (Requirement 1.3)', () => {
    it('should load topic detail page successfully', async () => {
      const response = await fetch(`${BASE_URL}/topics/${testTopicSlug}`);
      expect(response.status).toBe(200);
    });

    it('should display topic title and main question', async () => {
      const response = await fetch(`${BASE_URL}/topics/${testTopicSlug}`);
      const html = await response.text();
      
      expect(html).toContain('E2E Test Topic');
      expect(html).toContain('What is E2E testing?');
    });

    it('should display article content', async () => {
      const response = await fetch(`${BASE_URL}/topics/${testTopicSlug}`);
      const html = await response.text();
      
      expect(html).toContain('Understanding E2E Testing');
      expect(html).toContain('End-to-end testing is a comprehensive testing methodology');
    });

    it('should display FAQ items', async () => {
      const response = await fetch(`${BASE_URL}/topics/${testTopicSlug}`);
      const html = await response.text();
      
      expect(html).toContain('Why is E2E testing important?');
      expect(html).toContain('E2E testing validates the entire application flow');
    });

    it('should return 404 for non-existent topic', async () => {
      const response = await fetch(`${BASE_URL}/topics/non-existent-slug`);
      expect(response.status).toBe(404);
    });
  });

  describe('SEO Meta Tags Tests (Requirements 2.1, 2.4, 2.5, 2.6)', () => {
    it('should include proper title tag', async () => {
      const response = await fetch(`${BASE_URL}/topics/${testTopicSlug}`);
      const html = await response.text();
      
      expect(html).toMatch(/<title>.*E2E Test Topic.*<\/title>/);
    });

    it('should include meta description', async () => {
      const response = await fetch(`${BASE_URL}/topics/${testTopicSlug}`);
      const html = await response.text();
      
      expect(html).toContain('name="description"');
      expect(html).toContain('content=');
    });

    it('should include Open Graph tags', async () => {
      const response = await fetch(`${BASE_URL}/topics/${testTopicSlug}`);
      const html = await response.text();
      
      expect(html).toContain('property="og:title"');
      expect(html).toContain('property="og:description"');
      expect(html).toContain('property="og:type"');
      expect(html).toContain('property="og:url"');
    });

    it('should include Twitter Card tags', async () => {
      const response = await fetch(`${BASE_URL}/topics/${testTopicSlug}`);
      const html = await response.text();
      
      expect(html).toContain('name="twitter:card"');
      expect(html).toContain('name="twitter:title"');
      expect(html).toContain('name="twitter:description"');
    });

    it('should include canonical URL', async () => {
      const response = await fetch(`${BASE_URL}/topics/${testTopicSlug}`);
      const html = await response.text();
      
      expect(html).toContain('rel="canonical"');
      expect(html).toContain(`href="${BASE_URL}/topics/${testTopicSlug}"`);
    });
  });

  describe('Structured Data Tests (Requirement 2.3)', () => {
    it('should include Article schema JSON-LD', async () => {
      const response = await fetch(`${BASE_URL}/topics/${testTopicSlug}`);
      const html = await response.text();
      
      expect(html).toContain('application/ld+json');
      expect(html).toContain('"@type":"Article"');
      expect(html).toContain('E2E Test Topic');
    });

    it('should include FAQ schema JSON-LD', async () => {
      const response = await fetch(`${BASE_URL}/topics/${testTopicSlug}`);
      const html = await response.text();
      
      expect(html).toContain('"@type":"FAQPage"');
      expect(html).toContain('"@type":"Question"');
      expect(html).toContain('Why is E2E testing important?');
    });

    it('should have valid JSON-LD structure', async () => {
      const response = await fetch(`${BASE_URL}/topics/${testTopicSlug}`);
      const html = await response.text();
      
      // Extract JSON-LD scripts
      const jsonLdMatches = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/gs);
      expect(jsonLdMatches).toBeTruthy();
      
      if (jsonLdMatches) {
        jsonLdMatches.forEach(match => {
          const jsonContent = match.replace(/<script type="application\/ld\+json">|<\/script>/g, '');
          expect(() => JSON.parse(jsonContent)).not.toThrow();
        });
      }
    });
  });

  describe('Search Functionality Tests (Requirements 9.1, 9.2)', () => {
    it('should load search page', async () => {
      const response = await fetch(`${BASE_URL}/search`);
      expect(response.status).toBe(200);
    });

    it('should return search results for valid query', async () => {
      const response = await fetch(`${BASE_URL}/search?q=E2E`);
      expect(response.status).toBe(200);
      const html = await response.text();
      
      expect(html).toContain('E2E Test Topic');
    });

    it('should handle empty search query', async () => {
      const response = await fetch(`${BASE_URL}/search?q=`);
      expect(response.status).toBe(200);
    });

    it('should handle search with no results', async () => {
      const response = await fetch(`${BASE_URL}/search?q=nonexistentquery12345`);
      expect(response.status).toBe(200);
      const html = await response.text();
      
      expect(html).toMatch(/no results|not found/i);
    });
  });

  describe('Sitemap and Robots Tests (Requirements 2.7, 2.8)', () => {
    it('should serve sitemap.xml', async () => {
      const response = await fetch(`${BASE_URL}/sitemap.xml`);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('xml');
    });

    it('should include topics in sitemap', async () => {
      const response = await fetch(`${BASE_URL}/sitemap.xml`);
      const xml = await response.text();
      
      expect(xml).toContain('<urlset');
      expect(xml).toContain('<url>');
      expect(xml).toContain('<loc>');
    });

    it('should serve robots.txt', async () => {
      const response = await fetch(`${BASE_URL}/robots.txt`);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/plain');
    });

    it('should have proper robots.txt directives', async () => {
      const response = await fetch(`${BASE_URL}/robots.txt`);
      const text = await response.text();
      
      expect(text).toContain('User-agent:');
      expect(text).toContain('Sitemap:');
    });
  });

  describe('Responsive Design Tests (Requirements 1.4, 1.5, 1.6)', () => {
    it('should include responsive meta viewport', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      expect(html).toContain('name="viewport"');
      expect(html).toContain('width=device-width');
      expect(html).toContain('initial-scale=1');
    });

    it('should load CSS for responsive design', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      // Check for Tailwind or responsive CSS classes
      expect(html).toMatch(/class="[^"]*(?:md:|lg:|sm:)/);
    });
  });

  describe('Navigation and Accessibility Tests', () => {
    it('should include header navigation', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      expect(html).toMatch(/<header|<nav/i);
    });

    it('should include footer', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      expect(html).toMatch(/<footer/i);
    });

    it('should have proper semantic HTML', async () => {
      const response = await fetch(`${BASE_URL}/topics/${testTopicSlug}`);
      const html = await response.text();
      
      expect(html).toContain('<main');
      expect(html).toContain('<article');
    });

    it('should include ARIA labels for accessibility', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      expect(html).toMatch(/aria-label|role=/);
    });
  });
});
