'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';

interface AuditLog {
  id: string;
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
  entityType: string;
  entityId: string | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

interface AuditDetailsProps {
  log: AuditLog;
  onClose: () => void;
}

/**
 * Audit Details Modal Component
 * Displays detailed information about an audit log entry
 * Requirements: 8.4, 8.6
 */
export function AuditDetails({ log, onClose }: AuditDetailsProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Audit Log Details</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Log ID
                </div>
                <div className="mt-1 font-mono text-sm">{log.id}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Timestamp
                </div>
                <div className="mt-1">{new Date(log.createdAt).toLocaleString()}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Action
                </div>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      log.action === 'CREATE'
                        ? 'bg-green-100 text-green-800'
                        : log.action === 'UPDATE'
                        ? 'bg-blue-100 text-blue-800'
                        : log.action === 'DELETE'
                        ? 'bg-red-100 text-red-800'
                        : log.action === 'LOGIN'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {log.action}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Entity Type
                </div>
                <div className="mt-1">{log.entityType}</div>
              </div>
            </div>

            {log.entityId && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Entity ID
                </div>
                <div className="mt-1 font-mono text-sm break-all">{log.entityId}</div>
              </div>
            )}
          </div>

          {/* User Information */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">User Information</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Name
                  </div>
                  <div className="mt-1">{log.user.name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Email
                  </div>
                  <div className="mt-1">{log.user.email}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Role
                  </div>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        log.user.role === 'ADMIN'
                          ? 'bg-red-100 text-red-800'
                          : log.user.role === 'EDITOR'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {log.user.role}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    User ID
                  </div>
                  <div className="mt-1 font-mono text-sm">{log.userId}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Request Information */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Request Information</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  IP Address
                </div>
                <div className="mt-1 font-mono text-sm">
                  {log.ipAddress || 'Not available'}
                </div>
              </div>
              {log.userAgent && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    User Agent
                  </div>
                  <div className="mt-1 text-sm break-all">{log.userAgent}</div>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          {log.details && Object.keys(log.details).length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Additional Details</h3>
              <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="border-t pt-4">
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
