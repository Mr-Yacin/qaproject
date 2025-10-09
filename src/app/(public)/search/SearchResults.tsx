'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { UnifiedTopic } from '@/types/api';
import { getTopics } from '@/lib/api/topics';
import SearchBar from '@/components/public/SearchBar';
import TopicCard from '@/components/public/TopicCard';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * SearchResults component that filters topics by search query
 * Features:
 * - Real-time search filtering
 * - Keyword highlighting in results
 * - Empty state handling
 * - Comprehensive error handling with retry mechanism
 * - Loading states
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */
export default function SearchResults() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [allTopics, setAllTopics] = useState<UnifiedTopic[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<UnifiedTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Filter topics based on search query
  const filterTopics = useCallback((topics: UnifiedTopic[], searchQuery: string) => {
    if (!searchQuery.trim()) {
      setFilteredTopics(topics);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const filtered = topics.filter((item) => {
      const titleMatch = item.topic.title.toLowerCase().includes(lowerQuery);
      const tagsMatch = item.topic.tags.some(tag => 
        tag.toLowerCase().includes(lowerQuery)
      );
      const questionMatch = item.primaryQuestion?.text.toLowerCase().includes(lowerQuery);
      const contentMatch = item.article?.content.toLowerCase().includes(lowerQuery);
      
      return titleMatch || tagsMatch || questionMatch || contentMatch;
    });

    setFilteredTopics(filtered);
  }, []);

  // Fetch all topics on mount
  useEffect(() => {
    async function fetchTopics() {
      try {
        setLoading(true);
        setError(null);
        
        console.log('[SearchResults] Fetching topics...', { 
          initialQuery, 
          retryCount,
          timestamp: new Date().toISOString() 
        });
        
        // Note: API limit is max 100, so we fetch the maximum allowed
        const data = await getTopics({ limit: 100 });
        
        console.log('[SearchResults] Topics fetched successfully', { 
          count: data.items.length,
          total: data.total,
          timestamp: new Date().toISOString()
        });
        
        setAllTopics(data.items);
        
        // Apply initial filter if query exists
        if (initialQuery) {
          filterTopics(data.items, initialQuery);
        } else {
          setFilteredTopics(data.items);
        }
        
        // Reset retry count on success
        setRetryCount(0);
      } catch (err) {
        // Comprehensive error logging
        console.error('[SearchResults] Failed to fetch topics:', {
          error: err instanceof Error ? err.message : 'Unknown error',
          errorType: err?.constructor?.name,
          stack: err instanceof Error ? err.stack : undefined,
          initialQuery,
          retryCount,
          timestamp: new Date().toISOString()
        });
        
        // Set user-friendly error message
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'Failed to fetch topics. Please try again later.';
        
        setError(errorMessage);
        
        // Graceful degradation: Set empty arrays to keep UI functional
        setAllTopics([]);
        setFilteredTopics([]);
      } finally {
        setLoading(false);
      }
    }

    fetchTopics();
  }, [initialQuery, retryCount, filterTopics]);

  // Handle search input changes
  const handleSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    filterTopics(allTopics, searchQuery);
  }, [allTopics, filterTopics]);

  // Highlight matching keywords in text
  const highlightKeywords = (text: string, keywords: string): JSX.Element => {
    if (!keywords.trim()) {
      return <>{text}</>;
    }

    const parts = text.split(new RegExp(`(${keywords})`, 'gi'));
    return (
      <>
        {parts.map((part, index) => 
          part.toLowerCase() === keywords.toLowerCase() ? (
            <mark key={index} className="bg-yellow-200 font-semibold">
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </>
    );
  };

  // Retry handler
  const handleRetry = useCallback(() => {
    console.log('[SearchResults] Retry button clicked', { 
      currentRetryCount: retryCount,
      timestamp: new Date().toISOString()
    });
    setRetryCount(prev => prev + 1);
  }, [retryCount]);

  if (error) {
    return (
      <div className="space-y-6">
        <SearchBar 
          placeholder="Search for topics..." 
          variant="page"
          onSearch={handleSearch}
        />
        
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-lg font-semibold text-red-900">
            Error Loading Topics
          </h3>
          <p className="mt-2 text-red-700">{error}</p>
          <button
            onClick={handleRetry}
            disabled={loading}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Retrying...' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <SearchBar 
        placeholder="Search for topics..." 
        variant="page"
        onSearch={handleSearch}
        loading={loading}
      />

      {/* Results Count */}
      {!loading && query && (
        <div className="text-sm text-gray-600">
          Found <span className="font-semibold">{filteredTopics.length}</span> result
          {filteredTopics.length !== 1 ? 's' : ''} for &quot;
          <span className="font-semibold">{query}</span>&quot;
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-lg bg-gray-200"
            />
          ))}
        </div>
      )}

      {/* Results Grid */}
      {!loading && filteredTopics.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTopics.map((item) => (
            <div key={item.topic.id}>
              <TopicCard topic={item} variant="default" />
              
              {/* Show snippet with highlighted keywords if query exists */}
              {query && item.article?.content && (
                <div className="mt-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                  <p className="line-clamp-2">
                    {highlightKeywords(
                      item.article.content.substring(0, 150) + '...',
                      query
                    )}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State - No Results */}
      {!loading && filteredTopics.length === 0 && query && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
          <div className="mx-auto max-w-md">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              No results found
            </h3>
            <p className="mt-2 text-gray-600">
              We couldn&apos;t find any topics matching &quot;{query}&quot;. Try
              searching with different keywords.
            </p>
          </div>
        </div>
      )}

      {/* Empty State - No Query */}
      {!loading && filteredTopics.length === 0 && !query && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
          <div className="mx-auto max-w-md">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              Start searching
            </h3>
            <p className="mt-2 text-gray-600">
              Enter a search term above to find topics, articles, and FAQs.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
