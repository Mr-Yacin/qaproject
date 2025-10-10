import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import { FooterService } from '@/lib/services/footer.service';
import { Facebook, Twitter, Linkedin, Instagram, Github, Youtube } from 'lucide-react';

/**
 * Dynamic Footer Component
 * Fetches footer configuration from database with caching
 * Requirements: 5.1, 5.4, 5.5, 5.7
 */

// Cached footer data fetcher
const getFooterConfig = unstable_cache(
  async () => {
    const footerService = new FooterService();
    return footerService.getFooterConfig();
  },
  ['footer-config'],
  {
    tags: ['footer'],
    revalidate: 3600, // Revalidate every hour
  }
);

export default async function Footer() {
  const currentYear = new Date().getFullYear();
  
  // Fetch footer configuration from database with caching
  let footerConfig = null;
  try {
    footerConfig = await getFooterConfig();
  } catch (error) {
    console.error('Failed to fetch footer configuration:', error);
    // Continue with empty footer if fetch fails
  }

  const { settings, columns } = footerConfig || { settings: null, columns: [] };

  // Map social media platform names to icons
  const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    facebook: Facebook,
    twitter: Twitter,
    linkedin: Linkedin,
    instagram: Instagram,
    github: Github,
    youtube: Youtube,
  };

  // Parse social links from settings
  const socialLinks = settings?.socialLinks as Record<string, string> | null;

  return (
    <footer className="border-t border-gray-200 bg-white" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Footer links */}
        {columns.length > 0 && (
          <nav 
            className={`grid gap-8 lg:gap-12 ${
              columns.length === 1 ? 'grid-cols-1' :
              columns.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
              columns.length === 3 ? 'grid-cols-2 md:grid-cols-3' :
              'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
            }`}
            aria-label="Footer navigation"
          >
            {columns.map((column) => (
              <div key={column.id}>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
                  {column.title}
                </h3>
                {column.links.length > 0 && (
                  <ul className="mt-4 space-y-3" role="list">
                    {column.links.map((link) => (
                      <li key={link.id}>
                        <Link
                          href={link.url}
                          className="inline-block text-sm text-gray-600 transition-colors hover:text-primary-600 py-1 min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </nav>
        )}

        {/* Social media links and copyright */}
        <div className="mt-8 border-t border-gray-200 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            {/* Copyright */}
            <p className="text-sm text-gray-600">
              {settings?.copyrightText || `© ${currentYear} Q&A CMS. All rights reserved.`}
            </p>

            {/* Social media icons */}
            {socialLinks && Object.keys(socialLinks).length > 0 && (
              <div className="flex gap-4" role="list" aria-label="Social media links">
                {Object.entries(socialLinks).map(([platform, url]) => {
                  const IconComponent = socialIcons[platform.toLowerCase()];
                  if (!IconComponent) return null;

                  return (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 transition-colors hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded p-1"
                      aria-label={`Visit our ${platform} page`}
                    >
                      <IconComponent className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
