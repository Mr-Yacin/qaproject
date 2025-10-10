import { NextRequest, NextResponse } from 'next/server';
import { requireRole, UnauthorizedError, ForbiddenError } from '@/lib/middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import { MenuService, InvalidParentError } from '@/lib/services/menu.service';
import { CreateMenuItemSchema } from '@/lib/validation/menu.schema';
import { AuditService } from '@/lib/services/audit.service';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';

/**
 * GET /api/admin/menus
 * Get the complete menu structure
 * Requirements: 4.1
 */
export async function GET(request: NextRequest) {
  try {
    // Require ADMIN or EDITOR role
    await requireRole([UserRole.ADMIN, UserRole.EDITOR]);

    const menuService = new MenuService();
    const menuStructure = await menuService.getMenuStructure();

    return NextResponse.json(menuStructure);
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

    console.error('Error fetching menu structure:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu structure' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/menus
 * Create a new menu item
 * Requirements: 4.2, 4.5
 */
export async function POST(request: NextRequest) {
  try {
    // Require ADMIN or EDITOR role
    const user = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = CreateMenuItemSchema.parse(body);

    const menuService = new MenuService();
    const auditService = new AuditService();

    // Create menu item
    const newMenuItem = await menuService.createMenuItem(validatedData);

    // Log the action
    await auditService.logAction({
      userId: user.id,
      action: 'CREATE',
      entityType: 'MenuItem',
      entityId: newMenuItem.id,
      details: {
        label: newMenuItem.label,
        url: newMenuItem.url,
        order: newMenuItem.order,
        parentId: newMenuItem.parentId,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Revalidate cache
    revalidateTag('menu');

    return NextResponse.json(newMenuItem, { status: 201 });
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

    if (error instanceof InvalidParentError) {
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

    console.error('Error creating menu item:', error);
    return NextResponse.json(
      { error: 'Failed to create menu item' },
      { status: 500 }
    );
  }
}
