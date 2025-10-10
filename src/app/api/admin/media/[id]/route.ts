import { NextRequest, NextResponse } from 'next/server';
import { mediaService } from '@/lib/services/media.service';
import { requireRole } from '@/lib/middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import { AuditService } from '@/lib/services/audit.service';

const auditService = new AuditService();

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/admin/media/[id]
 * Get media file by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Require ADMIN or EDITOR role
    await requireRole([UserRole.ADMIN, UserRole.EDITOR]);

    const media = await mediaService.getMediaById(params.id);

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    return NextResponse.json(media);
  } catch (error: any) {
    console.error('Error getting media:', error);

    if (error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error.name === 'ForbiddenError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to get media file' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/media/[id]
 * Delete a media file
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Require ADMIN or EDITOR role
    const user = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);

    // Get media details before deletion for audit log
    const media = await mediaService.getMediaById(params.id);

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Delete file
    await mediaService.deleteFile(params.id);

    // Log audit
    await auditService.logAction({
      userId: user.id,
      action: 'DELETE',
      entityType: 'Media',
      entityId: params.id,
      details: {
        filename: media.filename,
        originalName: media.originalName,
        mimeType: media.mimeType,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.ip || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ message: 'Media deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting media:', error);

    if (error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error.name === 'ForbiddenError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to delete media file' },
      { status: 500 }
    );
  }
}
