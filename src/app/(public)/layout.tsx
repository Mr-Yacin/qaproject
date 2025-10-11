import Header from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import { SkipLink } from '@/components/ui/skip-link';
import { MenuService } from '@/lib/services/menu.service';
import { SettingsService } from '@/lib/services/settings.service';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { unstable_cache } from 'next/cache';

/**
 * Cached menu fetcher
 */
const getCachedMenu = unstable_cache(
  async () => {
    const menuService = new MenuService();
    return menuService.getMenuStructure();
  },
  ['menu-structure'],
  {
    tags: ['menu'],
    revalidate: 3600, // Revalidate every hour
  }
);

/**
 * Cached settings fetcher
 */
const getCachedSettings = unstable_cache(
  async () => {
    const settingsService = new SettingsService();
    return settingsService.getSettings();
  },
  ['site-settings-public'],
  {
    tags: ['settings'],
    revalidate: 3600, // Revalidate every hour
  }
);

/**
 * Public Layout
 * Fetches menu items and settings from database with caching
 * Provides settings via context to all child components
 * Requirements: 2.3, 2.4, 4.1, 4.8, 5.1, 5.8
 */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch menu items from database with caching
  let menuItems: any[] = [];
  try {
    menuItems = await getCachedMenu();
  } catch (error) {
    console.error('Failed to fetch menu items:', error);
    // Continue with empty menu if fetch fails
  }

  // Fetch site settings from database with caching
  let settings = null;
  try {
    settings = await getCachedSettings();
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    // Continue with null settings if fetch fails
  }

  return (
    <SettingsProvider settings={settings}>
      <div className="flex min-h-screen flex-col">
        <SkipLink />
        <Header menuItems={menuItems} settings={settings} />
        <main id="main-content" className="flex-1" tabIndex={-1}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </SettingsProvider>
  );
}
