import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import { SettingsService } from '@/lib/services/settings.service';
import { SiteSettingsSchema } from '@/lib/validation/schemas';
import { AuditService } from '@/lib/services/audit.service';
import { revalidateTag } from 'next/cache';
import { handleAPIError } from '@/lib/errors';

/**
 * GET /api/admin/settings
 * Get current site settings
 * Requirements: 2.1, 2.8
 */
export async function GET() {
  try {
    // Require ADMIN role
    await requireRole([UserRole.ADMIN]);

    const settingsService = new SettingsService();
    const settings = await settingsService.getSettings();

    return NextResponse.json(settings);
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * PUT /api/admin/settings
 * Update site settings
 * Requirements: 2.2, 2.3, 2.5, 2.6
 */
export async function PUT(request: NextRequest) {
  try {
    // Require ADMIN role
    const user = await requireRole([UserRole.ADMIN]);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = SiteSettingsSchema.parse(body);

    const settingsService = new SettingsService();
    const auditService = new AuditService();

    // Get current settings for audit log
    const oldSettings = await settingsService.getSettings();

    // Update settings
    const updatedSettings = await settingsService.updateSettings(validatedData, user.id);

    // Log the action
    await auditService.logAction({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'Settings',
      entityId: updatedSettings.id,
      details: {
        before: oldSettings,
        after: updatedSettings,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Revalidate cache
    revalidateTag('settings');

    return NextResponse.json(updatedSettings);
  } catch (error) {
    return handleAPIError(error);
  }
}
