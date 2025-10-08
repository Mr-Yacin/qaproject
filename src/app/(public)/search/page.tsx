import { Metadata } from 'next';
import { Suspense } from 'react';
import SearchResults from './SearchResults';

export const metadata: Metadata = {
  title: 'Search Topics | Q&A CMS',
  description: 'Search through our collection of Q&A articles and topics',
};

/**
 * Search results page
 * Requirements: 9.1, 9.2, 9.3
 */
export default function SearchPage() {
  return (
    <div className="py-12 md:py-16 lg:py-20">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Search Topics</h1>
        <p className="mt-2 text-lg text-gray-600">
          Find answers to your questions by searching our topics
        </p>
      </div>

      <Suspense fallback={<SearchResultsSkeleton />}>
        <SearchResults />
      </Suspense>
    </div>
  );
}

/**
 * Loading skeleton for search results
 */
function SearchResultsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-12 w-full animate-pulse rounded-lg bg-gray-200" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-lg bg-gray-200"
          />
        ))}
      </div>
    </div>
  );
}
