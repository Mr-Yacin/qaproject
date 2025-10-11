import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth.middleware';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';
import { UserRole } from '@prisma/client';
import { UserService } from '@/lib/services/user.service';
import { CreateUserSchema } from '@/lib/validation/user.schema';
import { AuditService } from '@/lib/services/audit.service';
import { z } from 'zod';

/**
 * GET /api/admin/users
 * List all users
 * Requires ADMIN role
 */
export async function GET(request: NextRequest) {
  try {
    // Require ADMIN role
    await requireRole([UserRole.ADMIN]);

    const userService = new UserService();
    const users = await userService.listUsers();

    // Remove password from response
    const sanitizedUsers = users.map(({ password, ...user }) => user);

    return NextResponse.json(sanitizedUsers, { status: 200 });
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

    console.error('Error listing users:', error);
    return NextResponse.json(
      { error: 'Failed to list users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Create a new user
 * Requires ADMIN role
 */
export async function POST(request: NextRequest) {
  try {
    // Require ADMIN role
    const authenticatedUser = await requireRole([UserRole.ADMIN]);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = CreateUserSchema.parse(body);

    const userService = new UserService();
    const newUser = await userService.createUser(validatedData);

    // Log the action
    const auditService = new AuditService();
    await auditService.logAction({
      userId: authenticatedUser.id,
      action: 'CREATE',
      entityType: 'User',
      entityId: newUser.id,
      details: {
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });

    // Remove password from response
    const { password, ...sanitizedUser } = newUser;

    return NextResponse.json(sanitizedUser, { status: 201 });
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

    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
