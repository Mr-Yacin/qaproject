import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth.middleware';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';
import { UserRole } from '@prisma/client';
import { revalidateTag } from 'next/cache';
import { AuditService } from '@/lib/services/audit.service';
import { z } from 'zod';

// Validation schema for clear cache request
const ClearCacheSchema = z.object({
  tags: z.array(z.string()).optional(), // If not provided, clear all
});

/**
 * POST /api/admin/cache/clear
 * Clear cache for all tags or specific tags
 * Requires ADMIN role
 */
export async function POST(request: NextRequest) {
  try {
    // Require ADMIN role
    const authenticatedUser = await requireRole([UserRole.ADMIN]);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = ClearCacheSchema.parse(body);

    // Define all available cache tags
    const allTags = ['topics', 'settings', 'pages', 'menu', 'footer', 'media'];

    // Determine which tags to clear
    const tagsToClear = validatedData.tags && validatedData.tags.length > 0
      ? validatedData.tags.filter(tag => allTags.includes(tag))
      : allTags;

    // Revalidate each tag
    for (const tag of tagsToClear) {
      revalidateTag(tag);
    }

    // Log the action
    const auditService = new AuditService();
    await auditService.logAction({
      userId: authenticatedUser.id,
      action: 'UPDATE',
      entityType: 'Cache',
      entityId: undefined,
      details: {
        clearedTags: tagsToClear,
        clearAll: !validatedData.tags || validatedData.tags.length === 0,
      },
    });

    return NextResponse.json({
      success: true,
      clearedTags: tagsToClear,
      message: `Successfully cleared cache for ${tagsToClear.length} tag(s)`,
    }, { status: 200 });
  } catch (error) {
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

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
