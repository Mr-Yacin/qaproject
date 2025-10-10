import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import { AuditService } from '@/lib/services/audit.service';
import { auditLogExportFiltersSchema } from '@/lib/validation/audit.schema';
import { z } from 'zod';

const auditService = new AuditService();

/**
 * GET /api/admin/audit-log/export
 * Export audit logs as CSV
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
      limit: searchParams.get('limit') || '10000',
      offset: searchParams.get('offset') || '0',
    };

    // Validate filters
    const validatedFilters = auditLogExportFiltersSchema.parse(filters);

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

    // Export audit logs as CSV
    const csvContent = await auditService.exportAuditLog(serviceFilters);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `audit-log-${timestamp}.csv`;

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
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

    console.error('Error exporting audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to export audit logs' },
      { status: 500 }
    );
  }
}
