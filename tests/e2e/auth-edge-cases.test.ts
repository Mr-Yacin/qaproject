/**
 * Authentication Edge Cases E2E Tests
 * 
 * Tests all authentication edge cases including:
 * - Access /admin while logged out - verify redirect to login
 * - Access /admin/login while logged in - verify redirect to dashboard
 * - Let session expire on a page - verify redirect to login
 * - Login and verify callbackUrl works correctly
 * - Logout from any page - verify redirect to login without sidebar
 * 
 * Requirements: 3.4, 3.7, 3.8
 */

import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

// Test user credentials (should match seed data)
const TEST_USER = {
  email: 'admin@example.com',
  password: 'admin123'
};

test.describe('Authentication Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we start with a clean state
    await page.context().clearCookies();
    await page.goto('/');
  });

  test('should redirect to login when accessing /admin while logged out', async ({ page }) => {
    console.log('Testing: Access /admin while logged out');
    
    // Navigate to admin dashboard without being logged in
    await page.goto('/admin');
    
    // Should be redirected to login page
    await expect(page).toHaveURL(/\/admin\/login/);
    
    // Should have callbackUrl parameter
    const url = new URL(page.url());
    expect(url.searchParams.get('callbackUrl')).toBe('/admin');
    
    // Should see login form, not sidebar
    await expect(page.locator('h1')).toContainText('Admin Login');
    await expect(page.locator('[data-testid="admin-sidebar"]')).not.toBeVisible();
    
    // Should see login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    console.log('✓ Correctly redirected to login with callbackUrl');
  });

  test('should redirect to dashboard when accessing /admin/login while logged in', async ({ page }) => {
    console.log('Testing: Access /admin/login while logged in');
    
    // First, log in
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to admin dashboard
    await expect(page).toHaveURL('/admin');
    await expect(page.locator('[data-testid="admin-sidebar"]')).toBeVisible();
    
    // Now try to access login page while logged in
    await page.goto('/admin/login');
    
    // Should be redirected back to admin dashboard
    await expect(page).toHaveURL('/admin');
    await expect(page.locator('[data-testid="admin-sidebar"]')).toBeVisible();
    
    // Should not see login form
    await expect(page.locator('h1:has-text("Admin Login")')).not.toBeVisible();
    
    console.log('✓ Correctly redirected to dashboard when already logged in');
  });

  test('should handle session expiration and redirect to login', async ({ page }) => {
    console.log('Testing: Session expiration handling');
    
    // Log in first
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Wait for successful login
    await expect(page).toHaveURL('/admin');
    await expect(page.locator('[data-testid="admin-sidebar"]')).toBeVisible();
    
    // Navigate to a different admin page
    await page.goto('/admin/topics');
    await expect(page).toHaveURL('/admin/topics');
    
    // Simulate session expiration by clearing cookies
    await page.context().clearCookies();
    
    // Try to navigate to another admin page
    await page.goto('/admin/settings');
    
    // Should be redirected to login
    await expect(page).toHaveURL(/\/admin\/login/);
    
    // Should have callbackUrl for the attempted page
    const url = new URL(page.url());
    expect(url.searchParams.get('callbackUrl')).toBe('/admin/settings');
    
    // Should not see sidebar
    await expect(page.locator('[data-testid="admin-sidebar"]')).not.toBeVisible();
    
    console.log('✓ Correctly handled session expiration');
  });

  test('should respect callbackUrl after successful login', async ({ page }) => {
    console.log('Testing: CallbackUrl functionality');
    
    // Try to access a specific admin page while logged out
    const targetPage = '/admin/topics';
    await page.goto(targetPage);
    
    // Should be redirected to login with callbackUrl
    await expect(page).toHaveURL(/\/admin\/login/);
    const loginUrl = new URL(page.url());
    expect(loginUrl.searchParams.get('callbackUrl')).toBe(targetPage);
    
    // Log in
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Should be redirected to the original target page
    await expect(page).toHaveURL(targetPage);
    await expect(page.locator('[data-testid="admin-sidebar"]')).toBeVisible();
    
    console.log('✓ CallbackUrl worked correctly after login');
  });

  test('should redirect to login without sidebar after logout', async ({ page }) => {
    console.log('Testing: Logout functionality');
    
    // Log in first
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Wait for successful login
    await expect(page).toHaveURL('/admin');
    await expect(page.locator('[data-testid="admin-sidebar"]')).toBeVisible();
    
    // Navigate to a different admin page to test logout from any page
    await page.goto('/admin/settings');
    await expect(page).toHaveURL('/admin/settings');
    await expect(page.locator('[data-testid="admin-sidebar"]')).toBeVisible();
    
    // Find and click logout button (usually in user menu)
    const userMenuButton = page.locator('[data-testid="user-menu-button"]');
    if (await userMenuButton.isVisible()) {
      await userMenuButton.click();
      await page.locator('[data-testid="logout-button"]').click();
    } else {
      // Alternative: look for direct logout button
      await page.locator('button:has-text("Logout"), button:has-text("Sign Out")').click();
    }
    
    // Should be redirected to login page
    await expect(page).toHaveURL(/\/admin\/login/);
    
    // Should not see sidebar
    await expect(page.locator('[data-testid="admin-sidebar"]')).not.toBeVisible();
    
    // Should see login form
    await expect(page.locator('h1')).toContainText('Admin Login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    console.log('✓ Logout worked correctly from any page');
  });

  test('should handle multiple rapid authentication attempts', async ({ page }) => {
    console.log('Testing: Multiple rapid authentication attempts');
    
    await page.goto('/admin/login');
    
    // Try multiple failed login attempts rapidly
    for (let i = 0; i < 3; i++) {
      await page.fill('input[type="email"]', 'wrong@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      // Wait for error message
      await expect(page.locator('[role="alert"]')).toBeVisible();
      
      // Clear form for next attempt
      await page.fill('input[type="email"]', '');
      await page.fill('input[type="password"]', '');
    }
    
    // Now try with correct credentials
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Should still be able to login (rate limiting shouldn't block valid attempts)
    await expect(page).toHaveURL('/admin');
    
    console.log('✓ Authentication rate limiting works correctly');
  });

  test('should maintain authentication state across browser refresh', async ({ page }) => {
    console.log('Testing: Authentication persistence across refresh');
    
    // Log in
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Wait for successful login
    await expect(page).toHaveURL('/admin');
    await expect(page.locator('[data-testid="admin-sidebar"]')).toBeVisible();
    
    // Navigate to a specific page
    await page.goto('/admin/topics');
    await expect(page).toHaveURL('/admin/topics');
    
    // Refresh the page
    await page.reload();
    
    // Should still be authenticated and on the same page
    await expect(page).toHaveURL('/admin/topics');
    await expect(page.locator('[data-testid="admin-sidebar"]')).toBeVisible();
    
    console.log('✓ Authentication persisted across browser refresh');
  });

  test('should handle direct URL access to protected pages', async ({ page }) => {
    console.log('Testing: Direct URL access to protected pages');
    
    const protectedPages = [
      '/admin',
      '/admin/topics',
      '/admin/topics/new',
      '/admin/settings',
      '/admin/pages',
      '/admin/media',
      '/admin/users'
    ];
    
    for (const protectedPage of protectedPages) {
      // Clear any existing session
      await page.context().clearCookies();
      
      // Try to access protected page directly
      await page.goto(protectedPage);
      
      // Should be redirected to login
      await expect(page).toHaveURL(/\/admin\/login/);
      
      // Should have correct callbackUrl
      const url = new URL(page.url());
      expect(url.searchParams.get('callbackUrl')).toBe(protectedPage);
      
      console.log(`✓ ${protectedPage} correctly protected`);
    }
  });
});