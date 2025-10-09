'use client';

import dynamic from 'next/dynamic';
import { ComponentProps } from 'react';
import { RichTextEditor } from './RichTextEditor';

/**
 * Lazy-loaded RichTextEditor component with code splitting
 * Requirements: 10.3, 10.4, 10.6
 */

// Loading component
const LoadingEditor = () => (
  <div className="border rounded-lg overflow-hidden">
    <div className="bg-gray-50 border-b p-2 h-12 animate-pulse" />
    <div className="min-h-[300px] p-4 flex items-center justify-center">
      <div className="text-gray-500">Loading editor...</div>
    </div>
  </div>
);

// Dynamically import RichTextEditor with loading state
export const RichTextEditorLazy = dynamic<ComponentProps<typeof RichTextEditor>>(
  () => import('./RichTextEditor').then((mod) => mod.RichTextEditor),
  {
    loading: () => <LoadingEditor />,
    ssr: false, // Disable SSR for the editor as it's client-only
  }
);
