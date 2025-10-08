'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { UnifiedTopic } from '@/types/api';
import { getTopics } from '@/lib/api/topics';
import SearchBar from '@/components/public/SearchBar';
import TopicCard from '@/components/public/TopicCard';
import { AlertCircle } from 'lucide-react';

/**
 * SearchResults component that filters topics by search query
 * Features:
 * - Real-time search filtering
 * - Keyword highlighting in results
 * - Empty state handling
 * - Error handling
 * Requirements: 9.1, 9.2, 9.3
 */
export default function SearchResults() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [allTopics, setAllTopics] = useState<UnifiedTopic[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<UnifiedTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all topics on mount
  useEffect(() => {
    async function fetchTopics() {
      try {
        setLoading(true);
        setError(null);
        const data = await getTopics({ limit: 1000 }); // Fetch all topics
        setAllTopics(data.items);
        
        // Apply initial filter if query exists
        if (initialQuery) {
          filterTopics(data.items, initialQuery);
        } else {
          setFilteredTopics(data.items);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch topics');
      } finally {
        setLoading(false);
      }
    }

    fetchTopics();
  }, [initialQuery]);

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
