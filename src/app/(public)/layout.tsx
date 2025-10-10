import Header from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import { SkipLink } from '@/components/ui/skip-link';
import { MenuService } from '@/lib/services/menu.service';

/**
 * Public Layout
 * Fetches menu items from database and passes to Header
 * Footer component fetches its own data
 * Requirements: 4.1, 4.8, 5.1, 5.8
 */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch menu items from database
  let menuItems: any[] = [];
  try {
    const menuService = new MenuService();
    menuItems = await menuService.getMenuStructure();
  } catch (error) {
    console.error('Failed to fetch menu items:', error);
    // Continue with empty menu if fetch fails
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <Header menuItems={menuItems} />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
