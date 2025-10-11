/**
 * Performance monitoring utilities
 * Helps track and optimize application performance
 */

/**
 * Measure the execution time of a function
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}

/**
 * Create a performance mark for Web Vitals tracking
 */
export function markPerformance(name: string): void {
  if (typeof window !== 'undefined' && window.performance) {
    performance.mark(name);
  }
}

/**
 * Measure between two performance marks
 */
export function measureBetweenMarks(
  measureName: string,
  startMark: string,
  endMark: string
): number | null {
  if (typeof window !== 'undefined' && window.performance) {
    try {
      performance.measure(measureName, startMark, endMark);
      const measure = performance.getEntriesByName(measureName)[0];
      return measure?.duration || null;
    } catch (error) {
      console.error('Performance measurement failed:', error);
      return null;
    }
  }
  return null;
}

/**
 * Throttle function execution
 * Limits how often a function can be called
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Debounce function execution
 * Delays execution until after a specified time has passed
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function (this: any, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Check if the browser supports a feature
 */
export function supportsFeature(feature: string): boolean {
  if (typeof window === 'undefined') return false;

  switch (feature) {
    case 'webp':
      const canvas = document.createElement('canvas');
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    case 'intersection-observer':
      return 'IntersectionObserver' in window;
    case 'lazy-loading':
      return 'loading' in HTMLImageElement.prototype;
    default:
      return false;
  }
}

/**
 * Get connection speed information
 */
export function getConnectionSpeed(): 'slow' | 'medium' | 'fast' {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return 'medium';
  }

  const connection = (navigator as any).connection;
  const effectiveType = connection?.effectiveType;

  if (effectiveType === 'slow-2g' || effectiveType === '2g') {
    return 'slow';
  } else if (effectiveType === '3g') {
    return 'medium';
  } else {
    return 'fast';
  }
}

/**
 * Prefetch a resource
 */
export function prefetchResource(url: string, type: 'script' | 'style' | 'image' = 'script'): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = type;
  link.href = url;
  document.head.appendChild(link);
}

/**
 * Preload a resource
 */
export function preloadResource(url: string, type: 'script' | 'style' | 'image' = 'script'): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = type;
  link.href = url;
  document.head.appendChild(link);
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get optimal image quality based on connection speed
 */
export function getOptimalImageQuality(): number {
  const speed = getConnectionSpeed();
  switch (speed) {
    case 'slow':
      return 50;
    case 'medium':
      return 75;
    case 'fast':
      return 85;
    default:
      return 75;
  }
}

/**
 * Batch multiple state updates to reduce re-renders
 */
export function batchUpdates<T>(updates: Array<() => void>): void {
  // In React 18+, updates are automatically batched
  // This is a compatibility wrapper
  updates.forEach((update) => update());
}
