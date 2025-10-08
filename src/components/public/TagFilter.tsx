'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

interface TagFilterProps {
  availableTags: string[];
}

/**
 * TagFilter component for filtering topics by tags
 * Requirements: 1.2, 9.5
 */
export default function TagFilter({ availableTags }: TagFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedTag, setSelectedTag] = useState<string>(searchParams.get('tag') || '');

  useEffect(() => {
    setSelectedTag(searchParams.get('tag') || '');
  }, [searchParams]);

  const handleTagChange = (tag: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (tag) {
      params.set('tag', tag);
    } else {
      params.delete('tag');
    }
    
    // Reset to page 1 when filter changes
    params.delete('page');
    
    const queryString = params.toString();
    router.push(`/topics${queryString ? `?${queryString}` : ''}`);
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="tag-filter" className="text-sm font-medium text-gray-700">
        Filter by Tag
      </label>
      <select
        id="tag-filter"
        value={selectedTag}
        onChange={(e) => handleTagChange(e.target.value)}
        className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        <option value="">All Tags</option>
        {availableTags.map((tag) => (
          <option key={tag} value={tag}>
            {tag}
          </option>
        ))}
      </select>
    </div>
  );
}
