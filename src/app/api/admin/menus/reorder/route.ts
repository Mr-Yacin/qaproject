import { NextRequest, NextResponse } from 'next/server';
import { requireRole, UnauthorizedError, ForbiddenError } from '@/lib/middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import {
  MenuService,
  MenuItemNotFoundError,
  InvalidParentError,
  CircularReferenceError,
} from '@/lib/services/menu.service';
import { ReorderMenuItemsSchema } from '@/lib/validation/menu.schema';
import { AuditService } from '@/lib/services/audit.service';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';

/**
 * PUT /api/admin/menus/reorder
 * Reorder multiple menu items
 * Requirements: 4.6
 */
export async function PUT(request: NextRequest) {
  try {
    // Require ADMIN or EDITOR role
    const user = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = ReorderMenuItemsSchema.parse(body);

    const menuService = new MenuService();
    const auditService = new AuditService();

    // Reorder menu items
    await menuService.reorderMenuItems(validatedData);

    // Log the action
    await auditService.logAction({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'MenuItem',
      entityId: undefined,
      details: {
        action: 'reorder',
        items: validatedData.items,
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

    console.error('Error reordering menu items:', error);
    return NextResponse.json(
      { error: 'Failed to reorder menu items' },
      { status: 500 }
    );
  }
}
