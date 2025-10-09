'use client';

import { useState } from 'react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import Sidebar from '@/components/admin/Sidebar';
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

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <SessionProvider session={session}>
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
            {/* Mobile header */}
            <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={toggleMobileSidebar}
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
            </header>

            {/* Main content */}
            <main id="main-content" className="flex-1 overflow-y-auto" tabIndex={-1}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {children}
              </div>
            </main>
          </div>
        </div>
        <Toaster />
      </div>
    </SessionProvider>
  );
}
