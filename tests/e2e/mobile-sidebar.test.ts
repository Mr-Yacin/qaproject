import { test, expect } from '@playwright/test';

test.describe('Mobile Sidebar Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to admin login
    await page.goto('/admin/login');
    
    // Login with test credentials
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to admin dashboard
    await page.waitForURL('/admin');
  });

  test('should show mobile menu button on mobile viewport', async ({ page }) => {
    // Verify mobile menu button is visible
    const mobileMenuButton = page.getByTestId('mobile-menu-toggle');
    await expect(mobileMenuButton).toBeVisible();
    
    // Verify it has proper accessibility attributes
    await expect(mobileMenuButton).toHaveAttribute('aria-label', 'Open sidebar');
    await expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'false');
    await expect(mobileMenuButton).toHaveAttribute('aria-controls', 'admin-sidebar');
    
    // Verify sidebar is initially hidden on mobile
    const sidebar = page.getByTestId('admin-sidebar');
    await expect(sidebar).toHaveClass(/translate-x-full/);
  });

  test('should toggle mobile sidebar open and closed', async ({ page }) => {
    const mobileMenuButton = page.getByTestId('mobile-menu-toggle');
    const sidebar = page.getByTestId('admin-sidebar');
    const overlay = page.getByTestId('mobile-sidebar-overlay');
    
    // Initially sidebar should be closed
    await expect(sidebar).toHaveClass(/-translate-x-full/);
    await expect(overlay).not.toBeVisible();
    await expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'false');
    
    // Click to open sidebar
    await mobileMenuButton.click();
    
    // Verify sidebar is now open
    await expect(sidebar).toHaveClass(/translate-x-0/);
    await expect(sidebar).not.toHaveClass(/-translate-x-full/);
    await expect(overlay).toBeVisible();
    await expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'true');
    
    // Click to close sidebar (using the X button in sidebar)
    const closeSidebarButton = sidebar.getByTestId('mobile-menu-toggle');
    await closeSidebarButton.click();
    
    // Verify sidebar is closed again
    await expect(sidebar).toHaveClass(/-translate-x-full/);
    await expect(overlay).not.toBeVisible();
    await expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('should close sidebar when clicking overlay', async ({ page }) => {
    const mobileMenuButton = page.getByTestId('mobile-menu-toggle');
    const sidebar = page.getByTestId('admin-sidebar');
    const overlay = page.getByTestId('mobile-sidebar-overlay');
    
    // Open sidebar
    await mobileMenuButton.click();
    await expect(sidebar).toHaveClass(/translate-x-0/);
    await expect(overlay).toBeVisible();
    
    // Click overlay to close
    await overlay.click();
    
    // Verify sidebar is closed
    await expect(sidebar).toHaveClass(/-translate-x-full/);
    await expect(overlay).not.toBeVisible();
  });

  test('should maintain mobile sidebar state during navigation', async ({ page }) => {
    const mobileMenuButton = page.getByTestId('mobile-menu-toggle');
    const sidebar = page.getByTestId('admin-sidebar');
    
    // Open mobile sidebar
    await mobileMenuButton.click();
    await expect(sidebar).toHaveClass(/translate-x-0/);
    
    // Navigate to Topics page
    await page.goto('/admin/topics');
    await page.waitForLoadState('networkidle');
    
    // Verify sidebar is still open after navigation
    const sidebarAfterNav = page.getByTestId('admin-sidebar');
    await expect(sidebarAfterNav).toHaveClass(/translate-x-0/);
    
    // Verify mobile menu button still shows expanded state
    const mobileMenuButtonAfterNav = page.getByTestId('mobile-menu-toggle');
    await expect(mobileMenuButtonAfterNav).toHaveAttribute('aria-expanded', 'true');
    
    // Navigate to Settings page
    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');
    
    // Verify sidebar state is still maintained
    const sidebarAfterSecondNav = page.getByTestId('admin-sidebar');
    await expect(sidebarAfterSecondNav).toHaveClass(/translate-x-0/);
  });

  test('should close mobile sidebar and maintain closed state during navigation', async ({ page }) => {
    const mobileMenuButton = page.getByTestId('mobile-menu-toggle');
    const sidebar = page.getByTestId('admin-sidebar');
    
    // Initially sidebar is closed
    await expect(sidebar).toHaveClass(/-translate-x-full/);
    
    // Navigate to Topics page
    await page.goto('/admin/topics');
    await page.waitForLoadState('networkidle');
    
    // Verify sidebar remains closed after navigation
    const sidebarAfterNav = page.getByTestId('admin-sidebar');
    await expect(sidebarAfterNav).toHaveClass(/-translate-x-full/);
    
    // Verify mobile menu button still shows collapsed state
    const mobileMenuButtonAfterNav = page.getByTestId('mobile-menu-toggle');
    await expect(mobileMenuButtonAfterNav).toHaveAttribute('aria-expanded', 'false');
    
    // Navigate to Pages
    await page.goto('/admin/pages');
    await page.waitForLoadState('networkidle');
    
    // Verify sidebar state is still maintained as closed
    const sidebarAfterSecondNav = page.getByTestId('admin-sidebar');
    await expect(sidebarAfterSecondNav).toHaveClass(/-translate-x-full/);
  });

  test('should close mobile sidebar when navigating via sidebar links', async ({ page }) => {
    const mobileMenuButton = page.getByTestId('mobile-menu-toggle');
    const sidebar = page.getByTestId('admin-sidebar');
    
    // Open mobile sidebar
    await mobileMenuButton.click();
    await expect(sidebar).toHaveClass(/translate-x-0/);
    
    // Click on Topics link in sidebar
    const topicsLink = sidebar.getByTestId('nav-topics');
    await topicsLink.click();
    
    // Wait for navigation
    await page.waitForURL('/admin/topics');
    
    // Verify sidebar automatically closed after navigation
    const sidebarAfterNav = page.getByTestId('admin-sidebar');
    await expect(sidebarAfterNav).toHaveClass(/-translate-x-full/);
    
    // Verify mobile menu button shows collapsed state
    const mobileMenuButtonAfterNav = page.getByTestId('mobile-menu-toggle');
    await expect(mobileMenuButtonAfterNav).toHaveAttribute('aria-expanded', 'false');
  });

  test('should work correctly across different mobile viewport sizes', async ({ page }) => {
    const testViewports = [
      { width: 320, height: 568 }, // iPhone SE
      { width: 375, height: 667 }, // iPhone 8
      { width: 414, height: 896 }, // iPhone 11 Pro Max
      { width: 768, height: 1024 }, // iPad (should still show mobile behavior)
    ];

    for (const viewport of testViewports) {
      await page.setViewportSize(viewport);
      
      // Verify mobile menu button is visible
      const mobileMenuButton = page.getByTestId('mobile-menu-toggle');
      await expect(mobileMenuButton).toBeVisible();
      
      // Test sidebar toggle functionality
      const sidebar = page.getByTestId('admin-sidebar');
      
      // Should be closed initially
      await expect(sidebar).toHaveClass(/-translate-x-full/);
      
      // Open sidebar
      await mobileMenuButton.click();
      await expect(sidebar).toHaveClass(/translate-x-0/);
      
      // Close sidebar
      const closeSidebarButton = sidebar.getByTestId('mobile-menu-toggle');
      await closeSidebarButton.click();
      await expect(sidebar).toHaveClass(/-translate-x-full/);
    }
  });

  test('should not show mobile menu button on desktop viewport', async ({ page }) => {
    // Switch to desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    
    // Refresh to apply viewport changes
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify mobile menu button is not visible on desktop
    const mobileMenuButton = page.getByTestId('mobile-menu-toggle');
    await expect(mobileMenuButton).not.toBeVisible();
    
    // Verify sidebar is always visible on desktop
    const sidebar = page.getByTestId('admin-sidebar');
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toHaveClass(/lg:translate-x-0/);
  });

  test('should maintain proper focus management', async ({ page }) => {
    const mobileMenuButton = page.getByTestId('mobile-menu-toggle');
    const sidebar = page.getByTestId('admin-sidebar');
    
    // Focus on mobile menu button
    await mobileMenuButton.focus();
    await expect(mobileMenuButton).toBeFocused();
    
    // Open sidebar with keyboard (Enter key)
    await page.keyboard.press('Enter');
    await expect(sidebar).toHaveClass(/translate-x-0/);
    
    // Focus should move to close button in sidebar
    const closeSidebarButton = sidebar.getByTestId('mobile-menu-toggle');
    await closeSidebarButton.focus();
    await expect(closeSidebarButton).toBeFocused();
    
    // Close sidebar with keyboard
    await page.keyboard.press('Enter');
    await expect(sidebar).toHaveClass(/-translate-x-full/);
  });

  test('should handle rapid toggle clicks without issues', async ({ page }) => {
    const mobileMenuButton = page.getByTestId('mobile-menu-toggle');
    const sidebar = page.getByTestId('admin-sidebar');
    
    // Rapidly toggle sidebar multiple times
    for (let i = 0; i < 5; i++) {
      await mobileMenuButton.click();
      await page.waitForTimeout(100); // Small delay to allow animation
      
      if (i % 2 === 0) {
        // Should be open on even iterations
        await expect(sidebar).toHaveClass(/translate-x-0/);
      } else {
        // Should be closed on odd iterations (after clicking close button)
        const closeSidebarButton = sidebar.getByTestId('mobile-menu-toggle');
        await closeSidebarButton.click();
        await expect(sidebar).toHaveClass(/-translate-x-full/);
      }
    }
  });
});