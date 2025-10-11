import { Metadata } from 'next';
import { UnifiedTopic } from '@/types/api';

/**
 * Helper function to safely convert a date to ISO string
 * Handles both Date objects and ISO string dates from API
 */
function toISOString(date: Date | string): string {
    if (typeof date === 'string') {
        return date;
    }
    return date.toISOString();
}

/**
 * Generates comprehensive metadata for topic pages including Open Graph and Twitter cards
 * @param data - Unified topic data from the API
 * @param baseUrl - Base URL of the site (defaults to NEXT_PUBLIC_SITE_URL or localhost)
 * @returns Next.js Metadata object with SEO tags
 * Requirements: 2.1, 2.4, 2.5, 2.6
 */
export function generateTopicMetadata(
    data: UnifiedTopic,
    baseUrl?: string
): Metadata {
    const { topic, primaryQuestion, article } = data;

    // Use environment variable or fallback to localhost
    const siteUrl = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const url = `${siteUrl}/topics/${topic.slug}`;

    // Generate title
    const title = `${topic.title} | Q&A CMS`;

    // Generate description from article content or primary question
    let description = '';
    if (article?.content) {
        // Strip HTML tags and limit to 160 characters
        description = article.content
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 160);

        // Add ellipsis if truncated
        if (article.content.length > 160) {
            description += '...';
        }
    } else if (primaryQuestion?.text) {
        description = primaryQuestion.text.substring(0, 160);
    } else {
        description = topic.title;
    }

    // Generate keywords from tags
    const keywords = topic.tags.join(', ');

    return {
        title,
        description,
        keywords,
        authors: [{ name: 'Q&A CMS' }],

        // Open Graph tags for social media sharing
        openGraph: {
            title,
            description,
            url,
            siteName: 'Q&A CMS',
            type: 'article',
            locale: topic.locale,
            publishedTime: toISOString(topic.createdAt),
            modifiedTime: toISOString(topic.updatedAt),
            tags: topic.tags,
        },

        // Twitter Card tags
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            creator: '@qacms',
            site: '@qacms',
        },

        // Canonical URL to prevent duplicate content issues
        alternates: {
            canonical: url,
        },

        // Additional meta tags
        other: {
            'article:published_time': toISOString(topic.createdAt),
            'article:modified_time': toISOString(topic.updatedAt),
            'article:tag': topic.tags.join(','),
        },
    };
}

/**
 * Generates metadata for the homepage
 * @param baseUrl - Base URL of the site
 * @returns Next.js Metadata object
 */
export function generateHomeMetadata(baseUrl?: string): Metadata {
    const siteUrl = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    return {
        title: 'Q&A CMS - Your Knowledge Base',
        description: 'Browse our comprehensive collection of Q&A articles and find answers to your questions.',
        keywords: 'Q&A, knowledge base, articles, FAQ',

        openGraph: {
            title: 'Q&A CMS - Your Knowledge Base',
            description: 'Browse our comprehensive collection of Q&A articles and find answers to your questions.',
            url: siteUrl,
            siteName: 'Q&A CMS',
            type: 'website',
        },

        twitter: {
            card: 'summary_large_image',
            title: 'Q&A CMS - Your Knowledge Base',
            description: 'Browse our comprehensive collection of Q&A articles and find answers to your questions.',
        },

        alternates: {
            canonical: siteUrl,
        },
    };
}

/**
 * Generates metadata for the topics listing page
 * @param baseUrl - Base URL of the site
 * @returns Next.js Metadata object
 */
export function generateTopicsListMetadata(baseUrl?: string): Metadata {
    const siteUrl = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const url = `${siteUrl}/topics`;

    return {
        title: 'All Topics | Q&A CMS',
        description: 'Explore all available topics and articles in our knowledge base.',
        keywords: 'topics, articles, knowledge base, Q&A',

        openGraph: {
            title: 'All Topics | Q&A CMS',
            description: 'Explore all available topics and articles in our knowledge base.',
            url,
            siteName: 'Q&A CMS',
            type: 'website',
        },

        twitter: {
            card: 'summary',
            title: 'All Topics | Q&A CMS',
            description: 'Explore all available topics and articles in our knowledge base.',
        },

        alternates: {
            canonical: url,
        },
    };
}

/**
 * Generates Article schema (JSON-LD) for topic pages
 * @param data - Unified topic data from the API
 * @param baseUrl - Base URL of the site
 * @returns JSON-LD Article schema object
 * Requirements: 2.3
 */
export function generateArticleSchema(
    data: UnifiedTopic,
    baseUrl?: string
): object {
    const { topic, primaryQuestion, article } = data;
    const siteUrl = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const url = `${siteUrl}/topics/${topic.slug}`;

    // Generate description from article content
    let description = '';
    if (article?.content) {
        description = article.content
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 200);
    }

    return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: topic.title,
        description: description || topic.title,
        url,
        datePublished: toISOString(topic.createdAt),
        dateModified: toISOString(topic.updatedAt),
        author: {
            '@type': 'Organization',
            name: 'Q&A CMS',
        },
        publisher: {
            '@type': 'Organization',
            name: 'Q&A CMS',
            logo: {
                '@type': 'ImageObject',
                url: `${siteUrl}/logo.png`,
            },
        },
        mainEntity: primaryQuestion ? {
            '@type': 'Question',
            name: primaryQuestion.text,
            acceptedAnswer: {
                '@type': 'Answer',
                text: article?.content?.replace(/<[^>]*>/g, '') || '',
            },
        } : undefined,
        keywords: topic.tags.join(', '),
        inLanguage: topic.locale,
    };
}

/**
 * Generates FAQPage schema (JSON-LD) for FAQ items
 * @param faqItems - Array of FAQ items
 * @param baseUrl - Base URL of the site
 * @returns JSON-LD FAQPage schema object
 * Requirements: 2.3
 */
export function generateFAQSchema(
    faqItems: Array<{ question: string; answer: string; order: number }>,
    baseUrl?: string
): object | null {
    // Only generate FAQ schema if there are FAQ items
    if (!faqItems || faqItems.length === 0) {
        return null;
    }

    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems
            .sort((a, b) => a.order - b.order)
            .map((item) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: item.answer,
                },
            })),
    };
}

/**
 * Generates BreadcrumbList schema (JSON-LD) for navigation
 * @param items - Array of breadcrumb items with name and url
 * @returns JSON-LD BreadcrumbList schema object
 */
export function generateBreadcrumbSchema(
    items: Array<{ name: string; url: string }>
): object {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };
}

/**
 * Generates WebSite schema (JSON-LD) for the homepage
 * @param baseUrl - Base URL of the site
 * @param siteName - Site name from settings
 * @param description - Site description from settings
 * @returns JSON-LD WebSite schema object
 */
export function generateWebSiteSchema(
    baseUrl?: string,
    siteName?: string,
    description?: string
): object {
    const siteUrl = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: siteName || 'Q&A CMS',
        url: siteUrl,
        description: description || 'Your comprehensive knowledge base for Q&A articles',
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${siteUrl}/search?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    };
}
