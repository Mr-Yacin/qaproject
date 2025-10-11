import { NextRequest, NextResponse } from 'next/server';
import { mediaService } from '@/lib/services/media.service';
import { requireRole } from '@/lib/middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import { AuditService } from '@/lib/services/audit.service';
import { rateLimit, RATE_LIMIT_CONFIGS, RateLimitError } from '@/lib/middleware/rate-limit.middleware';

const auditService = new AuditService();

/**
 * POST /api/admin/media/upload
 * Upload a media file with rate limiting
 * Requirements: 6.1, 6.2, 6.5, 7.2 (rate limiting)
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for file uploads
    await rateLimit(request, RATE_LIMIT_CONFIGS.UPLOAD);

    // Require ADMIN or EDITOR role
    const user = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Upload file
    const media = await mediaService.uploadFile(file, user.id);

    // Log audit
    await auditService.logAction({
      userId: user.id,
      action: 'CREATE',
      entityType: 'Media',
      entityId: media.id,
      details: {
        filename: media.filename,
        originalName: media.originalName,
        mimeType: media.mimeType,
        size: media.size,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.ip || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json(media, { status: 201 });
  } catch (error: any) {
    console.error('Error uploading media:', error);

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

    if (error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error.name === 'ForbiddenError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
