'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  placeholder?: string;
  variant?: 'header' | 'page';
  className?: string;
  onSearch?: (query: string) => void;
  loading?: boolean;
}

/**
 * SearchBar component for searching topics with debounced onChange
 * Features:
 * - Debounced search input (300ms delay)
 * - Clear button
 * - Loading state
 * - Keyboard shortcut (Cmd+K / Ctrl+K) to focus search
 * Requirements: 9.1, 9.2
 */
export default function SearchBar({ 
  placeholder = 'Search topics...', 
  variant = 'page',
  className = '',
  onSearch,
  loading = false
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Keyboard shortcut (Cmd+K / Ctrl+K) to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced onChange handler
  const handleInputChange = useCallback((value: string) => {
    setQuery(value);
    
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for debounced search
    if (value.trim()) {
      setIsSearching(true);
      debounceTimerRef.current = setTimeout(() => {
        if (onSearch) {
          onSearch(value.trim());
        }
        setIsSearching(false);
      }, 300);
    } else {
      setIsSearching(false);
    }
  }, [onSearch]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }, [query, router]);

  const handleClear = useCallback(() => {
    setQuery('');
    setIsSearching(false);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (onSearch) {
      onSearch('');
    }
    inputRef.current?.focus();
  }, [onSearch]);

  const variantStyles = {
    header: 'max-w-md',
    page: 'max-w-2xl'
  };

  const showLoading = loading || isSearching;

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
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          className="block w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-20 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm"
          aria-label="Search topics"
          aria-describedby="search-shortcut"
        />
        
        {/* Keyboard shortcut hint */}
        {!query && !showLoading && (
          <div 
            id="search-shortcut"
            className="pointer-events-none absolute inset-y-0 right-0 hidden items-center pr-3 sm:flex"
          >
            <kbd className="rounded border border-gray-300 bg-gray-50 px-2 py-1 text-xs text-gray-500">
              {typeof navigator !== 'undefined' && navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}K
            </kbd>
          </div>
        )}
        
        {/* Loading indicator */}
        {showLoading && (
          <div className="absolute inset-y-0 right-10 flex items-center pr-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary-500" aria-hidden="true" />
            <span className="sr-only">Searching...</span>
          </div>
        )}
        
        {/* Clear button */}
        {query && !showLoading && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </form>
  );
}
