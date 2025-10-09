'use client';

import ErrorBoundary from '@/components/public/ErrorBoundary';

/**
 * Error boundary for topics page
 * Catches and displays errors that occur during rendering
 * Requirements: 2.4, 2.6
 */
export default function TopicsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorBoundary error={error} reset={reset} />;
}
