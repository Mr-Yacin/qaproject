import { MetadataRoute } from 'next';

/**
 * Generates robots.txt for search engine crawlers
 * Defines crawling rules and sitemap location
 * Requirements: 2.8
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',      // Block admin dashboard
          '/api/',        // Block API routes
          '/admin/*',     // Block all admin routes
          '/api/*',       // Block all API routes
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
