import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { UserService } from '@/lib/services/user.service';
import { UserList } from '@/components/admin/users/UserList';
import { UserRole } from '@prisma/client';
import { ClientAuthCheck } from '@/components/admin/ClientAuthCheck';

/**
 * Users Management Page
 * Displays list of all users with create, edit, and delete actions
 * Requires ADMIN role
 * Requirements: 7.1, 7.2, 7.8
 */
export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/admin/login');
  }

  const userService = new UserService();
  const currentUser = await userService.getUserById(session.user.id);

  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    redirect('/admin');
  }

  const users = await userService.listUsers();

  // Remove passwords from users and serialize dates
  const sanitizedUsers = users.map(({ password, ...user }) => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }));

  return (
    <ClientAuthCheck requiredRole={UserRole.ADMIN}>
      <div className="container mx-auto py-8">
        <UserList initialUsers={sanitizedUsers} currentUserId={currentUser.id} />
      </div>
    </ClientAuthCheck>
  );
}
