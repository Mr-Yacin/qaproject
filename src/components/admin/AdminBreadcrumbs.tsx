'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

export default function AdminBreadcrumbs() {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    
    // Remove 'admin' from the start if present
    if (paths[0] === 'admin') {
      paths.shift();
    }

    const breadcrumbs = [
      { label: 'Dashboard', href: '/admin' },
    ];

    let currentPath = '/admin';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      
      // Format the label (capitalize and replace hyphens with spaces)
      const label = path
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      breadcrumbs.push({
        label,
        href: currentPath,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumbs on the dashboard itself
  if (pathname === '/admin') {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center space-x-2 text-sm">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isFirst = index === 0;

          return (
            <li key={crumb.href} className="flex items-center">
              {index > 0 && (
                <ChevronRight
                  className="w-4 h-4 text-gray-400 mx-2"
                  aria-hidden="true"
                />
              )}
              {isLast ? (
                <span className="text-gray-900 font-medium" aria-current="page">
                  {isFirst && <Home className="w-4 h-4 inline mr-1" aria-hidden="true" />}
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-gray-600 hover:text-gray-900 transition-colors flex items-center"
                >
                  {isFirst && <Home className="w-4 h-4 inline mr-1" aria-hidden="true" />}
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
