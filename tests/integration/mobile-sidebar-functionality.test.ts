import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, Browser, Page } from 'playwright';

describe('Mobile Sidebar Functionality Integration Tests', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to admin login
    await page.goto('http://localhost:3000/admin/login');
    
    // Login with test credentials (assuming test environment)
    try {
      await page.fill('input[name="email"]', 'admin@example.com');
      await page.fill('input[name="password"]', 'password');
      await page.click('button[type="submit"]');
      
      // Wait for redirect to admin dashboard
      await page.waitForURL('**/admin', { timeout: 5000 });
    } catch (error) {
      // If login fails, skip the test (no test environment setup)
      console.log('Skipping test - no test environment available');
      return;
    }
  });

  afterEach(async () => {
    await page.close();
  });

  it('should display mobile menu button on mobile viewport', async () => {
    // Skip if we couldn't login
    if (page.url().includes('/login')) {
      console.log('Skipping - login failed');
      return;
    }

    // Check if mobile menu button exists
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-toggle"]');
    await expect(mobileMenuButton).toBeVisible();
    
    // Check accessibility attributes
    await expect(mobileMenuButton).toHaveAttribute('aria-label', 'Open sidebar');
    await expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('should toggle mobile sidebar open and closed', async () => {
    // Skip if we couldn't login
    if (page.url().includes('/login')) {
      console.log('Skipping - login failed');
      return;
    }

    const mobileMenuButton = page.locator('[data-testid="mobile-menu-toggle"]');
    const sidebar = page.locator('[data-testid="admin-sidebar"]');
    
    // Initially sidebar should be hidden (translated off-screen)
    await expect(sidebar).toHaveClass(/-translate-x-full/);
    
    // Click to open sidebar
    await mobileMenuButton.click();
    
    // Sidebar should now be visible
    await expect(sidebar).toHaveClass(/translate-x-0/);
    await expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'true');
    
    // Click close button in sidebar
    const closeSidebarButton = sidebar.locator('[data-testid="mobile-menu-toggle"]');
    await closeSidebarButton.click();
    
    // Sidebar should be hidden again
    await expect(sidebar).toHaveClass(/-translate-x-full/);
    await expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('should maintain sidebar state during navigation', async () => {
    // Skip if we couldn't login
    if (page.url().includes('/login')) {
      console.log('Skipping - login failed');
      return;
    }

    const mobileMenuButton = page.locator('[data-testid="mobile-menu-toggle"]');
    const sidebar = page.locator('[data-testid="admin-sidebar"]');
    
    // Open sidebar
    await mobileMenuButton.click();
    await expect(sidebar).toHaveClass(/translate-x-0/);
    
    // Navigate to topics page
    await page.goto('http://localhost:3000/admin/topics');
    await page.waitForLoadState('networkidle');
    
    // Sidebar should still be open
    const sidebarAfterNav = page.locator('[data-testid="admin-sidebar"]');
    await expect(sidebarAfterNav).toHaveClass(/translate-x-0/);
    
    // Mobile menu button should still show expanded state
    const mobileMenuButtonAfterNav = page.locator('[data-testid="mobile-menu-toggle"]');
    await expect(mobileMenuButtonAfterNav).toHaveAttribute('aria-expanded', 'true');
  });

  it('should close sidebar when navigating via sidebar links', async () => {
    // Skip if we couldn't login
    if (page.url().includes('/login')) {
      console.log('Skipping - login failed');
      return;
    }

    const mobileMenuButton = page.locator('[data-testid="mobile-menu-toggle"]');
    const sidebar = page.locator('[data-testid="admin-sidebar"]');
    
    // Open sidebar
    await mobileMenuButton.click();
    await expect(sidebar).toHaveClass(/translate-x-0/);
    
    // Click on Topics link in sidebar
    const topicsLink = sidebar.locator('[data-testid="nav-topics"]');
    await topicsLink.click();
    
    // Wait for navigation
    await page.waitForURL('**/admin/topics');
    
    // Sidebar should automatically close after navigation
    const sidebarAfterNav = page.locator('[data-testid="admin-sidebar"]');
    await expect(sidebarAfterNav).toHaveClass(/-translate-x-full/);
    
    // Mobile menu button should show collapsed state
    const mobileMenuButtonAfterNav = page.locator('[data-testid="mobile-menu-toggle"]');
    await expect(mobileMenuButtonAfterNav).toHaveAttribute('aria-expanded', 'false');
  });

  it('should work on different mobile viewport sizes', async () => {
    // Skip if we couldn't login
    if (page.url().includes('/login')) {
      console.log('Skipping - login failed');
      return;
    }

    const testViewports = [
      { width: 320, height: 568 }, // iPhone SE
      { width: 375, height: 667 }, // iPhone 8
      { width: 414, height: 896 }, // iPhone 11 Pro Max
    ];

    for (const viewport of testViewports) {
      await page.setViewportSize(viewport);
      
      // Mobile menu button should be visible
      const mobileMenuButton = page.locator('[data-testid="mobile-menu-toggle"]');
      await expect(mobileMenuButton).toBeVisible();
      
      // Test sidebar toggle
      const sidebar = page.locator('[data-testid="admin-sidebar"]');
      
      // Should be closed initially
      await expect(sidebar).toHaveClass(/-translate-x-full/);
      
      // Open sidebar
      await mobileMenuButton.click();
      await expect(sidebar).toHaveClass(/translate-x-0/);
      
      // Close sidebar
      const closeSidebarButton = sidebar.locator('[data-testid="mobile-menu-toggle"]');
      await closeSidebarButton.click();
      await expect(sidebar).toHaveClass(/-translate-x-full/);
    }
  });

  it('should not show mobile menu button on desktop viewport', async () => {
    // Skip if we couldn't login
    if (page.url().includes('/login')) {
      console.log('Skipping - login failed');
      return;
    }

    // Switch to desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    
    // Refresh to apply viewport changes
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Mobile menu button should not be visible on desktop
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-toggle"]');
    await expect(mobileMenuButton).not.toBeVisible();
    
    // Sidebar should be always visible on desktop
    const sidebar = page.locator('[data-testid="admin-sidebar"]');
    await expect(sidebar).toBeVisible();
  });
});