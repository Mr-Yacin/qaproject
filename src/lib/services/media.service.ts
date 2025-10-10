import { Media } from '@prisma/client';
import {
  mediaRepository,
  MediaFilters,
  PaginatedMedia,
} from '@/lib/repositories/media.repository';
import sharp from 'sharp';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf'];
const ALLOWED_MIME_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

// Upload directory
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'media');
const THUMBNAIL_DIR = path.join(
  process.cwd(),
  'public',
  'uploads',
  'thumbnails'
);

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class MediaService {
  constructor() {
    this.ensureUploadDirectories();
  }

  private async ensureUploadDirectories(): Promise<void> {
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }
    if (!existsSync(THUMBNAIL_DIR)) {
      await mkdir(THUMBNAIL_DIR, { recursive: true });
    }
  }

  /**
   * Validate file type and size
   */
  private validateFile(file: File): void {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError(
        `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new ValidationError(
        `File type ${file.type} is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
      );
    }
  }

  /**
   * Generate unique filename
   */
  private generateFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const randomString = randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${timestamp}-${randomString}${ext}`;
  }

  /**
   * Generate thumbnail for image files
   */
  private async generateThumbnail(
    filePath: string,
    filename: string
  ): Promise<string | null> {
    try {
      const thumbnailFilename = `thumb-${filename}`;
      const thumbnailPath = path.join(THUMBNAIL_DIR, thumbnailFilename);

      await sharp(filePath)
        .resize(300, 300, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toFile(thumbnailPath);

      return `/uploads/thumbnails/${thumbnailFilename}`;
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      return null;
    }
  }

  /**
   * Upload a file
   */
  async uploadFile(file: File, userId?: string): Promise<Media> {
    // Validate file
    this.validateFile(file);

    // Generate unique filename
    const filename = this.generateFilename(file.name);
    const filePath = path.join(UPLOAD_DIR, filename);

    // Convert File to Buffer and save
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    // Generate thumbnail for images
    let thumbnailUrl: string | null = null;
    if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
      thumbnailUrl = await this.generateThumbnail(filePath, filename);
    }

    // Save to database
    const media = await mediaRepository.create({
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      url: `/uploads/media/${filename}`,
      thumbnailUrl,
      uploadedBy: userId,
    });

    return media;
  }

  /**
   * List media files with pagination and filters
   */
  async listMedia(filters: MediaFilters): Promise<PaginatedMedia> {
    return mediaRepository.findMany(filters);
  }

  /**
   * Get media by ID
   */
  async getMediaById(id: string): Promise<Media | null> {
    return mediaRepository.findById(id);
  }

  /**
   * Delete a file
   */
  async deleteFile(id: string): Promise<void> {
    const media = await mediaRepository.findById(id);
    if (!media) {
      throw new Error('Media not found');
    }

    // Delete physical files
    const filePath = path.join(process.cwd(), 'public', media.url);
    try {
      await unlink(filePath);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }

    // Delete thumbnail if exists
    if (media.thumbnailUrl) {
      const thumbnailPath = path.join(
        process.cwd(),
        'public',
        media.thumbnailUrl
      );
      try {
        await unlink(thumbnailPath);
      } catch (error) {
        console.error('Failed to delete thumbnail:', error);
      }
    }

    // Delete from database
    await mediaRepository.delete(id);
  }

  /**
   * Delete multiple files
   */
  async deleteMultipleFiles(ids: string[]): Promise<number> {
    let deletedCount = 0;

    for (const id of ids) {
      try {
        await this.deleteFile(id);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete media ${id}:`, error);
      }
    }

    return deletedCount;
  }
}

export const mediaService = new MediaService();
