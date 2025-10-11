'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import Sidebar from '@/components/admin/Sidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';
import { SessionMonitor } from '@/components/admin/SessionMonitor';
import { Menu } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { SkipLink } from '@/components/ui/skip-link';

interface AdminLayoutClientProps {
  children: React.ReactNode;
  session: Session | null;
}

export default function AdminLayoutClient({
  children,
  session,
}: AdminLayoutClientProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Determine if we should show the sidebar
  // Only show sidebar when:
  // 1. Session exists (user is authenticated)
  // 2. Current route is NOT the login page
  const isLoginPage = pathname === '/admin/login';
  const shouldShowSidebar = session && !isLoginPage;

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <SessionProvider session={session}>
      <SessionMonitor />
      {shouldShowSidebar ? (
        // Full admin layout with sidebar (for authenticated users on non-login pages)
        <>
          <SkipLink />
          <div className="min-h-screen bg-gray-50">
            <div className="flex h-screen overflow-hidden">
              {/* Sidebar */}
              <Sidebar
                isMobileOpen={isMobileSidebarOpen}
                onMobileToggle={toggleMobileSidebar}
              />

              {/* Main content area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile menu button - only visible on mobile */}
                <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={toggleMobileSidebar}
                      data-testid="mobile-menu-toggle"
                      className="p-2 rounded-md hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      aria-label="Open sidebar"
                      aria-expanded={isMobileSidebarOpen}
                      aria-controls="admin-sidebar"
                    >
                      <Menu className="w-6 h-6 text-gray-600" aria-hidden="true" />
                    </button>
                    <h1 className="text-lg font-semibold text-gray-900">
                      Admin Dashboard
                    </h1>
                    <div className="w-10" /> {/* Spacer for centering */}
                  </div>
                </div>

                {/* Desktop header - only visible on desktop */}
                <div className="hidden lg:block">
                  <AdminHeader />
                </div>

                {/* Main content */}
                <main id="main-content" className="flex-1 overflow-y-auto" tabIndex={-1}>
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <AdminBreadcrumbs />
                    {children}
                  </div>
                </main>
              </div>
            </div>
            <Toaster />
          </div>
        </>
      ) : (
        // Minimal layout without sidebar (for login page or unauthenticated users)
        <>
          {children}
          <Toaster />
        </>
      )}
    </SessionProvider>
  );
}
