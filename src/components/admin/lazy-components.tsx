/**
 * Lazy-loaded admin components for code splitting
 * Reduces initial bundle size by loading components on demand
 */

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Loading component for lazy-loaded components
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
  </div>
);

// Lazy load heavy admin components
export const LazyMediaLibrary = dynamic(
  () => import('./media/MediaLibrary').then((mod) => ({ default: mod.MediaLibrary })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

export const LazyRichTextEditor = dynamic(
  () => import('./RichTextEditor').then((mod) => ({ default: mod.RichTextEditor })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

export const LazyFAQManager = dynamic(
  () => import('./FAQManager').then((mod) => ({ default: mod.FAQManager })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

export const LazyPageEditor = dynamic(
  () => import('./pages/PageEditor').then((mod) => ({ default: mod.PageEditor })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

export const LazyMenuBuilder = dynamic(
  () => import('./menus/MenuBuilder').then((mod) => ({ default: mod.MenuBuilder })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

export const LazyFooterBuilder = dynamic(
  () => import('./footer/FooterBuilder').then((mod) => ({ default: mod.FooterBuilder })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

export const LazyAuditLogTable = dynamic(
  () => import('./audit/AuditLogTable').then((mod) => ({ default: mod.AuditLogTable })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

export const LazyCacheManagement = dynamic(
  () => import('./cache/CacheManagement').then((mod) => ({ default: mod.CacheManagement })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

export const LazyBulkActions = dynamic(
  () => import('./bulk/BulkActions').then((mod) => ({ default: mod.BulkActions })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);
