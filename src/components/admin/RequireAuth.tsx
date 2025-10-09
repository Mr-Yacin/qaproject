import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { ReactNode } from 'react';

interface RequireAuthProps {
  children: ReactNode;
}

export async function RequireAuth({ children }: RequireAuthProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    console.log('[RequireAuth] No session found, redirecting to login');
    redirect('/admin/login');
  }

  return <>{children}</>;
}
