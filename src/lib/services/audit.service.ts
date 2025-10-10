import { AuditLog, AuditAction } from '@prisma/client';
import {
  AuditRepository,
  CreateAuditLogInput,
  AuditLogFilters,
  PaginatedAuditLogs,
} from '@/lib/repositories/audit.repository';

export interface LogActionInput {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  private auditRepository: AuditRepository;

  constructor(auditRepository: AuditRepository = new AuditRepository()) {
    this.auditRepository = auditRepository;
  }

  async logAction(input: LogActionInput): Promise<AuditLog> {
    return this.auditRepository.create(input);
  }

  async logCreate(
    userId: string,
    entityType: string,
    entityId: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return this.logAction({
      userId,
      action: AuditAction.CREATE,
      entityType,
      entityId,
      details,
      ipAddress,
      userAgent,
    });
  }

  async logUpdate(
    userId: string,
    entityType: string,
    entityId: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return this.logAction({
      userId,
      action: AuditAction.UPDATE,
      entityType,
      entityId,
      details,
      ipAddress,
      userAgent,
    });
  }

  async logDelete(
    userId: string,
    entityType: string,
    entityId: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return this.logAction({
      userId,
      action: AuditAction.DELETE,
      entityType,
      entityId,
      details,
      ipAddress,
      userAgent,
    });
  }

  async logLogin(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return this.logAction({
      userId,
      action: AuditAction.LOGIN,
      entityType: 'User',
      entityId: userId,
      ipAddress,
      userAgent,
    });
  }

  async logLogout(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return this.logAction({
      userId,
      action: AuditAction.LOGOUT,
      entityType: 'User',
      entityId: userId,
      ipAddress,
      userAgent,
    });
  }

  async getAuditLogs(filters: AuditLogFilters): Promise<PaginatedAuditLogs> {
    return this.auditRepository.findMany(filters);
  }

  async getAuditLogById(id: string): Promise<AuditLog | null> {
    return this.auditRepository.findById(id);
  }

  async exportAuditLog(filters: AuditLogFilters): Promise<string> {
    const { logs } = await this.auditRepository.findMany({
      ...filters,
      limit: 10000, // Max export limit
    });

    // Convert to CSV
    const headers = [
      'ID',
      'User Email',
      'User Name',
      'Action',
      'Entity Type',
      'Entity ID',
      'IP Address',
      'User Agent',
      'Created At',
      'Details',
    ];

    const rows = logs.map((log: any) => [
      log.id,
      log.user?.email || '',
      log.user?.name || '',
      log.action,
      log.entityType,
      log.entityId || '',
      log.ipAddress || '',
      log.userAgent || '',
      log.createdAt.toISOString(),
      JSON.stringify(log.details || {}),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    return csvContent;
  }

  async archiveOldLogs(daysToKeep: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    return this.auditRepository.deleteOldLogs(cutoffDate);
  }
}
