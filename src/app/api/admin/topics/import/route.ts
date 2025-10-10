import { NextRequest, NextResponse } from 'next/server';
import { requireRole, UnauthorizedError, ForbiddenError } from '@/lib/middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import { ContentService } from '@/lib/services/content.service';
import { ContentRepository } from '@/lib/repositories/content.repository';
import { prisma } from '@/lib/db';
import { ImportTopicsSchema } from '@/lib/validation/bulk.schema';
import { AuditService } from '@/lib/services/audit.service';
import { z } from 'zod';
import { revalidateTag } from 'next/cache';

/**
 * POST /api/admin/topics/import
 * Import topics from JSON
 * Requires ADMIN or EDITOR role
 * Requirements: 10.8
 */
export async function POST(request: NextRequest) {
  try {
    // Require ADMIN or EDITOR role
    const authenticatedUser = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = ImportTopicsSchema.parse(body);

    const repository = new ContentRepository();
    const contentService = new ContentService(repository);

    // Import topics
    const result = await contentService.importTopics(
      validatedData.topics,
      validatedData.mode
    );

    // Log the action
    const auditService = new AuditService();
    await auditService.logAction({
      userId: authenticatedUser.id,
      action: 'CREATE',
      entityType: 'Topic',
      details: {
        operation: 'import',
        mode: validatedData.mode,
        total: validatedData.topics.length,
        success: result.success,
        failed: result.failed,
        errors: result.errors,
      },
    });

    // Revalidate cache
    revalidateTag('topics');

    return NextResponse.json(
      {
        message: 'Import completed',
        success: result.success,
        failed: result.failed,
        errors: result.errors,
      },
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

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in import:', error);
    return NextResponse.json(
      { error: 'Failed to import topics' },
      { status: 500 }
    );
  }
}
