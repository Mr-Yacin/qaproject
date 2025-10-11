import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import { PageService } from '@/lib/services/page.service';
import { CreatePageSchema, PageQuerySchema } from '@/lib/validation/page.schema';
import { AuditService } from '@/lib/services/audit.service';
import { revalidateTag } from 'next/cache';
import { handleAPIError } from '@/lib/errors';

/**
 * GET /api/admin/pages
 * List all pages with pagination and filtering
 * Requirements: 3.1
 */
export async function GET(request: NextRequest) {
  try {
    // Require ADMIN or EDITOR role
    await requireRole([UserRole.ADMIN, UserRole.EDITOR]);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    };

    const validatedQuery = PageQuerySchema.parse(queryParams);

    const pageService = new PageService();
    const result = await pageService.listPages(validatedQuery);

    return NextResponse.json(result);
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * POST /api/admin/pages
 * Create a new page
 * Requirements: 3.2, 3.7
 */
export async function POST(request: NextRequest) {
  try {
    // Require ADMIN or EDITOR role
    const user = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = CreatePageSchema.parse(body);

    const pageService = new PageService();
    const auditService = new AuditService();

    // Create page
    const newPage = await pageService.createPage(validatedData, user.id);

    // Log the action
    await auditService.logAction({
      userId: user.id,
      action: 'CREATE',
      entityType: 'Page',
      entityId: newPage.id,
      details: {
        slug: newPage.slug,
        title: newPage.title,
        status: newPage.status,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Revalidate cache
    revalidateTag('pages');
    revalidateTag(`page:${newPage.slug}`);

    return NextResponse.json(newPage, { status: 201 });
  } catch (error) {
    return handleAPIError(error);
  }
}
