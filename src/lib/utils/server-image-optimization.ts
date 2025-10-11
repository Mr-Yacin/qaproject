/**
 * Server-side image optimization utilities
 * Handles image processing on the server for uploaded files
 */

import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface ThumbnailOptions {
  width: number;
  height: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  quality?: number;
}

/**
 * Optimize an image buffer
 * Resizes and compresses the image for web delivery
 */
export async function optimizeImage(
  buffer: Buffer,
  options: ImageOptimizationOptions = {}
): Promise<Buffer> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 85,
    format = 'jpeg',
  } = options;

  let image = sharp(buffer);

  // Get metadata
  const metadata = await image.metadata();

  // Resize if needed
  if (
    metadata.width &&
    metadata.height &&
    (metadata.width > maxWidth || metadata.height > maxHeight)
  ) {
    image = image.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Convert and compress
  switch (format) {
    case 'jpeg':
      image = image.jpeg({ quality, mozjpeg: true });
      break;
    case 'png':
      image = image.png({ quality, compressionLevel: 9 });
      break;
    case 'webp':
      image = image.webp({ quality });
      break;
  }

  return image.toBuffer();
}

/**
 * Generate a thumbnail from an image buffer
 */
export async function generateThumbnailBuffer(
  buffer: Buffer,
  options: ThumbnailOptions
): Promise<Buffer> {
  const { width, height, fit = 'cover', quality = 70 } = options;

  return sharp(buffer)
    .resize(width, height, {
      fit,
      position: 'center',
    })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();
}

/**
 * Save an optimized image to disk
 */
export async function saveOptimizedImage(
  buffer: Buffer,
  filename: string,
  uploadDir: string = 'public/uploads'
): Promise<string> {
  // Ensure upload directory exists
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  const filepath = join(uploadDir, filename);
  await writeFile(filepath, buffer);

  // Return public URL
  return `/uploads/${filename}`;
}

/**
 * Process uploaded image: optimize and generate thumbnail
 */
export async function processUploadedImage(
  buffer: Buffer,
  filename: string,
  options: {
    generateThumbnail?: boolean;
    thumbnailSize?: { width: number; height: number };
    optimizationOptions?: ImageOptimizationOptions;
  } = {}
): Promise<{
  url: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  size: number;
}> {
  const {
    generateThumbnail = true,
    thumbnailSize = { width: 200, height: 200 },
    optimizationOptions = {},
  } = options;

  // Optimize main image
  const optimizedBuffer = await optimizeImage(buffer, optimizationOptions);
  const url = await saveOptimizedImage(optimizedBuffer, filename);

  // Get image metadata
  const metadata = await sharp(optimizedBuffer).metadata();

  // Generate thumbnail if requested
  let thumbnailUrl: string | undefined;
  if (generateThumbnail) {
    const thumbnailBuffer = await generateThumbnailBuffer(
      optimizedBuffer,
      thumbnailSize
    );
    const thumbnailFilename = `thumb_${filename}`;
    thumbnailUrl = await saveOptimizedImage(thumbnailBuffer, thumbnailFilename);
  }

  return {
    url,
    thumbnailUrl,
    width: metadata.width || 0,
    height: metadata.height || 0,
    size: optimizedBuffer.length,
  };
}

/**
 * Get image metadata without loading the full image
 */
export async function getImageMetadata(buffer: Buffer): Promise<{
  width: number;
  height: number;
  format: string;
  size: number;
}> {
  const metadata = await sharp(buffer).metadata();

  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
    size: buffer.length,
  };
}

/**
 * Convert image to WebP format for better compression
 */
export async function convertToWebP(
  buffer: Buffer,
  quality: number = 85
): Promise<Buffer> {
  return sharp(buffer).webp({ quality }).toBuffer();
}

/**
 * Generate multiple sizes of an image for responsive images
 */
export async function generateResponsiveSizes(
  buffer: Buffer,
  sizes: number[] = [640, 750, 828, 1080, 1200, 1920]
): Promise<Array<{ width: number; buffer: Buffer }>> {
  const results = await Promise.all(
    sizes.map(async (width) => {
      const resized = await sharp(buffer)
        .resize(width, undefined, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();

      return { width, buffer: resized };
    })
  );

  return results;
}
