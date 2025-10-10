import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { FooterBuilder } from '@/components/admin/footer/FooterBuilder';
import { prisma } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Footer Management - Admin',
  description: 'Manage footer configuration',
};

/**
 * Fetch footer configuration from database
 * Requirements: 5.1, 5.7
 */
async function getFooterConfig() {
  const [settings, columns] = await Promise.all([
    prisma.footerSettings.findFirst(),
    prisma.footerColumn.findMany({
      include: {
        links: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    }),
  ]);

  return {
    settings: settings ? {
      ...settings,
      socialLinks: settings.socialLinks as Record<string, string> | null,
    } : null,
    columns,
  };
}

/**
 * Admin Footer Management Page
 * Allows administrators to configure footer settings, columns, and links
 * Requirements: 5.1, 5.2, 5.3, 5.6, 5.7
 */
export default async function FooterPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/admin/login');
  }

  // Check if user has ADMIN or EDITOR role
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { role: true },
  });

  if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
    redirect('/admin');
  }

  const config = await getFooterConfig();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Footer Management</h1>
        <p className="text-muted-foreground mt-2">
          Configure footer settings, columns, and links
        </p>
      </div>

      <FooterBuilder initialConfig={config} />
    </div>
  );
}
