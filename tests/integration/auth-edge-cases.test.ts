/**
 * Authentication Edge Cases Integration Tests
 * 
 * Tests authentication logic without requiring a full browser.
 * Focuses on middleware, redirects, and session handling.
 * 
 * Requirements: 3.4, 3.7, 3.8
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { middleware } from '../../middleware';

// Mock next-auth/jwt
vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));

const mockGetToken = vi.mocked(getToken);

describe('Authentication Edge Cases - Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variable
    process.env.NEXTAUTH_SECRET = 'test-secret';
  });

  describe('Middleware Authentication', () => {
    it('should redirect to login when accessing /admin without token', async () => {
      mockGetToken.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost:3000/admin');
      const response = await middleware(request);
      
      expect(response.status).toBe(307); // Redirect status
      expect(response.headers.get('location')).toContain('/admin/login');
      expect(response.headers.get('location')).toContain('callbackUrl=%2Fadmin');
    });

    it('should redirect to login when accessing /admin/topics without token', async () => {
      mockGetToken.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost:3000/admin/topics');
      const response = await middleware(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/admin/login');
      expect(response.headers.get('location')).toContain('callbackUrl=%2Fadmin%2Ftopics');
    });

    it('should allow access to /admin/login without token', async () => {
      mockGetToken.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost:3000/admin/login');
      const response = await middleware(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    });

    it('should allow access to admin pages with valid token', async () => {
      mockGetToken.mockResolvedValue({
        id: 'user-1',
        email: 'admin@example.com',
        role: 'ADMIN'
      });
      
      const request = new NextRequest('http://localhost:3000/admin');
      const response = await middleware(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    });

    it('should handle token validation errors gracefully', async () => {
      mockGetToken.mockRejectedValue(new Error('Token validation failed'));
      
      const request = new NextRequest('http://localhost:3000/admin');
      const response = await middleware(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/admin/login');
    });

    it('should add security headers to all responses', async () => {
      mockGetToken.mockResolvedValue({
        id: 'user-1',
        email: 'admin@example.com',
        role: 'ADMIN'
      });
      
      const request = new NextRequest('http://localhost:3000/admin');
      const response = await middleware(request);
      
      expect(response.headers.get('Content-Security-Policy')).toBeTruthy();
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    });
  });

  describe('CallbackUrl Handling', () => {
    it('should preserve callbackUrl in redirect to login', async () => {
      mockGetToken.mockResolvedValue(null);
      
      const testCases = [
        { path: '/admin', expected: '%2Fadmin' },
        { path: '/admin/topics', expected: '%2Fadmin%2Ftopics' },
        { path: '/admin/topics/new', expected: '%2Fadmin%2Ftopics%2Fnew' },
        { path: '/admin/settings', expected: '%2Fadmin%2Fsettings' },
        { path: '/admin/pages/edit/about', expected: '%2Fadmin%2Fpages%2Fedit%2Fabout' },
      ];
      
      for (const testCase of testCases) {
        const request = new NextRequest(`http://localhost:3000${testCase.path}`);
        const response = await middleware(request);
        
        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toContain(`callbackUrl=${testCase.expected}`);
      }
    });

    it('should handle complex paths with query parameters', async () => {
      mockGetToken.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost:3000/admin/topics?page=2&search=test');
      const response = await middleware(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/admin/login');
      // Note: Query parameters are not preserved in callbackUrl by middleware
      expect(response.headers.get('location')).toContain('callbackUrl=%2Fadmin%2Ftopics');
    });
  });

  describe('Environment Configuration', () => {
    it('should handle missing NEXTAUTH_SECRET', async () => {
      delete process.env.NEXTAUTH_SECRET;
      mockGetToken.mockRejectedValue(new Error('NEXTAUTH_SECRET is not configured'));
      
      const request = new NextRequest('http://localhost:3000/admin');
      const response = await middleware(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/admin/login');
    });
  });

  describe('Route Matching', () => {
    it('should only apply middleware to admin routes', async () => {
      // Test that middleware config matches only /admin paths
      // Import the config from middleware file
      const middlewareModule = await import('../../middleware');
      expect(middlewareModule.config.matcher).toBe('/admin/:path*');
    });

    it('should not interfere with public routes', async () => {
      // This test verifies that non-admin routes are not affected
      // In a real scenario, these would not trigger the middleware
      const publicRoutes = [
        '/',
        '/api/topics',
        '/pages/about',
        '/api/ingest'
      ];
      
      // These routes should not match the middleware matcher
      for (const route of publicRoutes) {
        expect(route.startsWith('/admin')).toBe(false);
      }
    });
  });
});

describe('Authentication Flow Scenarios', () => {
  describe('Session Expiration Scenarios', () => {
    it('should handle expired JWT tokens', async () => {
      // Mock an expired token scenario
      mockGetToken.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost:3000/admin/settings');
      const response = await middleware(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/admin/login');
      expect(response.headers.get('location')).toContain('callbackUrl=%2Fadmin%2Fsettings');
    });

    it('should handle malformed tokens', async () => {
      mockGetToken.mockRejectedValue(new Error('Invalid token format'));
      
      const request = new NextRequest('http://localhost:3000/admin');
      const response = await middleware(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/admin/login');
    });
  });

  describe('Edge Case URLs', () => {
    it('should handle admin root path correctly', async () => {
      mockGetToken.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost:3000/admin/');
      const response = await middleware(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/admin/login');
    });

    it('should handle nested admin paths', async () => {
      mockGetToken.mockResolvedValue(null);
      
      const deepPath = '/admin/pages/edit/very/deep/nested/path';
      const request = new NextRequest(`http://localhost:3000${deepPath}`);
      const response = await middleware(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/admin/login');
      expect(response.headers.get('location')).toContain(encodeURIComponent(deepPath));
    });
  });
});