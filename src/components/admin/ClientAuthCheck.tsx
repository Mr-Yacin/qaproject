'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { UserRole } from '@prisma/client';
import { AccessDenied } from '@/components/admin/AccessDenied';

/**
 * ClientAuthCheck - Pure authentication guard component
 * 
 * This component handles client-side authentication checking and redirects.
 * It does NOT render any layout components (sidebar, header, etc.).
 * Layout rendering is handled by AdminLayoutClient.
 * 
 * @param children - Content to render when authenticated
 * @param requiredRole - Optional role requirement for access control
 */
interface ClientAuthCheckProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export function ClientAuthCheck({ children, requiredRole }: ClientAuthCheckProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      console.log('[ClientAuthCheck] No session, redirecting to login');
      router.push(`/admin/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  // Show loading state during authentication check
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  // Return null while redirecting
  if (status === 'unauthenticated') {
    return null;
  }

  // Check role-based access if required
  if (requiredRole && session?.user?.role !== requiredRole) {
    console.log(`[ClientAuthCheck] Access denied. Required role: ${requiredRole}, User role: ${session?.user?.role}`);
    return <AccessDenied />;
  }

  // Return children directly - layout is handled by AdminLayoutClient
  return <>{children}</>;
}
