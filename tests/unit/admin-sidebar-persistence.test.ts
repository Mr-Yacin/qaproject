import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock Next.js hooks
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  SessionProvider: vi.fn(({ children }) => children),
}));

// Mock child components to focus on layout logic
vi.mock('@/components/admin/Sidebar', () => ({
  default: vi.fn(({ isMobileOpen, onMobileToggle }) => 
    React.createElement('div', {
      'data-testid': 'admin-sidebar',
      'data-mobile-open': isMobileOpen
    }, [
      React.createElement('button', {
        key: 'toggle',
        'data-testid': 'sidebar-toggle',
        onClick: onMobileToggle
      }, 'Toggle'),
      React.createElement('nav', { key: 'nav' }, [
        React.createElement('a', { key: 'dashboard', href: '/admin', 'data-testid': 'nav-dashboard' }, 'Dashboard'),
        React.createElement('a', { key: 'topics', href: '/admin/topics', 'data-testid': 'nav-topics' }, 'Topics'),
        React.createElement('a', { key: 'settings', href: '/admin/settings', 'data-testid': 'nav-settings' }, 'Settings'),
        React.createElement('a', { key: 'pages', href: '/admin/pages', 'data-testid': 'nav-pages' }, 'Pages'),
        React.createElement('a', { key: 'media', href: '/admin/media', 'data-testid': 'nav-media' }, 'Media'),
        React.createElement('a', { key: 'menus', href: '/admin/menus', 'data-testid': 'nav-menus' }, 'Menus')
      ])
    ])
  ),
}));

vi.mock('@/components/admin/AdminHeader', () => ({
  default: vi.fn(() => React.createElement('div', { 'data-testid': 'admin-header' }, 'Header')),
}));

vi.mock('@/components/admin/AdminBreadcrumbs', () => ({
  default: vi.fn(() => React.createElement('div', { 'data-testid': 'admin-breadcrumbs' }, 'Breadcrumbs')),
}));

vi.mock('@/components/ui/toaster', () => ({
  Toaster: vi.fn(() => React.createElement('div', { 'data-testid': 'toaster' }, 'Toaster')),
}));

vi.mock('@/components/ui/skip-link', () => ({
  SkipLink: vi.fn(() => React.createElement('div', { 'data-testid': 'skip-link' }, 'Skip Link')),
}));

// Import the component after mocks
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Session } from 'next-auth';
import { Content } from '@radix-ui/react-dialog';
import { Content } from '@radix-ui/react-dialog';
import { Content } from '@radix-ui/react-dialog';
import { Content } from '@radix-ui/react-dialog';
import { Content } from '@radix-ui/react-dialog';
import { Content } from '@radix-ui/react-dialog';
import { Content } from '@radix-ui/react-dialog';
import { Content } from '@radix-ui/react-dialog';
import { Content } from '@radix-ui/react-dialog';
import { Content } from '@radix-ui/react-dialog';
import { Content } from '@radix-ui/react-dialog';
import { Content } from '@radix-ui/react-dialog';
import { Content } from '@radix-ui/react-dialog';
import { Content } from '@radix-ui/react-dialog';
import { Content } from '@radix-ui/react-dialog';
import { Content } from '@radix-ui/react-dialog';
import { Content } from '@radix-ui/react-dialog';
import { Form } from 'react-hook-form';
import { Form } from 'react-hook-form';
import { Content } from '@radix-ui/react-dialog';
import { Content } from '@radix-ui/react-dialog';
import { Content } from '@radix-ui/react-dialog';
import { Content } from '@radix-ui/react-dialog';
import { Form } from 'react-hook-form';
import { Content } from '@radix-ui/react-dialog';

const mockSession: Session = {
  user: {
    id: '1',
    name: 'Test Admin',
    email: 'admin@test.com',
    role: 'ADMIN',
  },
  expires: '2024-12-31',
};

