import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import { AuditService } from '@/lib/services/audit.service';
import { auditLogFiltersSchema } from '@/lib/validation/audit.schema';
import { z } from 'zod';

const auditService = new AuditService();

/**
 * GET /api/admin/audit-log
 * Get audit logs with filters and pagination
 * Access: ADMIN only
 */
export async function GET(request: NextRequest) {
  try {
    // Require ADMIN role
    await requireRole([UserRole.ADMIN]);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters = {
      userId: searchParams.get('userId') || undefined,
      action: searchParams.get('action') || undefined,
      entityType: searchParams.get('entityType') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      limit: searchParams.get('limit') || '50',
      offset: searchParams.get('offset') || '0',
    };

    // Validate filters
    const validatedFilters = auditLogFiltersSchema.parse(filters);

    // Convert date strings to Date objects
    const serviceFilters = {
      ...validatedFilters,
      startDate: validatedFilters.startDate
        ? new Date(validatedFilters.startDate)
        : undefined,
      endDate: validatedFilters.endDate
        ? new Date(validatedFilters.endDate)
        : undefined,
    };

    // Get audit logs
    const result = await auditService.getAuditLogs(serviceFilters);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if (
      error instanceof Error &&
      (error.name === 'UnauthorizedError' || error.name === 'ForbiddenError')
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: error.name === 'UnauthorizedError' ? 401 : 403 }
      );
    }

    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
