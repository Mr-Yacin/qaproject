'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

interface LocaleFilterProps {
  availableLocales: string[];
}

/**
 * LocaleFilter component for filtering topics by locale
 * Requirements: 1.2, 9.5
 */
export default function LocaleFilter({ availableLocales }: LocaleFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedLocale, setSelectedLocale] = useState<string>(searchParams.get('locale') || '');

  useEffect(() => {
    setSelectedLocale(searchParams.get('locale') || '');
  }, [searchParams]);

  const handleLocaleChange = (locale: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (locale) {
      params.set('locale', locale);
    } else {
      params.delete('locale');
    }
    
    // Reset to page 1 when filter changes
    params.delete('page');
    
    const queryString = params.toString();
    router.push(`/topics${queryString ? `?${queryString}` : ''}`);
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="locale-filter" className="text-sm font-medium text-gray-700">
        Filter by Locale
      </label>
      <select
        id="locale-filter"
        value={selectedLocale}
        onChange={(e) => handleLocaleChange(e.target.value)}
        className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        <option value="">All Locales</option>
        {availableLocales.map((locale) => (
          <option key={locale} value={locale}>
            {locale.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}
