'use client';

import { SessionProvider } from 'next-auth/react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Always wrap in SessionProvider so useSession works everywhere
  return <SessionProvider>{children}</SessionProvider>;
}
