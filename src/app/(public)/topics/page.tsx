import { Metadata } from 'next';
import { getTopics } from '@/lib/api/topics';
import { generateTopicsListMetadata } from '@/lib/utils/seo';
import TopicCard from '@/components/public/TopicCard';
import Link from 'next/link';
import TagFilter from '@/components/public/TagFilter';
import LocaleFilter from '@/components/public/LocaleFilter';
import { Suspense } from 'react';

// Generate metadata for SEO
export const metadata: Metadata = generateTopicsListMetadata();

// Mark as dynamic since we use searchParams
export const dynamic = 'force-dynamic';

interface TopicsPageProps {
  searchParams: {
    page?: string;
    locale?: string;
    tag?: string;
  };
}

/**
 * Topics listing page with pagination and filtering
 * Requirements: 1.2, 7.1, 7.2, 7.3, 9.5, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */
export default async function TopicsPage({ searchParams }: TopicsPageProps) {
  try {
    const currentPage = parseInt(searchParams.page || '1', 10);
    const locale = searchParams.locale;
    const tag = searchParams.tag;
    
    // Fetch topics with filters - with error handling fallback
    const topicsData = await getTopics({
      page: currentPage,
      limit: 12,
      locale,
      tag,
    }).catch((error) => {
      console.error('[TopicsPage] Failed to fetch topics:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        params: { page: currentPage, limit: 12, locale, tag }
      });
      // Return empty data structure as fallback
      return {
        items: [],
        total: 0,
        totalPages: 0,
        page: currentPage,
        limit: 12,
      };
    });

    const { items, total, totalPages } = topicsData;

    // Fetch all topics to get available filters (without pagination) - with error handling fallback
    // Note: API limit is max 100, so we fetch the maximum allowed
    const allTopicsData = await getTopics({ limit: 100 }).catch((error) => {
      console.error('[TopicsPage] Failed to fetch filter data:', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Return empty data structure as fallback
      return {
        items: [],
        total: 0,
        totalPages: 0,
        page: 1,
        limit: 100,
      };
    });
    
    // Extract unique tags and locales
    const allTags = new Set<string>();
    const allLocales = new Set<string>();
    
    allTopicsData.items.forEach((item) => {
      item.topic.tags.forEach((t) => allTags.add(t));
      allLocales.add(item.topic.locale);
    });
    
    const availableTags = Array.from(allTags).sort();
    const availableLocales = Array.from(allLocales).sort();

  return (
    <div className="py-12 md:py-16 lg:py-20">
      {/* Page Header */}
      <div className="mb-8 md:mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          All Topics
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Browse our collection of {total} {total === 1 ? 'topic' : 'topics'}
        </p>
      </div>

      {/* Filter Controls */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<div className="h-[74px] animate-pulse bg-gray-100 rounded-md" />}>
          <LocaleFilter availableLocales={availableLocales} />
        </Suspense>
        <Suspense fallback={<div className="h-[74px] animate-pulse bg-gray-100 rounded-md" />}>
          <TagFilter availableTags={availableTags} />
        </Suspense>
      </div>

      {/* Active Filters Display */}
      {(locale || tag) && (
        <div className="mb-6 flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-600">Active filters:</span>
          {locale && (
            <Link
              href={`/topics?${new URLSearchParams({ 
                ...(tag && { tag }),
                ...(searchParams.page && { page: searchParams.page })
              }).toString()}`}
              className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-200 transition-colors min-h-[44px]"
            >
              Locale: {locale.toUpperCase()}
              <span className="text-primary-900">×</span>
            </Link>
          )}
          {tag && (
            <Link
              href={`/topics?${new URLSearchParams({ 
                ...(locale && { locale }),
                ...(searchParams.page && { page: searchParams.page })
              }).toString()}`}
              className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-200 transition-colors min-h-[44px]"
            >
              Tag: {tag}
              <span className="text-primary-900">×</span>
            </Link>
          )}
          <Link
            href="/topics"
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear all
          </Link>
        </div>
      )}

      {/* Topics Grid */}
      {items.length > 0 ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <TopicCard key={item.topic.id} topic={item} variant="default" />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              {/* Previous Button */}
              {currentPage > 1 ? (
                <Link
                  href={`/topics?${new URLSearchParams({ 
                    page: (currentPage - 1).toString(),
                    ...(locale && { locale }),
                    ...(tag && { tag })
                  }).toString()}`}
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px]"
                >
                  ← Previous
                </Link>
              ) : (
                <span className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed min-h-[44px]">
                  ← Previous
                </span>
              )}

              {/* Page Numbers */}
              <div className="hidden sm:flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  // Show first page, last page, current page, and pages around current
                  const showPage = 
                    pageNum === 1 || 
                    pageNum === totalPages || 
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);
                  
                  const showEllipsis = 
                    (pageNum === 2 && currentPage > 3) ||
                    (pageNum === totalPages - 1 && currentPage < totalPages - 2);

                  if (showEllipsis) {
                    return (
                      <span key={pageNum} className="px-2 py-2 text-gray-500">
                        ...
                      </span>
                    );
                  }

                  if (!showPage) {
                    return null;
                  }

                  return pageNum === currentPage ? (
                    <span
                      key={pageNum}
                      className="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white min-h-[44px] min-w-[44px]"
                    >
                      {pageNum}
                    </span>
                  ) : (
                    <Link
                      key={pageNum}
                      href={`/topics?${new URLSearchParams({ 
                        page: pageNum.toString(),
                        ...(locale && { locale }),
                        ...(tag && { tag })
                      }).toString()}`}
                      className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px] min-w-[44px]"
                    >
                      {pageNum}
                    </Link>
                  );
                })}
              </div>

              {/* Mobile Page Indicator */}
              <div className="sm:hidden px-4 py-2 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>

              {/* Next Button */}
              {currentPage < totalPages ? (
                <Link
                  href={`/topics?${new URLSearchParams({ 
                    page: (currentPage + 1).toString(),
                    ...(locale && { locale }),
                    ...(tag && { tag })
                  }).toString()}`}
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px]"
                >
                  Next →
                </Link>
              ) : (
                <span className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed min-h-[44px]">
                  Next →
                </span>
              )}
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {locale || tag 
              ? 'No topics found matching your filters. Try adjusting your search criteria.'
              : 'No topics available yet.'}
          </p>
          {(locale || tag) && (
            <Link
              href="/topics"
              className="mt-4 inline-block text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear filters
            </Link>
          )}
        </div>
      )}
    </div>
    );
  } catch (error) {
    // Log the error for debugging
    console.error('[TopicsPage] Unexpected error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      searchParams,
    });
    
    // Re-throw to be caught by error boundary
    throw error;
  }
}
