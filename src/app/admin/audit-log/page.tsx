import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { AuditService } from '@/lib/services/audit.service';
import { AuditLogTable } from '@/components/admin/audit/AuditLogTable';

export const metadata: Metadata = {
  title: 'Audit Log - Admin',
  description: 'View and export admin activity logs',
};

/**
 * Audit Log Page
 * Displays audit logs with filtering and export functionality
 * Requirements: 8.1, 8.3, 8.4, 8.6, 8.8
 */
export default async function AuditLogPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/admin/login');
  }

  // Check if user is an admin
  const userRole = (session.user as any).role;
  if (userRole !== UserRole.ADMIN) {
    redirect('/admin');
  }

  // Fetch initial audit logs
  const auditService = new AuditService();
  const { logs, total, hasMore } = await auditService.getAuditLogs({
    limit: 50,
    offset: 0,
  });

  // Serialize dates for client component
  const serializedLogs = logs.map((log: any) => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
    user: {
      ...log.user,
      createdAt: log.user.createdAt?.toISOString(),
      updatedAt: log.user.updatedAt?.toISOString(),
    },
  }));

  return (
    <AuditLogTable
      initialLogs={serializedLogs}
      initialTotal={total}
      initialHasMore={hasMore}
    />
  );
}
