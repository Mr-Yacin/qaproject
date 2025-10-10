import { NextRequest, NextResponse } from 'next/server';
import { requireRole, UnauthorizedError, ForbiddenError } from '@/lib/middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import { FooterService } from '@/lib/services/footer.service';
import { FooterSettingsSchema } from '@/lib/validation/footer.schema';
import { AuditService } from '@/lib/services/audit.service';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';

/**
 * PUT /api/admin/footer/settings
 * Update footer settings (copyright text, social links)
 * Requirements: 5.4, 5.5, 5.7
 */
export async function PUT(request: NextRequest) {
  try {
    // Require ADMIN or EDITOR role
    const user = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = FooterSettingsSchema.parse(body);

    const footerService = new FooterService();
    const auditService = new AuditService();

    // Get existing settings for audit log
    const existingSettings = await footerService.getFooterSettings();

    // Update footer settings
    const updatedSettings = await footerService.updateFooterSettings(validatedData);

    // Log the action
    await auditService.logAction({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'FooterSettings',
      entityId: updatedSettings.id,
      details: {
        before: existingSettings,
        after: updatedSettings,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Revalidate cache
    revalidateTag('footer');

    return NextResponse.json(updatedSettings);
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

    console.error('Error updating footer settings:', error);
    return NextResponse.json(
      { error: 'Failed to update footer settings' },
      { status: 500 }
    );
  }
}
