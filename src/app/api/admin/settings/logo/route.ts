import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth.middleware';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';
import { UserRole } from '@prisma/client';
import { SettingsService } from '@/lib/services/settings.service';
import { AuditService } from '@/lib/services/audit.service';
import { revalidateTag } from 'next/cache';
import { writeFile, mkdir } from 'fs/promises';
import { join, basename, extname, resolve } from 'path';
import { existsSync } from 'fs';
import { randomBytes } from 'crypto';
import { rateLimit, RATE_LIMIT_CONFIGS, RateLimitError } from '@/lib/middleware/rate-limit.middleware';

// File signature validation for security
const FILE_SIGNATURES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/jpg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
};

/**
 * Validate file signature (magic numbers)
 * Requirements: 6.2, 6.7
 */
function validateFileSignature(buffer: Buffer, mimeType: string): boolean {
  const signatures = FILE_SIGNATURES[mimeType];
  if (!signatures) {
    return false;
  }

  return signatures.some(signature => {
    if (buffer.length < signature.length) {
      return false;
    }
    return signature.every((byte, index) => buffer[index] === byte);
  });
}

/**
 * Generate secure filename
 * Requirements: 6.2, 6.7
 */
function generateSecureFilename(originalName: string): string {
  const ext = extname(basename(originalName)).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  
  if (!allowedExtensions.includes(ext)) {
    throw new Error(`File extension ${ext} is not allowed`);
  }
  
  const randomString = randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `logo-${timestamp}-${randomString}${ext}`;
}

/**
 * POST /api/admin/settings/logo
 * Upload logo image with enhanced security and rate limiting
 * Requirements: 2.2, 2.6, 2.7, 6.2, 6.7, 7.2 (rate limiting)
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for file uploads
    await rateLimit(request, RATE_LIMIT_CONFIGS.UPLOAD);

    // Require ADMIN role
    const user = await requireRole([UserRole.ADMIN]);

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Validate file is not empty
    if (file.size === 0) {
      return NextResponse.json(
        { error: 'File is empty' },
        { status: 400 }
      );
    }

    // Convert file to buffer for validation
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate file signature matches declared MIME type
    if (!validateFileSignature(buffer, file.type)) {
      return NextResponse.json(
        { error: 'File content does not match declared type. File may be corrupted or malicious.' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate secure filename (prevents path traversal)
    const filename = generateSecureFilename(file.name);
    const filepath = join(uploadsDir, filename);

    // Ensure the resolved path is within the upload directory
    const resolvedPath = resolve(filepath);
    const resolvedUploadDir = resolve(uploadsDir);
    if (!resolvedPath.startsWith(resolvedUploadDir)) {
      return NextResponse.json(
        { error: 'Invalid file path detected' },
        { status: 400 }
      );
    }

    // Save file to disk
    await writeFile(filepath, buffer);

    // Return the public URL
    const url = `/uploads/${filename}`;

    const settingsService = new SettingsService();
    const auditService = new AuditService();

    // Get current settings for audit log
    const oldSettings = await settingsService.getSettings();

    // Update settings with new logo URL
    const updatedSettings = await settingsService.uploadLogo(url, user.id);

    // Log the action
    await auditService.logAction({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'Settings',
      entityId: updatedSettings.id,
      details: {
        field: 'logoUrl',
        before: oldSettings.logoUrl,
        after: url,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Revalidate cache
    revalidateTag('settings');

    return NextResponse.json({
      success: true,
      url,
      filename,
      settings: updatedSettings,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: error.message },
        { 
          status: 429,
          headers: {
            'Retry-After': error.retryAfter.toString(),
          },
        }
      );
    }

    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    console.error('Logo upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload logo' },
      { status: 500 }
    );
  }
}
