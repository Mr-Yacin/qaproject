'use client';

import dynamic from 'next/dynamic';
import { ComponentProps } from 'react';
import { FAQManager } from './FAQManager';

/**
 * Lazy-loaded FAQManager component with code splitting
 * Requirements: 10.3, 10.4, 10.6
 */

// Loading component
const LoadingFAQManager = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold">FAQ Items</h3>
      <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
    </div>
    <div className="text-gray-500 text-center py-8">Loading FAQ manager...</div>
  </div>
);

// Dynamically import FAQManager with loading state
export const FAQManagerLazy = dynamic<ComponentProps<typeof FAQManager>>(
  () => import('./FAQManager').then((mod) => mod.FAQManager),
  {
    loading: () => <LoadingFAQManager />,
    ssr: false, // Disable SSR as it uses drag-and-drop which is client-only
  }
);
