import { NextRequest, NextResponse } from 'next/server';
import { requireRole, UnauthorizedError, ForbiddenError } from '@/lib/middleware/auth.middleware';
import { UserRole } from '@prisma/client';

/**
 * GET /api/admin/cache/stats
 * Get cache statistics
 * Requires ADMIN role
 */
export async function GET(request: NextRequest) {
  try {
    // Require ADMIN role
    await requireRole([UserRole.ADMIN]);

    // Define all cache tags used in the application
    const cacheTags = [
      { tag: 'topics', description: 'All topics list' },
      { tag: 'settings', description: 'Site settings' },
      { tag: 'pages', description: 'All custom pages' },
      { tag: 'menu', description: 'Navigation menu' },
      { tag: 'footer', description: 'Footer configuration' },
      { tag: 'media', description: 'Media library' },
    ];

    // Note: Next.js doesn't provide built-in cache statistics API
    // We return the available tags and their descriptions
    // Actual cache hit/miss statistics would require custom instrumentation
    const stats = {
      tags: cacheTags,
      lastCleared: null, // Could be stored in database if needed
      cacheEnabled: true,
      note: 'Next.js cache statistics are not directly accessible. Use revalidation to clear cache.',
    };

    return NextResponse.json(stats, { status: 200 });
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

    console.error('Error fetching cache stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cache statistics' },
      { status: 500 }
    );
  }
}
