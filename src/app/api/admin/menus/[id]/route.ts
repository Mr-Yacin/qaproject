import { NextRequest, NextResponse } from 'next/server';
import { requireRole, UnauthorizedError, ForbiddenError } from '@/lib/middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import {
  MenuService,
  MenuItemNotFoundError,
  InvalidParentError,
  CircularReferenceError,
} from '@/lib/services/menu.service';
import { UpdateMenuItemSchema } from '@/lib/validation/menu.schema';
import { AuditService } from '@/lib/services/audit.service';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';

/**
 * PUT /api/admin/menus/[id]
 * Update an existing menu item
 * Requirements: 4.2, 4.5
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
    const validatedData = UpdateMenuItemSchema.parse(body);

    const menuService = new MenuService();
    const auditService = new AuditService();

    // Get existing menu item for audit log
    const existingMenuItem = await menuService.getMenuItemById(id);

    // Update menu item
    const updatedMenuItem = await menuService.updateMenuItem(id, validatedData);

    // Log the action
    await auditService.logAction({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'MenuItem',
      entityId: updatedMenuItem.id,
      details: {
        before: existingMenuItem,
        after: updatedMenuItem,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Revalidate cache
    revalidateTag('menu');

    return NextResponse.json(updatedMenuItem);
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

    if (error instanceof MenuItemNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error instanceof InvalidParentError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error instanceof CircularReferenceError) {
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

    console.error('Error updating menu item:', error);
    return NextResponse.json(
      { error: 'Failed to update menu item' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/menus/[id]
 * Delete a menu item
 * Requirements: 4.5
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require ADMIN or EDITOR role
    const user = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);

    const { id } = params;

    const menuService = new MenuService();
    const auditService = new AuditService();

    // Get existing menu item for audit log
    const existingMenuItem = await menuService.getMenuItemById(id);

    // Delete menu item
    await menuService.deleteMenuItem(id);

    // Log the action
    await auditService.logAction({
      userId: user.id,
      action: 'DELETE',
      entityType: 'MenuItem',
      entityId: id,
      details: {
        deleted: existingMenuItem,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Revalidate cache
    revalidateTag('menu');

    return NextResponse.json({ success: true });
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

    if (error instanceof MenuItemNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    console.error('Error deleting menu item:', error);
    return NextResponse.json(
      { error: 'Failed to delete menu item' },
      { status: 500 }
    );
  }
}
