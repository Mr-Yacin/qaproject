import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // If user is already logged in, redirect to admin dashboard
  const session = await getServerSession(authOptions);
  
  if (session) {
    console.log('[Login Layout] User already authenticated, redirecting to admin');
    redirect('/admin');
  }

  // Login page doesn't need the admin layout
  return <>{children}</>;
}
