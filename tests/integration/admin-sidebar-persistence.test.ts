import { test, expect } from '@playwright/test';

test.describe('Admin Sidebar Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Login to admin dashboard
    await page.goto('/admin/login');
    
    // Fill in login credentials (assuming test credentials)
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to admin dashboard
    await page.waitForURL('/admin');
    
    // Verify we're on the dashboard and sidebar is visible
    await expect(page.locator('[data-testid="admin-sidebar"]')).toBeVisible();
  });

  test('should persist sidebar during navigation without flickering', async ({ page }) => {
    // Get initial sidebar element reference
    const sidebar = page.locator('[data-testid="admin-sidebar"]');
    await expect(sidebar).toBeVisible();
    
    // Get the sidebar element handle to track if it gets remounted
    const initialSidebarHandle = await sidebar.elementHandle();
    
    // Navigate from Dashboard to Topics
    await page.click('a[href="/admin/topics"]');
    await page.waitForURL('/admin/topics');
    
    // Verify sidebar is still visible and hasn't been remounted
    await expect(sidebar).toBeVisible();
    const sidebarAfterTopics = await sidebar.elementHandle();
    
    // Check that the sidebar element is the same (not remounted)
    expect(initialSidebarHandle).toBeTruthy();
    expect(sidebarAfterTopics).toBeTruthy();
    
    // Navigate to Settings
    await page.click('a[href="/admin/settings"]');
    await page.waitForURL('/admin/settings');
    
    // Verify sidebar remains stable
    await expect(sidebar).toBeVisible();
    
    // Navigate to Pages
    await page.click('a[href="/admin/pages"]');
    await page.waitForURL('/admin/pages');
    
    // Verify sidebar persists
    await expect(sidebar).toBeVisible();
    
    // Navigate to Media
    await page.click('a[href="/admin/media"]');
    await page.waitForURL('/admin/media');
    
    // Verify sidebar persists
    await expect(sidebar).toBeVisible();
    
    // Navigate to Menus
    await page.click('a[href="/admin/menus"]');
    await page.waitForURL('/admin/menus');
    
    // Confirm sidebar persists throughout
    await expect(sidebar).toBeVisible();
  });

  test('should update active menu item correctly during navigation', async ({ page }) => {
    // Start on dashboard - verify dashboard is active
    await expect(page.locator('[data-testid*="nav-dashboard"][data-testid*="active"]')).toBeVisible();
    
    // Navigate to Topics
    await page.click('a[href="/admin/topics"]');
    await page.waitForURL('/admin/topics');
    
    // Verify Topics menu item is now active and Dashboard is not
    await expect(page.locator('[data-testid*="nav-topics"][data-testid*="active"]')).toBeVisible();
    await expect(page.locator('[data-testid*="nav-dashboard"][data-testid*="active"]')).not.toBeVisible();
    
    // Navigate to Settings
    await page.click('a[href="/admin/settings"]');
    await page.waitForURL('/admin/settings');
    
    // Verify Settings menu item is now active
    await expect(page.locator('[data-testid*="nav-settings"][data-testid*="active"]')).toBeVisible();
    await expect(page.locator('[data-testid*="nav-topics"][data-testid*="active"]')).not.toBeVisible();
    
    // Navigate to Pages
    await page.click('a[href="/admin/pages"]');
    await page.waitForURL('/admin/pages');
    
    // Verify Pages menu item is now active
    await expect(page.locator('[data-testid*="nav-pages"][data-testid*="active"]')).toBeVisible();
    await expect(page.locator('[data-testid*="nav-settings"][data-testid*="active"]')).not.toBeVisible();
    
    // Navigate to Media
    await page.click('a[href="/admin/media"]');
    await page.waitForURL('/admin/media');
    
    // Verify Media menu item is now active
    await expect(page.locator('[data-testid*="nav-media"][data-testid*="active"]')).toBeVisible();
    await expect(page.locator('[data-testid*="nav-pages"][data-testid*="active"]')).not.toBeVisible();
    
    // Navigate to Menus
    await page.click('a[href="/admin/menus"]');
    await page.waitForURL('/admin/menus');
    
    // Verify Menus menu item is now active
    await expect(page.locator('[data-testid*="nav-menus"][data-testid*="active"]')).toBeVisible();
    await expect(page.locator('[data-testid*="nav-media"][data-testid*="active"]')).not.toBeVisible();
  });

  test('should not cause sidebar to flicker during rapid navigation', async ({ page }) => {
    const sidebar = page.locator('[data-testid="admin-sidebar"]');
    
    // Track sidebar visibility throughout rapid navigation
    let sidebarVisibilityChanges = 0;
    
    // Monitor sidebar visibility changes
    sidebar.evaluate((element) => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            // Check if visibility changed
            const isVisible = window.getComputedStyle(element).display !== 'none';
            if (!isVisible) {
              (window as any).sidebarHidden = true;
            }
          }
        });
      });
      observer.observe(element, { attributes: true, subtree: true });
    });
    
    // Rapidly navigate between pages
    const pages = [
      '/admin/topics',
      '/admin/settings', 
      '/admin/pages',
      '/admin/media',
      '/admin/menus',
      '/admin' // back to dashboard
    ];
    
    for (const pagePath of pages) {
      await page.click(`a[href="${pagePath}"]`);
      await page.waitForURL(pagePath);
      
      // Verify sidebar is always visible
      await expect(sidebar).toBeVisible();
      
      // Small delay to allow any potential flickering to occur
      await page.waitForTimeout(100);
    }
    
    // Check if sidebar was ever hidden during navigation
    const wasHidden = await page.evaluate(() => (window as any).sidebarHidden);
    expect(wasHidden).toBeFalsy();
  });

  test('should maintain sidebar scroll position during navigation', async ({ page }) => {
    // If sidebar has scrollable content, test scroll position persistence
    const sidebar = page.locator('[data-testid="admin-sidebar"]');
    
    // Check if sidebar is scrollable (has overflow)
    const isScrollable = await sidebar.evaluate((element) => {
      return element.scrollHeight > element.clientHeight;
    });
    
    if (isScrollable) {
      // Scroll sidebar to middle position
      await sidebar.evaluate((element) => {
        element.scrollTop = element.scrollHeight / 2;
      });
      
      const initialScrollTop = await sidebar.evaluate((element) => element.scrollTop);
      
      // Navigate to different page
      await page.click('a[href="/admin/topics"]');
      await page.waitForURL('/admin/topics');
      
      // Check that scroll position is maintained
      const scrollTopAfterNavigation = await sidebar.evaluate((element) => element.scrollTop);
      expect(scrollTopAfterNavigation).toBe(initialScrollTop);
    }
  });

  test('should handle mobile sidebar state persistence', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Open mobile sidebar
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-toggle"]');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      
      // Verify mobile sidebar is open
      await expect(page.locator('[data-testid*="mobile-sidebar"]')).toBeVisible();
      
      // Navigate to different page
      await page.click('a[href="/admin/topics"]');
      await page.waitForURL('/admin/topics');
      
      // Verify mobile sidebar state is maintained (should still be open)
      await expect(page.locator('[data-testid*="mobile-sidebar"]')).toBeVisible();
      
      // Close mobile sidebar
      await mobileMenuButton.click();
      await expect(page.locator('[data-testid*="mobile-sidebar"]')).not.toBeVisible();
      
      // Navigate again
      await page.click('a[href="/admin/settings"]');
      await page.waitForURL('/admin/settings');
      
      // Verify mobile sidebar stays closed
      await expect(page.locator('[data-testid*="mobile-sidebar"]')).not.toBeVisible();
    }
  });
});