import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

/**
 * Hook for observing element visibility using Intersection Observer API
 * Useful for lazy loading and infinite scroll implementations
 * 
 * @example
 * const { ref, isIntersecting } = useIntersectionObserver({
 *   threshold: 0.5,
 *   freezeOnceVisible: true,
 * });
 * 
 * return (
 *   <div ref={ref}>
 *     {isIntersecting && <ExpensiveComponent />}
 *   </div>
 * );
 */
export function useIntersectionObserver<T extends Element = Element>(
  options: UseIntersectionObserverOptions = {}
): {
  ref: React.RefObject<T>;
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
} {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    freezeOnceVisible = false,
  } = options;

  const ref = useRef<T>(null);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const frozen = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Don't observe if already frozen
    if (frozen.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setEntry(entry);
        setIsIntersecting(entry.isIntersecting);

        // Freeze if option is enabled and element is visible
        if (freezeOnceVisible && entry.isIntersecting) {
          frozen.current = true;
          observer.disconnect();
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, freezeOnceVisible]);

  return { ref, isIntersecting, entry };
}

/**
 * Hook for infinite scroll implementation
 * Triggers callback when sentinel element becomes visible
 * 
 * @example
 * const { ref, isLoading } = useInfiniteScroll({
 *   onLoadMore: async () => {
 *     await fetchMoreItems();
 *   },
 *   hasMore: hasMoreItems,
 * });
 * 
 * return (
 *   <>
 *     {items.map(item => <Item key={item.id} {...item} />)}
 *     <div ref={ref}>{isLoading && 'Loading...'}</div>
 *   </>
 * );
 */
export function useInfiniteScroll(options: {
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  threshold?: number;
  rootMargin?: string;
}): {
  ref: React.RefObject<HTMLDivElement>;
  isLoading: boolean;
} {
  const { onLoadMore, hasMore, threshold = 0.5, rootMargin = '100px' } = options;
  const [isLoading, setIsLoading] = useState(false);
  const { ref, isIntersecting } = useIntersectionObserver<HTMLDivElement>({
    threshold,
    rootMargin,
  });

  useEffect(() => {
    if (isIntersecting && hasMore && !isLoading) {
      setIsLoading(true);
      onLoadMore().finally(() => {
        setIsLoading(false);
      });
    }
  }, [isIntersecting, hasMore, isLoading, onLoadMore]);

  return { ref, isLoading };
}

/**
 * Hook for lazy loading components when they become visible
 * 
 * @example
 * const { ref, shouldLoad } = useLazyLoad();
 * 
 * return (
 *   <div ref={ref}>
 *     {shouldLoad ? <HeavyComponent /> : <Placeholder />}
 *   </div>
 * );
 */
export function useLazyLoad<T extends Element = Element>(options: {
  threshold?: number;
  rootMargin?: string;
} = {}): {
  ref: React.RefObject<T>;
  shouldLoad: boolean;
} {
  const { threshold = 0.1, rootMargin = '50px' } = options;
  const { ref, isIntersecting } = useIntersectionObserver<T>({
    threshold,
    rootMargin,
    freezeOnceVisible: true,
  });

  return { ref, shouldLoad: isIntersecting };
}
