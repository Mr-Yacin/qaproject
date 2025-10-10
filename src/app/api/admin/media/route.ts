import { NextRequest, NextResponse } from 'next/server';
import { mediaService } from '@/lib/services/media.service';
import { MediaFiltersSchema } from '@/lib/validation/media.schema';
import { requireRole } from '@/lib/middleware/auth.middleware';
import { UserRole } from '@prisma/client';

/**
 * GET /api/admin/media
 * List media files with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    // Require ADMIN or EDITOR role
    const user = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters = MediaFiltersSchema.parse({
      mimeType: searchParams.get('mimeType') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    });

    // Get media files
    const result = await mediaService.listMedia(filters);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error listing media:', error);

    if (error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error.name === 'ForbiddenError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to list media files' },
      { status: 500 }
    );
  }
}
