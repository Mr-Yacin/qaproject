'use client';

import NextImage from 'next/image';
import { useState } from 'react';

/**
 * OptimizedImage component
 * Wraps Next.js Image component with error handling and lazy loading
 * Requirements: 10.1, 10.5
 */
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  fill = false,
  sizes,
}: OptimizedImageProps) {
  const [error, setError] = useState(false);

  // Fallback for broken images
  if (error) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={width && height ? { width, height } : undefined}
      >
        <span className="text-gray-500 text-sm">Image not available</span>
      </div>
    );
  }

  // Use fill layout if no dimensions provided
  if (fill || (!width && !height)) {
    return (
      <NextImage
        src={src}
        alt={alt}
        fill
        className={className}
        onError={() => setError(true)}
        loading={priority ? undefined : 'lazy'}
        sizes={sizes || '100vw'}
      />
    );
  }

  return (
    <NextImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setError(true)}
      loading={priority ? undefined : 'lazy'}
      sizes={sizes}
    />
  );
}
