'use client';

import { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  placeholder?: string;
  variant?: 'header' | 'page';
  className?: string;
}

/**
 * SearchBar component for searching topics
 * Requirements: 9.1, 9.2
 */
export default function SearchBar({ 
  placeholder = 'Search topics...', 
  variant = 'page',
  className = ''
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }, [query, router]);

  const handleClear = useCallback(() => {
    setQuery('');
  }, []);

  const variantStyles = {
    header: 'max-w-md',
    page: 'max-w-2xl'
  };

  return (
    <form 
      onSubmit={handleSearch}
      className={`relative w-full ${variantStyles[variant]} ${className}`}
    >
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="block w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-10 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm"
          aria-label="Search topics"
        />
        
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 hover:text-gray-700"
            aria-label="Clear search"
          >
            <X className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </button>
        )}
      </div>
    </form>
  );
}
