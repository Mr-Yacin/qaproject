'use client';

import { useState } from 'react';
import { SessionProvider } from 'next-auth/react';
import Sidebar from '@/components/admin/Sidebar';
import { Menu } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <SessionProvider>
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
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                  aria-label="Open sidebar"
                >
                  <Menu className="w-6 h-6 text-gray-600" />
                </button>
                <h1 className="text-lg font-semibold text-gray-900">
                  Admin Dashboard
                </h1>
                <div className="w-10" /> {/* Spacer for centering */}
              </div>
            </header>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto">
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
