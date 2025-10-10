import { NextRequest, NextResponse } from 'next/server';
import { requireRole, UnauthorizedError, ForbiddenError } from '@/lib/middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import { ContentService } from '@/lib/services/content.service';
import { ContentRepository } from '@/lib/repositories/content.repository';
import { prisma } from '@/lib/db';
import { BulkUpdateSchema } from '@/lib/validation/bulk.schema';
import { AuditService } from '@/lib/services/audit.service';
import { z } from 'zod';
import { revalidateTag } from 'next/cache';

/**
 * POST /api/admin/topics/bulk-update
 * Bulk update topics (status and/or tags)
 * Requires ADMIN or EDITOR role
 * Requirements: 10.3, 10.4, 10.6
 */
export async function POST(request: NextRequest) {
  try {
    // Require ADMIN or EDITOR role
    const authenticatedUser = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = BulkUpdateSchema.parse(body);

    const repository = new ContentRepository();
    const contentService = new ContentService(repository);

    // Perform bulk update
    const result = await contentService.bulkUpdateTopics(
      validatedData.topicIds,
      validatedData.updates
    );

    // Log the action
    const auditService = new AuditService();
    await auditService.logAction({
      userId: authenticatedUser.id,
      action: 'UPDATE',
      entityType: 'Topic',
      details: {
        operation: 'bulk_update',
        topicIds: validatedData.topicIds,
        updates: validatedData.updates,
        success: result.success,
        failed: result.failed,
      },
    });

    // Revalidate cache
    revalidateTag('topics');

    return NextResponse.json(
      {
        message: 'Bulk update completed',
        success: result.success,
        failed: result.failed,
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

    console.error('Error in bulk update:', error);
    return NextResponse.json(
      { error: 'Failed to update topics' },
      { status: 500 }
    );
  }
}
