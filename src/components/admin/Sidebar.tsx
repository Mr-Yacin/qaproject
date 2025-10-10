'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  X,
  User,
  FileEdit,
  Image,
  Navigation as NavigationIcon,
  Users,
  History,
  Database,
  Layers,
} from 'lucide-react';
import { UserRole } from '@prisma/client';

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileToggle: () => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[]; // Roles that can see this menu item
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    roles: [UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER],
  },
  {
    name: 'Topics',
    href: '/admin/topics',
    icon: FileText,
    roles: [UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER],
  },
  {
    name: 'Pages',
    href: '/admin/pages',
    icon: FileEdit,
    roles: [UserRole.ADMIN, UserRole.EDITOR],
  },
  {
    name: 'Media',
    href: '/admin/media',
    icon: Image,
    roles: [UserRole.ADMIN, UserRole.EDITOR],
  },
  {
    name: 'Menus',
    href: '/admin/menus',
    icon: NavigationIcon,
    roles: [UserRole.ADMIN, UserRole.EDITOR],
  },
  {
    name: 'Footer',
    href: '/admin/footer',
    icon: Layers,
    roles: [UserRole.ADMIN, UserRole.EDITOR],
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
    roles: [UserRole.ADMIN],
  },
  {
    name: 'Audit Log',
    href: '/admin/audit-log',
    icon: History,
    roles: [UserRole.ADMIN],
  },
  {
    name: 'Cache',
    href: '/admin/cache',
    icon: Database,
    roles: [UserRole.ADMIN],
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    roles: [UserRole.ADMIN],
  },
];

export default function Sidebar({ isMobileOpen, onMobileToggle }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: '/admin/login' });
  };

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Filter navigation items based on user role
  const userRole = (session?.user as any)?.role as UserRole | undefined;
  const visibleNavigationItems = navigationItems.filter((item) => {
    if (!userRole) return false;
    return item.roles.includes(userRole);
  });

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onMobileToggle}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        aria-label="Admin sidebar navigation"
        role="complementary"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Link href="/admin" className="flex items-center space-x-2" aria-label="CMS Dashboard Home">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center" aria-hidden="true">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900">CMS</span>
            </Link>
            <button
              onClick={onMobileToggle}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5 text-gray-600" aria-hidden="true" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Admin navigation menu">
            {visibleNavigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    // Close mobile menu on navigation
                    if (isMobileOpen) {
                      onMobileToggle();
                    }
                  }}
                  className={`
                    flex items-center space-x-3 px-3 py-3 rounded-lg
                    transition-all duration-200 min-h-[44px]
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset
                    ${
                      active
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100 hover:translate-x-1'
                    }
                  `}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User profile section */}
          <div className="border-t border-gray-200 p-4" role="region" aria-label="User profile">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center" aria-hidden="true">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session?.user?.name || 'Admin'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session?.user?.email || ''}
                </p>
                {userRole && (
                  <p className="text-xs text-blue-600 font-medium mt-0.5">
                    {userRole}
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              variant="outline"
              className="w-full justify-start"
              size="sm"
              aria-label={isLoggingOut ? 'Logging out' : 'Logout from admin dashboard'}
            >
              <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
