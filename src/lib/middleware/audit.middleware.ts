import { NextRequest } from 'next/server';
import { AuditAction } from '@prisma/client';
import { AuditService } from '@/lib/services/audit.service';
import { AuthenticatedUser } from '@/lib/middleware/auth.middleware';

export interface AuditContext {
  user: AuthenticatedUser;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  details?: any;
}

/**
 * Extract IP address from request
 */
export function getIpAddress(request: NextRequest): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return undefined;
}

/**
 * Extract user agent from request
 */
export function getUserAgent(request: NextRequest): string | undefined {
  return request.headers.get('user-agent') || undefined;
}

/**
 * Log audit action
 */
export async function logAudit(
  context: AuditContext,
  request?: NextRequest
): Promise<void> {
  const auditService = new AuditService();
  
  const ipAddress = request ? getIpAddress(request) : undefined;
  const userAgent = request ? getUserAgent(request) : undefined;

  await auditService.logAction({
    userId: context.user.id,
    action: context.action,
    entityType: context.entityType,
    entityId: context.entityId,
    details: context.details,
    ipAddress,
    userAgent,
  });
}

/**
 * Audit middleware wrapper for API routes
 * Automatically logs the action after successful execution
 */
export function withAudit<T>(
  handler: (request: NextRequest, context: AuditContext) => Promise<T>,
  getAuditContext: (result: T, request: NextRequest) => AuditContext
) {
  return async (request: NextRequest): Promise<T> => {
    const result = await handler(request, {} as AuditContext);
    
    try {
      const auditContext = getAuditContext(result, request);
      await logAudit(auditContext, request);
    } catch (error) {
      // Log error but don't fail the request
      console.error('Failed to log audit:', error);
    }
    
    return result;
  };
}

/**
 * Create audit context helper
 */
export function createAuditContext(
  user: AuthenticatedUser,
  action: AuditAction,
  entityType: string,
  entityId?: string,
  details?: any
): AuditContext {
  return {
    user,
    action,
    entityType,
    entityId,
    details,
  };
}
