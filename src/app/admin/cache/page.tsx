import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { UserService } from '@/lib/services/user.service';
import { UserRole } from '@prisma/client';
import { CacheManagement } from '@/components/admin/cache/CacheManagement';

/**
 * Cache Management Page
 * Displays cache statistics and controls
 * Requires ADMIN role
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.8
 */
export default async function CachePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/admin/login');
  }

  const userService = new UserService();
  const currentUser = await userService.getUserById(session.user.id);

  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    redirect('/admin');
  }

  return (
    <div className="container mx-auto py-8">
      <CacheManagement />
    </div>
  );
}
