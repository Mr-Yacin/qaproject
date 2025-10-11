import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth.middleware';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';
import { UserRole } from '@prisma/client';
import { FooterService, FooterColumnNotFoundError } from '@/lib/services/footer.service';
import { UpdateFooterColumnSchema } from '@/lib/validation/footer.schema';
import { AuditService } from '@/lib/services/audit.service';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';

/**
 * PUT /api/admin/footer/columns/[id]
 * Update an existing footer column
 * Requirements: 5.2, 5.6, 5.7
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require ADMIN or EDITOR role
    const user = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);

    const { id } = params;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = UpdateFooterColumnSchema.parse(body);

    const footerService = new FooterService();
    const auditService = new AuditService();

    // Get existing column for audit log
    const existingColumn = await footerService.getColumnById(id);

    // Update footer column
    const updatedColumn = await footerService.updateColumn(id, validatedData);

    // Log the action
    await auditService.logAction({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'FooterColumn',
      entityId: updatedColumn.id,
      details: {
        before: existingColumn,
        after: updatedColumn,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Revalidate cache
    revalidateTag('footer');

    return NextResponse.json(updatedColumn);
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

    if (error instanceof FooterColumnNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating footer column:', error);
    return NextResponse.json(
      { error: 'Failed to update footer column' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/footer/columns/[id]
 * Delete a footer column
 * Requirements: 5.8
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require ADMIN or EDITOR role
    const user = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);

    const { id } = params;

    const footerService = new FooterService();
    const auditService = new AuditService();

    // Get existing column for audit log
    const existingColumn = await footerService.getColumnById(id);

    // Delete footer column
    await footerService.deleteColumn(id);

    // Log the action
    await auditService.logAction({
      userId: user.id,
      action: 'DELETE',
      entityType: 'FooterColumn',
      entityId: id,
      details: {
        title: existingColumn?.title,
        order: existingColumn?.order,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Revalidate cache
    revalidateTag('footer');

    return new NextResponse(null, { status: 204 });
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

    if (error instanceof FooterColumnNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    console.error('Error deleting footer column:', error);
    return NextResponse.json(
      { error: 'Failed to delete footer column' },
      { status: 500 }
    );
  }
}
