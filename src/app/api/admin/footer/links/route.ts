import { NextRequest, NextResponse } from 'next/server';
import { requireRole, UnauthorizedError, ForbiddenError } from '@/lib/middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import { FooterService, InvalidColumnError } from '@/lib/services/footer.service';
import { CreateFooterLinkSchema } from '@/lib/validation/footer.schema';
import { AuditService } from '@/lib/services/audit.service';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';

/**
 * POST /api/admin/footer/links
 * Create a new footer link
 * Requirements: 5.3, 5.7
 */
export async function POST(request: NextRequest) {
  try {
    // Require ADMIN or EDITOR role
    const user = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = CreateFooterLinkSchema.parse(body);

    const footerService = new FooterService();
    const auditService = new AuditService();

    // Create footer link
    const newLink = await footerService.createLink(validatedData);

    // Log the action
    await auditService.logAction({
      userId: user.id,
      action: 'CREATE',
      entityType: 'FooterLink',
      entityId: newLink.id,
      details: {
        columnId: newLink.columnId,
        label: newLink.label,
        url: newLink.url,
        order: newLink.order,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Revalidate cache
    revalidateTag('footer');

    return NextResponse.json(newLink, { status: 201 });
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

    if (error instanceof InvalidColumnError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating footer link:', error);
    return NextResponse.json(
      { error: 'Failed to create footer link' },
      { status: 500 }
    );
  }
}
