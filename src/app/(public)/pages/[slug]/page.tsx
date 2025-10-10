import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { CustomPage } from '@/components/public/CustomPage';

interface PageProps {
  params: { slug: string };
}

/**
 * Generate metadata for the page
 * Requirements: 3.5
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = await prisma.page.findUnique({
    where: {
      slug: params.slug,
      status: 'PUBLISHED', // Only show published pages
    },
  });

  if (!page) {
    return {
      title: 'Page Not Found',
    };
  }

  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || undefined,
    keywords: page.seoKeywords.length > 0 ? page.seoKeywords : undefined,
  };
}

/**
 * Custom Page Route
 * Renders a custom page by slug
 * Requirements: 3.3, 3.5, 3.6, 3.9
 */
export default async function Page({ params }: PageProps) {
  // Fetch the page from database
  const page = await prisma.page.findUnique({
    where: {
      slug: params.slug,
      status: 'PUBLISHED', // Only show published pages
    },
    select: {
      title: true,
      content: true,
      seoTitle: true,
      seoDescription: true,
      seoKeywords: true,
    },
  });

  // Return 404 if page not found or not published
  if (!page) {
    notFound();
  }

  return <CustomPage page={page} />;
}

/**
 * Enable static generation for published pages
 */
export async function generateStaticParams() {
  const pages = await prisma.page.findMany({
    where: {
      status: 'PUBLISHED',
    },
    select: {
      slug: true,
    },
  });

  return pages.map((page) => ({
    slug: page.slug,
  }));
}

/**
 * Revalidate every hour
 */
export const revalidate = 3600;
