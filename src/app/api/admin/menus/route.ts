import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import { MenuService } from '@/lib/services/menu.service';
import { CreateMenuItemSchema } from '@/lib/validation/menu.schema';
import { AuditService } from '@/lib/services/audit.service';
import { revalidateTag } from 'next/cache';
import { handleAPIError } from '@/lib/errors';

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
    return handleAPIError(error);
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
    return handleAPIError(error);
  }
}
