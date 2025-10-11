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

// File signature (magic numbers) for validation
const FILE_SIGNATURES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/jpg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
};

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
   * Validate file signature (magic numbers) to verify actual file type
   * Requirements: 6.2, 6.7 - Server-side MIME type validation
   */
  private async validateFileSignature(buffer: Buffer, mimeType: string): Promise<boolean> {
    const signatures = FILE_SIGNATURES[mimeType];
    if (!signatures) {
      return false;
    }

    // Check if buffer matches any of the valid signatures for this MIME type
    return signatures.some(signature => {
      if (buffer.length < signature.length) {
        return false;
      }
      return signature.every((byte, index) => buffer[index] === byte);
    });
  }

  /**
   * Validate file type and size
   * Requirements: 6.2, 6.7 - File validation
   */
  private async validateFile(file: File, buffer: Buffer): Promise<void> {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError(
        `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }

    // Validate file size is not zero
    if (file.size === 0) {
      throw new ValidationError('File is empty');
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new ValidationError(
        `File type ${file.type} is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
      );
    }

    // Validate actual file content matches declared MIME type
    const isValidSignature = await this.validateFileSignature(buffer, file.type);
    if (!isValidSignature) {
      throw new ValidationError(
        `File content does not match declared type ${file.type}. File may be corrupted or malicious.`
      );
    }
  }

  /**
   * Generate unique filename with path traversal prevention
   * Requirements: 6.2, 6.7 - Secure filename generation
   */
  private generateFilename(originalName: string): string {
    // Remove any path components and get only the extension
    const basename = path.basename(originalName);
    const ext = path.extname(basename).toLowerCase();
    
    // Validate extension is allowed
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'];
    if (!allowedExtensions.includes(ext)) {
      throw new ValidationError(`File extension ${ext} is not allowed`);
    }
    
    // Generate cryptographically secure random filename
    const randomString = randomBytes(16).toString('hex');
    const timestamp = Date.now();
    
    // Return filename with only alphanumeric characters and extension
    return `${timestamp}-${randomString}${ext}`;
  }

  /**
   * Generate thumbnail for image files
   * Optimized with better compression and quality settings
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
          fit: 'cover',
          position: 'center',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 70, mozjpeg: true })
        .toFile(thumbnailPath);

      return `/uploads/thumbnails/${thumbnailFilename}`;
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      return null;
    }
  }

  /**
   * Optimize image file before saving
   * Reduces file size while maintaining quality
   */
  private async optimizeImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
    try {
      let image = sharp(buffer);
      const metadata = await image.metadata();

      // Resize if image is too large
      if (metadata.width && metadata.height) {
        const maxDimension = 1920;
        if (metadata.width > maxDimension || metadata.height > maxDimension) {
          image = image.resize(maxDimension, maxDimension, {
            fit: 'inside',
            withoutEnlargement: true,
          });
        }
      }

      // Apply format-specific optimization
      let optimizedBuffer: Buffer;
      if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
        optimizedBuffer = await image.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
      } else if (mimeType === 'image/png') {
        optimizedBuffer = await image.png({ quality: 85, compressionLevel: 9 }).toBuffer();
      } else if (mimeType === 'image/webp') {
        optimizedBuffer = await image.webp({ quality: 85 }).toBuffer();
      } else {
        // Return original buffer if no optimization applied
        return buffer;
      }

      return Buffer.from(optimizedBuffer);
    } catch (error) {
      console.error('Failed to optimize image:', error);
      return buffer; // Return original on error
    }
  }

  /**
   * Upload a file
   * Requirements: 6.2, 6.7 - Secure file upload with validation and optimization
   */
  async uploadFile(file: File, userId?: string): Promise<Media> {
    // Convert File to Buffer first for validation
    const arrayBuffer = await file.arrayBuffer();
    let buffer: Buffer = Buffer.from(arrayBuffer);

    // Validate file (size, MIME type, and file signature)
    await this.validateFile(file, buffer);

    // Optimize image files before saving
    if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
      const optimized = await this.optimizeImage(buffer, file.type);
      buffer = Buffer.from(optimized);
    }

    // Generate unique filename (prevents path traversal)
    const filename = this.generateFilename(file.name);
    const filePath = path.join(UPLOAD_DIR, filename);

    // Ensure the resolved path is within the upload directory (additional security check)
    const resolvedPath = path.resolve(filePath);
    const resolvedUploadDir = path.resolve(UPLOAD_DIR);
    if (!resolvedPath.startsWith(resolvedUploadDir)) {
      throw new ValidationError('Invalid file path detected');
    }

    // Save optimized file to disk
    await writeFile(filePath, buffer);

    // Generate thumbnail for images
    let thumbnailUrl: string | null = null;
    if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
      thumbnailUrl = await this.generateThumbnail(filePath, filename);
    }

    // Save to database with actual file size after optimization
    const media = await mediaRepository.create({
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: buffer.length, // Use optimized size
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
