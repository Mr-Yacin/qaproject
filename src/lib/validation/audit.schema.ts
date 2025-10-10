import { z } from 'zod';
import { AuditAction } from '@prisma/client';

export const auditLogFiltersSchema = z.object({
  userId: z.string().optional(),
  action: z.nativeEnum(AuditAction).optional(),
  entityType: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const auditLogExportFiltersSchema = z.object({
  userId: z.string().optional(),
  action: z.nativeEnum(AuditAction).optional(),
  entityType: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(10000).default(10000),
  offset: z.coerce.number().int().min(0).default(0),
});

export type AuditLogFiltersInput = z.infer<typeof auditLogFiltersSchema>;
export type AuditLogExportFiltersInput = z.infer<typeof auditLogExportFiltersSchema>;
