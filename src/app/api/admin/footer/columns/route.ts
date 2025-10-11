import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth.middleware';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';
import { UserRole } from '@prisma/client';
import { FooterService } from '@/lib/services/footer.service';
import { CreateFooterColumnSchema } from '@/lib/validation/footer.schema';
import { AuditService } from '@/lib/services/audit.service';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';

/**
 * POST /api/admin/footer/columns
 * Create a new footer column
 * Requirements: 5.2, 5.7
 */
export async function POST(request: NextRequest) {
  try {
    // Require ADMIN or EDITOR role
    const user = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = CreateFooterColumnSchema.parse(body);

    const footerService = new FooterService();
    const auditService = new AuditService();

    // Create footer column
    const newColumn = await footerService.createColumn(validatedData);

    // Log the action
    await auditService.logAction({
      userId: user.id,
      action: 'CREATE',
      entityType: 'FooterColumn',
      entityId: newColumn.id,
      details: {
        title: newColumn.title,
        order: newColumn.order,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Revalidate cache
    revalidateTag('footer');

    return NextResponse.json(newColumn, { status: 201 });
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

    console.error('Error creating footer column:', error);
    return NextResponse.json(
      { error: 'Failed to create footer column' },
      { status: 500 }
    );
  }
}
