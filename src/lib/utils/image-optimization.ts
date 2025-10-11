/**
 * Image optimization utilities for file uploads
 * Handles compression, resizing, and thumbnail generation
 */

/**
 * Compress an image file before upload
 * Reduces file size while maintaining acceptable quality
 */
export async function compressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    mimeType?: string;
  } = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    mimeType = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Create new file from blob
            const compressedFile = new File([blob], file.name, {
              type: mimeType,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Generate a thumbnail from an image file
 */
export async function generateThumbnail(
  file: File,
  options: {
    width?: number;
    height?: number;
    quality?: number;
  } = {}
): Promise<File> {
  const { width = 200, height = 200, quality = 0.7 } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate dimensions to maintain aspect ratio
        const aspectRatio = img.width / img.height;
        let thumbWidth = width;
        let thumbHeight = height;

        if (aspectRatio > 1) {
          thumbHeight = Math.floor(width / aspectRatio);
        } else {
          thumbWidth = Math.floor(height * aspectRatio);
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = thumbWidth;
        canvas.height = thumbHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to generate thumbnail'));
              return;
            }

            const thumbnailFile = new File(
              [blob],
              `thumb_${file.name}`,
              {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }
            );

            resolve(thumbnailFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Validate image file before upload
 */
export function validateImageFile(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    minWidth?: number;
    minHeight?: number;
  } = {}
): Promise<{ valid: boolean; error?: string }> {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  } = options;

  return new Promise((resolve) => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      resolve({
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      });
      return;
    }

    // Check file size
    if (file.size > maxSize) {
      resolve({
        valid: false,
        error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum ${(maxSize / 1024 / 1024).toFixed(2)}MB`,
      });
      return;
    }

    // Check dimensions if specified
    if (options.minWidth || options.minHeight) {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          if (options.minWidth && img.width < options.minWidth) {
            resolve({
              valid: false,
              error: `Image width ${img.width}px is less than minimum ${options.minWidth}px`,
            });
            return;
          }

          if (options.minHeight && img.height < options.minHeight) {
            resolve({
              valid: false,
              error: `Image height ${img.height}px is less than minimum ${options.minHeight}px`,
            });
            return;
          }

          resolve({ valid: true });
        };

        img.onerror = () => {
          resolve({ valid: false, error: 'Failed to load image' });
        };

        img.src = e.target?.result as string;
      };

      reader.onerror = () => {
        resolve({ valid: false, error: 'Failed to read file' });
      };

      reader.readAsDataURL(file);
    } else {
      resolve({ valid: true });
    }
  });
}

/**
 * Get image dimensions
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Convert image to WebP format for better compression
 */
export async function convertToWebP(file: File, quality: number = 0.85): Promise<File> {
  return compressImage(file, {
    quality,
    mimeType: 'image/webp',
  });
}

/**
 * Calculate optimal quality based on file size
 */
export function calculateOptimalQuality(fileSize: number): number {
  // Larger files get more compression
  if (fileSize > 5 * 1024 * 1024) return 0.7; // > 5MB
  if (fileSize > 2 * 1024 * 1024) return 0.8; // > 2MB
  return 0.85; // Default
}
