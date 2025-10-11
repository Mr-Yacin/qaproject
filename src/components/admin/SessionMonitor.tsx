'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * SessionMonitor - Monitors session changes and redirects when session is lost
 * 
 * This component runs in the background and listens for session changes.
 * When a user logs out from another tab, this will detect the session loss
 * and redirect to the login page.
 */
export function SessionMonitor() {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only redirect if we're on an admin page (not login) and session becomes unauthenticated
    if (status === 'unauthenticated' && pathname.startsWith('/admin') && pathname !== '/admin/login') {
      console.log('[SessionMonitor] Session lost, redirecting to login');
      router.push(`/admin/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  // This component doesn't render anything
  return null;
}