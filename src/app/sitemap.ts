import { MetadataRoute } from 'next';
import { getTopics } from '@/lib/api/topics';

// Force dynamic rendering (no static generation at build time)
export const dynamic = 'force-dynamic';

/**
 * Generates sitemap.xml for search engine crawlers
 * Includes homepage, topics listing, and all published topic pages
 * Requirements: 2.7
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  try {
    // Fetch topics directly from database during build
    const { ContentRepository } = await import('@/lib/repositories/content.repository');
    const { ContentService } = await import('@/lib/services/content.service');
    
    const repository = new ContentRepository();
    const contentService = new ContentService(repository);
    const topicsData = await contentService.listTopics({ limit: 10000, page: 1 });
    
    // Generate sitemap entries for all topics
    const topicEntries: MetadataRoute.Sitemap = topicsData.items
      .filter(item => item.article?.status === 'PUBLISHED') // Only include published topics
      .map(item => ({
        url: `${baseUrl}/topics/${item.topic.slug}`,
        lastModified: new Date(item.topic.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    
    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1.0,
      },
      {
        url: `${baseUrl}/topics`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
      },
    ];
    
    return [...staticPages, ...topicEntries];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Return at least the static pages if topic fetching fails
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1.0,
      },
      {
        url: `${baseUrl}/topics`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
      },
    ];
  }
}
