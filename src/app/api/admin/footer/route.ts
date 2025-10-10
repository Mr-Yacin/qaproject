import { NextRequest, NextResponse } from 'next/server';
import { requireRole, UnauthorizedError, ForbiddenError } from '@/lib/middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import { FooterService } from '@/lib/services/footer.service';

/**
 * GET /api/admin/footer
 * Get complete footer configuration (settings and columns with links)
 * Requirements: 5.1
 */
export async function GET(request: NextRequest) {
  try {
    // Require ADMIN or EDITOR role
    await requireRole([UserRole.ADMIN, UserRole.EDITOR]);

    const footerService = new FooterService();
    const footerConfig = await footerService.getFooterConfig();

    return NextResponse.json(footerConfig);
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

    console.error('Error fetching footer configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch footer configuration' },
      { status: 500 }
    );
  }
}
