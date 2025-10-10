import { NextRequest, NextResponse } from 'next/server';
import { requireRole, UnauthorizedError, ForbiddenError } from '@/lib/middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import { PageService, PageNotFoundError, DuplicateSlugError } from '@/lib/services/page.service';
import { UpdatePageSchema } from '@/lib/validation/page.schema';
import { AuditService } from '@/lib/services/audit.service';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';

/**
 * GET /api/admin/pages/[slug]
 * Get a specific page by slug
 * Requirements: 3.1
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Require ADMIN or EDITOR role
    await requireRole([UserRole.ADMIN, UserRole.EDITOR]);

    const pageService = new PageService();
    const page = await pageService.getPageBySlug(params.slug);

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(page);
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

    console.error('Error fetching page:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/pages/[slug]
 * Update an existing page
 * Requirements: 3.3, 3.7
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Require ADMIN or EDITOR role
    const user = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = UpdatePageSchema.parse(body);

    const pageService = new PageService();
    const auditService = new AuditService();

    // Get current page for audit log
    const oldPage = await pageService.getPageBySlug(params.slug);
    if (!oldPage) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // Update page
    const updatedPage = await pageService.updatePage(params.slug, validatedData, user.id);

    // Log the action
    await auditService.logAction({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'Page',
      entityId: updatedPage.id,
      details: {
        before: oldPage,
        after: updatedPage,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Revalidate cache
    revalidateTag('pages');
    revalidateTag(`page:${params.slug}`);
    
    // If slug changed, also revalidate new slug
    if (validatedData.slug && validatedData.slug !== params.slug) {
      revalidateTag(`page:${validatedData.slug}`);
    }

    return NextResponse.json(updatedPage);
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

    if (error instanceof PageNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error instanceof DuplicateSlugError) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating page:', error);
    return NextResponse.json(
      { error: 'Failed to update page' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/pages/[slug]
 * Delete a page
 * Requirements: 3.4, 3.7
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Require ADMIN or EDITOR role
    const user = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);

    const pageService = new PageService();
    const auditService = new AuditService();

    // Get page for audit log
    const page = await pageService.getPageBySlug(params.slug);
    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // Delete page
    await pageService.deletePage(params.slug);

    // Log the action
    await auditService.logAction({
      userId: user.id,
      action: 'DELETE',
      entityType: 'Page',
      entityId: page.id,
      details: {
        slug: page.slug,
        title: page.title,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Revalidate cache
    revalidateTag('pages');
    revalidateTag(`page:${params.slug}`);

    return NextResponse.json({ success: true }, { status: 200 });
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

    if (error instanceof PageNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    console.error('Error deleting page:', error);
    return NextResponse.json(
      { error: 'Failed to delete page' },
      { status: 500 }
    );
  }
}
