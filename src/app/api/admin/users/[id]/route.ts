import { NextRequest, NextResponse } from 'next/server';
import { requireRole, UnauthorizedError, ForbiddenError } from '@/lib/middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import { UserService } from '@/lib/services/user.service';
import { UpdateUserSchema } from '@/lib/validation/user.schema';
import { AuditService } from '@/lib/services/audit.service';
import { z } from 'zod';

/**
 * GET /api/admin/users/[id]
 * Get a specific user by ID
 * Requires ADMIN role
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require ADMIN role
    await requireRole([UserRole.ADMIN]);

    const { id } = params;

    const userService = new UserService();
    const user = await userService.getUserById(id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove password from response
    const { password, ...sanitizedUser } = user;

    return NextResponse.json(sanitizedUser, { status: 200 });
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

    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/users/[id]
 * Update a user
 * Requires ADMIN role
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require ADMIN role
    const authenticatedUser = await requireRole([UserRole.ADMIN]);

    const { id } = params;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = UpdateUserSchema.parse(body);

    const userService = new UserService();

    // Get the user before update for audit log
    const existingUser = await userService.getUserById(id);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent users from deactivating themselves
    if (id === authenticatedUser.id && validatedData.isActive === false) {
      return NextResponse.json(
        { error: 'You cannot deactivate your own account' },
        { status: 400 }
      );
    }

    // Prevent users from changing their own role
    if (id === authenticatedUser.id && validatedData.role && validatedData.role !== existingUser.role) {
      return NextResponse.json(
        { error: 'You cannot change your own role' },
        { status: 400 }
      );
    }

    const updatedUser = await userService.updateUser(id, validatedData);

    // Log the action
    const auditService = new AuditService();
    await auditService.logAction({
      userId: authenticatedUser.id,
      action: 'UPDATE',
      entityType: 'User',
      entityId: updatedUser.id,
      details: {
        before: {
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
          isActive: existingUser.isActive,
        },
        after: {
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          isActive: updatedUser.isActive,
        },
      },
    });

    // Remove password from response
    const { password, ...sanitizedUser } = updatedUser;

    return NextResponse.json(sanitizedUser, { status: 200 });
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

    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete a user
 * Requires ADMIN role
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require ADMIN role
    const authenticatedUser = await requireRole([UserRole.ADMIN]);

    const { id } = params;

    // Prevent users from deleting themselves
    if (id === authenticatedUser.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    const userService = new UserService();

    // Get the user before deletion for audit log
    const existingUser = await userService.getUserById(id);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    await userService.deleteUser(id);

    // Log the action
    const auditService = new AuditService();
    await auditService.logAction({
      userId: authenticatedUser.id,
      action: 'DELETE',
      entityType: 'User',
      entityId: id,
      details: {
        email: existingUser.email,
        name: existingUser.name,
        role: existingUser.role,
      },
    });

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    );
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

    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
