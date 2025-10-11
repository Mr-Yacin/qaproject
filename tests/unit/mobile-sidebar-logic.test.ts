import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

// Mock the Sidebar component
vi.mock('@/components/admin/Sidebar', () => ({
  default: ({ isMobileOpen, onMobileToggle }: { isMobileOpen: boolean; onMobileToggle: () => void }) => {
    return (
      <div data-testid="sidebar" data-mobile-open={isMobileOpen}>
        <button data-testid="sidebar-toggle" onClick={onMobileToggle}>
          Toggle Sidebar
        </button>
      </div>
    );
  },
}));

// Mock other admin components
vi.mock('@/components/admin/AdminHeader', () => ({
  default: () => {
    return <div data-testid="admin-header">Admin Header</div>;
  },
}));

vi.mock('@/components/admin/AdminBreadcrumbs', () => ({
  default: () => {
    return <div data-testid="admin-breadcrumbs">Breadcrumbs</div>;
  },
}));

vi.mock('@/components/ui/toaster', () => ({
  Toaster: () => {
    return <div data-testid="toaster">Toaster</div>;
  },
}));

vi.mock('@/components/ui/skip-link', () => ({
  SkipLink: () => {
    return <div data-testid="skip-link">Skip Link</div>;
  },
}));

describe('AdminLayoutClient Mobile Sidebar Logic', () => {
  const mockSession = {
    user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'ADMIN' },
    expires: '2024-12-31',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Mobile Sidebar State Management', () => {
    it('should initialize with mobile sidebar closed', () => {
      (usePathname as any).mockReturnValue('/admin');

      render(
        <AdminLayoutClient session={mockSession}>
          <div>Test Content</div>
        </AdminLayoutClient>
      );

      const sidebar = screen.getByTestId('sidebar');
      expect(sidebar).toHaveAttribute('data-mobile-open', 'false');
    });

    it('should toggle mobile sidebar state when toggle function is called', async () => {
      (usePathname as any).mockReturnValue('/admin');

      render(
        <AdminLayoutClient session={mockSession}>
          <div>Test Content</div>
        </AdminLayoutClient>
      );

      const sidebar = screen.getByTestId('sidebar');
      const toggleButton = screen.getByTestId('mobile-menu-toggle');

      // Initially closed
      expect(sidebar).toHaveAttribute('data-mobile-open', 'false');

      // Click to open
      fireEvent.click(toggleButton);
      await waitFor(() => {
        expect(sidebar).toHaveAttribute('data-mobile-open', 'true');
      });

      // Click to close
      fireEvent.click(toggleButton);
      await waitFor(() => {
        expect(sidebar).toHaveAttribute('data-mobile-open', 'false');
      });
    });

    it('should maintain mobile sidebar state during re-renders', async () => {
      (usePathname as any).mockReturnValue('/admin');

      const { rerender } = render(
        <AdminLayoutClient session={mockSession}>
          <div>Test Content</div>
        </AdminLayoutClient>
      );

      const toggleButton = screen.getByTestId('mobile-menu-toggle');
      const sidebar = screen.getByTestId('sidebar');

      // Open sidebar
      fireEvent.click(toggleButton);
      await waitFor(() => {
        expect(sidebar).toHaveAttribute('data-mobile-open', 'true');
      });

      // Re-render component (simulating navigation or state change)
      rerender(
        <AdminLayoutClient session={mockSession}>
          <div>Updated Content</div>
        </AdminLayoutClient>
      );

      // Sidebar should still be open
      const sidebarAfterRerender = screen.getByTestId('sidebar');
      expect(sidebarAfterRerender).toHaveAttribute('data-mobile-open', 'true');
    });
  });

  describe('Mobile Menu Button Rendering', () => {
    it('should render mobile menu button when session exists and not on login page', () => {
      (usePathname as any).mockReturnValue('/admin');

      render(
        <AdminLayoutClient session={mockSession}>
          <div>Test Content</div>
        </AdminLayoutClient>
      );

      const mobileMenuButton = screen.getByTestId('mobile-menu-toggle');
      expect(mobileMenuButton).toBeInTheDocument();
      expect(mobileMenuButton).toHaveAttribute('aria-label', 'Open sidebar');
      expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'false');
      expect(mobileMenuButton).toHaveAttribute('aria-controls', 'admin-sidebar');
    });

    it('should update aria-expanded when mobile sidebar is toggled', async () => {
      (usePathname as any).mockReturnValue('/admin');

      render(
        <AdminLayoutClient session={mockSession}>
          <div>Test Content</div>
        </AdminLayoutClient>
      );

      const mobileMenuButton = screen.getByTestId('mobile-menu-toggle');

      // Initially collapsed
      expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'false');

      // Click to expand
      fireEvent.click(mobileMenuButton);
      await waitFor(() => {
        expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'true');
      });

      // Click to collapse
      fireEvent.click(mobileMenuButton);
      await waitFor(() => {
        expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('should not render mobile menu button on login page', () => {
      (usePathname as any).mockReturnValue('/admin/login');

      render(
        <AdminLayoutClient session={null}>
          <div>Login Content</div>
        </AdminLayoutClient>
      );

      const mobileMenuButton = screen.queryByTestId('mobile-menu-toggle');
      expect(mobileMenuButton).not.toBeInTheDocument();
    });

    it('should not render mobile menu button when no session', () => {
      (usePathname as any).mockReturnValue('/admin');

      render(
        <AdminLayoutClient session={null}>
          <div>No Session Content</div>
        </AdminLayoutClient>
      );

      const mobileMenuButton = screen.queryByTestId('mobile-menu-toggle');
      expect(mobileMenuButton).not.toBeInTheDocument();
    });
  });

  describe('Sidebar Conditional Rendering', () => {
    it('should render sidebar when session exists and not on login page', () => {
      (usePathname as any).mockReturnValue('/admin');

      render(
        <AdminLayoutClient session={mockSession}>
          <div>Test Content</div>
        </AdminLayoutClient>
      );

      const sidebar = screen.getByTestId('sidebar');
      expect(sidebar).toBeInTheDocument();
    });

    it('should not render sidebar on login page', () => {
      (usePathname as any).mockReturnValue('/admin/login');

      render(
        <AdminLayoutClient session={null}>
          <div>Login Content</div>
        </AdminLayoutClient>
      );

      const sidebar = screen.queryByTestId('sidebar');
      expect(sidebar).not.toBeInTheDocument();
    });

    it('should not render sidebar when no session', () => {
      (usePathname as any).mockReturnValue('/admin');

      render(
        <AdminLayoutClient session={null}>
          <div>No Session Content</div>
        </AdminLayoutClient>
      );

      const sidebar = screen.queryByTestId('sidebar');
      expect(sidebar).not.toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('should render full admin layout with sidebar when authenticated', () => {
      (usePathname as any).mockReturnValue('/admin');

      render(
        <AdminLayoutClient session={mockSession}>
          <div data-testid="page-content">Page Content</div>
        </AdminLayoutClient>
      );

      // Should have all admin layout components
      expect(screen.getByTestId('skip-link')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-menu-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('admin-breadcrumbs')).toBeInTheDocument();
      expect(screen.getByTestId('page-content')).toBeInTheDocument();
      expect(screen.getByTestId('toaster')).toBeInTheDocument();
    });

    it('should render minimal layout without sidebar when not authenticated', () => {
      (usePathname as any).mockReturnValue('/admin/login');

      render(
        <AdminLayoutClient session={null}>
          <div data-testid="login-content">Login Content</div>
        </AdminLayoutClient>
      );

      // Should only have minimal components
      expect(screen.getByTestId('login-content')).toBeInTheDocument();
      expect(screen.getByTestId('toaster')).toBeInTheDocument();

      // Should not have admin layout components
      expect(screen.queryByTestId('skip-link')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
      expect(screen.queryByTestId('mobile-menu-toggle')).not.toBeInTheDocument();
      expect(screen.queryByTestId('admin-breadcrumbs')).not.toBeInTheDocument();
    });
  });

  describe('SessionProvider Integration', () => {
    it('should wrap content in SessionProvider with correct session', () => {
      (usePathname as any).mockReturnValue('/admin');

      render(
        <AdminLayoutClient session={mockSession}>
          <div>Test Content</div>
        </AdminLayoutClient>
      );

      // Verify SessionProvider is present (indirectly by checking if components render)
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('should wrap content in SessionProvider even without session', () => {
      (usePathname as any).mockReturnValue('/admin/login');

      render(
        <AdminLayoutClient session={null}>
          <div data-testid="login-content">Login Content</div>
        </AdminLayoutClient>
      );

      // Content should still render (wrapped in SessionProvider)
      expect(screen.getByTestId('login-content')).toBeInTheDocument();
    });
  });

  describe('Mobile Sidebar Toggle Function', () => {
    it('should pass correct toggle function to sidebar component', async () => {
      (usePathname as any).mockReturnValue('/admin');

      render(
        <AdminLayoutClient session={mockSession}>
          <div>Test Content</div>
        </AdminLayoutClient>
      );

      const sidebar = screen.getByTestId('sidebar');
      const sidebarToggleButton = screen.getByTestId('sidebar-toggle');
      const mobileMenuButton = screen.getByTestId('mobile-menu-toggle');

      // Initially closed
      expect(sidebar).toHaveAttribute('data-mobile-open', 'false');

      // Toggle via mobile menu button
      fireEvent.click(mobileMenuButton);
      await waitFor(() => {
        expect(sidebar).toHaveAttribute('data-mobile-open', 'true');
      });

      // Toggle via sidebar's internal button (should use same function)
      fireEvent.click(sidebarToggleButton);
      await waitFor(() => {
        expect(sidebar).toHaveAttribute('data-mobile-open', 'false');
      });
    });
  });
});