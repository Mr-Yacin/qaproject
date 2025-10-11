import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { MenuBuilder } from '@/components/admin/menus/MenuBuilder';
import { MenuService } from '@/lib/services/menu.service';
import { ClientAuthCheck } from '@/components/admin/ClientAuthCheck';

/**
 * Admin Menu Management Page
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.6
 */
export default async function MenusPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/admin/login');
  }

  const menuService = new MenuService();
  const menuItems = await menuService.getMenuStructure();

  return (
    <ClientAuthCheck>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your site navigation menu
          </p>
        </div>

        <MenuBuilder initialMenuItems={menuItems} />
      </div>
    </ClientAuthCheck>
  );
}