describe('AdminLayoutClient Sidebar Persistence', () => {
  const mockUsePathname = usePathname as ReturnType<typeof vi.fn>;
  const mockUseSession = useSession as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });
  });

  describe('Sidebar Rendering Logic', () => {
    it('should render sidebar when authenticated and not on login page', () => {
      mockUsePathname.mockReturnValue('/admin');

      render(
        <AdminLayoutClient session={mockSession}>
          <div data-testid="page-content">Dashboard Content</div>
        </AdminLayoutClient>
      );

      expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('admin-header')).toBeInTheDocument();
      expect(screen.getByTestId('page-content')).toBeInTheDocument();
    });

    it('should not render sidebar on login page', () => {
      mockUsePathname.mockReturnValue('/admin/login');

      render(
        <AdminLayoutClient session={mockSession}>
          <div data-testid="login-content">Login Form</div>
        </AdminLayoutClient>
      );

      expect(screen.queryByTestId('admin-sidebar')).not.toBeInTheDocument();
      expect(screen.queryByTestId('admin-header')).not.toBeInTheDocument();
      expect(screen.getByTestId('login-content')).toBeInTheDocument();
    });

    it('should not render sidebar when session is null', () => {
      mockUsePathname.mockReturnValue('/admin');

      render(
        <AdminLayoutClient session={null}>
          <div data-testid="page-content">Content</div>
        </AdminLayoutClient>
      );

      expect(screen.queryByTestId('admin-sidebar')).not.toBeInTheDocument();
      expect(screen.queryByTestId('admin-header')).not.toBeInTheDocument();
      expect(screen.getByTestId('page-content')).toBeInTheDocument();
    });
  });

  describe('Mobile Sidebar State Management', () => {
    it('should maintain mobile sidebar state', () => {
      mockUsePathname.mockReturnValue('/admin');

      render(
        <AdminLayoutClient session={mockSession}>
          <div data-testid="page-content">Dashboard Content</div>
        </AdminLayoutClient>
      );

      const sidebar = screen.getByTestId('admin-sidebar');
      const toggleButton = screen.getByTestId('sidebar-toggle');

      // Initially closed
      expect(sidebar).toHaveAttribute('data-mobile-open', 'false');

      // Open mobile sidebar
      fireEvent.click(toggleButton);
      expect(sidebar).toHaveAttribute('data-mobile-open', 'true');

      // Close mobile sidebar
      fireEvent.click(toggleButton);
      expect(sidebar).toHaveAttribute('data-mobile-open', 'false');
    });

    it('should persist mobile sidebar state during route changes', async () => {
      mockUsePathname.mockReturnValue('/admin');

      const { rerender } = render(
        <AdminLayoutClient session={mockSession}>
          <div data-testid="dashboard-content">Dashboard</div>
        </AdminLayoutClient>
      );

      const sidebar = screen.getByTestId('admin-sidebar');
      const toggleButton = screen.getByTestId('sidebar-toggle');

      // Open mobile sidebar
      fireEvent.click(toggleButton);
      expect(sidebar).toHaveAttribute('data-mobile-open', 'true');

      // Simulate navigation to topics page
      mockUsePathname.mockReturnValue('/admin/topics');
      
      rerender(
        <AdminLayoutClient session={mockSession}>
          <div data-testid="topics-content">Topics</div>
        </AdminLayoutClient>
      );

      // Sidebar should still be open
      const sidebarAfterNavigation = screen.getByTestId('admin-sidebar');
      expect(sidebarAfterNavigation).toHaveAttribute('data-mobile-open', 'true');
    });
  });

  describe('Layout Consistency', () => {
    it('should render consistent layout structure across different admin pages', () => {
      const adminPages = [
        '/admin',
        '/admin/topics',
        '/admin/settings',
        '/admin/pages',
        '/admin/media',
        '/admin/menus',
      ];

      adminPages.forEach((pathname) => {
        mockUsePathname.mockReturnValue(pathname);

        const { unmount } = render(
          <AdminLayoutClient session={mockSession}>
            <div data-testid={`${pathname.split('/').pop()}-content`}>
              Content for {pathname}
            </div>
          </AdminLayoutClient>
        );

        // All admin pages should have sidebar and header
        expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
        expect(screen.getByTestId('admin-header')).toBeInTheDocument();
        expect(screen.getByTestId('admin-breadcrumbs')).toBeInTheDocument();
        expect(screen.getByTestId('skip-link')).toBeInTheDocument();
        expect(screen.getByTestId('toaster')).toBeInTheDocument();

        unmount();
      });
    });

    it('should maintain layout structure when session changes', async () => {
      mockUsePathname.mockReturnValue('/admin');

      const { rerender } = render(
        <AdminLayoutClient session={mockSession}>
          <div data-testid="page-content">Content</div>
        </AdminLayoutClient>
      );

      // Initially with session - should have sidebar
      expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();

      // Session becomes null - should not have sidebar
      rerender(
        <AdminLayoutClient session={null}>
          <div data-testid="page-content">Content</div>
        </AdminLayoutClient>
      );

      expect(screen.queryByTestId('admin-sidebar')).not.toBeInTheDocument();

      // Session restored - should have sidebar again
      rerender(
        <AdminLayoutClient session={mockSession}>
          <div data-testid="page-content">Content</div>
        </AdminLayoutClient>
      );

      expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
    });
  });

  describe('Navigation Links Accessibility', () => {
    it('should render all navigation links when sidebar is present', () => {
      mockUsePathname.mockReturnValue('/admin');

      render(
        <AdminLayoutClient session={mockSession}>
          <div data-testid="page-content">Dashboard Content</div>
        </AdminLayoutClient>
      );

      // Check that all navigation links are present
      expect(screen.getByTestId('nav-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('nav-topics')).toBeInTheDocument();
      expect(screen.getByTestId('nav-settings')).toBeInTheDocument();
      expect(screen.getByTestId('nav-pages')).toBeInTheDocument();
      expect(screen.getByTestId('nav-media')).toBeInTheDocument();
      expect(screen.getByTestId('nav-menus')).toBeInTheDocument();
    });
  });
});