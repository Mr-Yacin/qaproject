import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return <AdminLayoutClient session={session}>{children}</AdminLayoutClient>;
}
