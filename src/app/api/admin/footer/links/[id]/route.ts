import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth.middleware';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';
import { UserRole } from '@prisma/client';
import { FooterService, FooterLinkNotFoundError, InvalidColumnError } from '@/lib/services/footer.service';
import { UpdateFooterLinkSchema } from '@/lib/validation/footer.schema';
import { AuditService } from '@/lib/services/audit.service';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';

/**
 * PUT /api/admin/footer/links/[id]
 * Update an existing footer link
 * Requirements: 5.3, 5.6, 5.7
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
    const validatedData = UpdateFooterLinkSchema.parse(body);

    const footerService = new FooterService();
    const auditService = new AuditService();

    // Get existing link for audit log
    const existingLink = await footerService.getLinkById(id);

    // Update footer link
    const updatedLink = await footerService.updateLink(id, validatedData);

    // Log the action
    await auditService.logAction({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'FooterLink',
      entityId: updatedLink.id,
      details: {
        before: existingLink,
        after: updatedLink,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Revalidate cache
    revalidateTag('footer');

    return NextResponse.json(updatedLink);
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

    if (error instanceof FooterLinkNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
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

    console.error('Error updating footer link:', error);
    return NextResponse.json(
      { error: 'Failed to update footer link' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/footer/links/[id]
 * Delete a footer link
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

    // Get existing link for audit log
    const existingLink = await footerService.getLinkById(id);

    // Delete footer link
    await footerService.deleteLink(id);

    // Log the action
    await auditService.logAction({
      userId: user.id,
      action: 'DELETE',
      entityType: 'FooterLink',
      entityId: id,
      details: {
        columnId: existingLink?.columnId,
        label: existingLink?.label,
        url: existingLink?.url,
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

    if (error instanceof FooterLinkNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    console.error('Error deleting footer link:', error);
    return NextResponse.json(
      { error: 'Failed to delete footer link' },
      { status: 500 }
    );
  }
}
