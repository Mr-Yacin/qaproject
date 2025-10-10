'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, FileText, Download, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AuditFilters } from './AuditFilters';
import { AuditDetails } from './AuditDetails';

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

interface AuditLogTableProps {
    initialLogs: AuditLog[];
    initialTotal: number;
    initialHasMore: boolean;
}

/**
 * Audit Log Table Component
 * Displays audit logs with filtering, pagination, and export
 * Requirements: 8.1, 8.3, 8.4, 8.6, 8.8
 */
export function AuditLogTable({
    initialLogs,
    initialTotal,
    initialHasMore,
}: AuditLogTableProps) {
    const { toast } = useToast();
    const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
    const [total, setTotal] = useState(initialTotal);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [offset, setOffset] = useState(0);
    const [filters, setFilters] = useState<{
        userId?: string;
        action?: string;
        entityType?: string;
        startDate?: string;
        endDate?: string;
    }>({});

    const limit = 50;

    const fetchLogs = async (newOffset: number = 0, newFilters = filters) => {
        try {
            setLoading(true);

            const params = new URLSearchParams({
                limit: limit.toString(),
                offset: newOffset.toString(),
            });

            if (newFilters.userId) params.append('userId', newFilters.userId);
            if (newFilters.action) params.append('action', newFilters.action);
            if (newFilters.entityType) params.append('entityType', newFilters.entityType);
            if (newFilters.startDate) params.append('startDate', newFilters.startDate);
            if (newFilters.endDate) params.append('endDate', newFilters.endDate);

            const response = await fetch(`/api/admin/audit-log?${params}`);

            if (!response.ok) {
                throw new Error('Failed to fetch audit logs');
            }

            const data = await response.json();
            setLogs(data.logs);
            setTotal(data.total);
            setHasMore(data.hasMore);
            setOffset(newOffset);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to fetch audit logs',
                variant: 'destructive',
            });
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (newFilters: typeof filters) => {
        setFilters(newFilters);
        fetchLogs(0, newFilters);
    };

    const handleExport = async () => {
        try {
            setExporting(true);

            const params = new URLSearchParams();
            if (filters.userId) params.append('userId', filters.userId);
            if (filters.action) params.append('action', filters.action);
            if (filters.entityType) params.append('entityType', filters.entityType);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const response = await fetch(`/api/admin/audit-log/export?${params}`);

            if (!response.ok) {
                throw new Error('Failed to export audit logs');
            }

            // Download the CSV file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-log-${new Date().toISOString()}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast({
                title: 'Success',
                description: 'Audit log exported successfully',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to export audit logs',
                variant: 'destructive',
            });
            console.error('Failed to export audit logs:', error);
        } finally {
            setExporting(false);
        }
    };

    const handlePrevious = () => {
        const newOffset = Math.max(0, offset - limit);
        fetchLogs(newOffset);
    };

    const handleNext = () => {
        if (hasMore) {
            fetchLogs(offset + limit);
        }
    };

    const getActionBadgeColor = (action: string) => {
        switch (action) {
            case 'CREATE':
                return 'bg-green-100 text-green-800';
            case 'UPDATE':
                return 'bg-blue-100 text-blue-800';
            case 'DELETE':
                return 'bg-red-100 text-red-800';
            case 'LOGIN':
                return 'bg-purple-100 text-purple-800';
            case 'LOGOUT':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Audit Log</h1>
                    <p className="text-muted-foreground mt-1">
                        View and export admin activity logs
                    </p>
                </div>
                <Button onClick={handleExport} disabled={exporting}>
                    {exporting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="mr-2 h-4 w-4" />
                    )}
                    Export CSV
                </Button>
            </div>

            {/* Filters */}
            <AuditFilters filters={filters} onFilterChange={handleFilterChange} />

            {/* Audit Log Table */}
            <Card>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">No audit logs found</h3>
                        <p className="text-muted-foreground mt-2">
                            {Object.keys(filters).length > 0
                                ? 'Try adjusting your filters'
                                : 'Audit logs will appear here as actions are performed'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b">
                                    <tr>
                                        <th className="text-left p-4 font-medium">Timestamp</th>
                                        <th className="text-left p-4 font-medium">User</th>
                                        <th className="text-left p-4 font-medium">Action</th>
                                        <th className="text-left p-4 font-medium">Entity</th>
                                        <th className="text-left p-4 font-medium">IP Address</th>
                                        <th className="text-right p-4 font-medium">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => (
                                        <tr
                                            key={log.id}
                                            className="border-b last:border-0 hover:bg-muted/50"
                                        >
                                            <td className="p-4 text-sm">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </td>
                                            <td className="p-4">
                                                <div>
                                                    <div className="font-medium">{log.user.name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {log.user.email}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(
                                                        log.action
                                                    )}`}
                                                >
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div>
                                                    <div className="font-medium">{log.entityType}</div>
                                                    {log.entityId && (
                                                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                            {log.entityId}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground">
                                                {log.ipAddress || '-'}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedLog(log)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between p-4 border-t">
                            <div className="text-sm text-muted-foreground">
                                Showing {offset + 1} to {Math.min(offset + limit, total)} of {total}{' '}
                                entries
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePrevious}
                                    disabled={offset === 0 || loading}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleNext}
                                    disabled={!hasMore || loading}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </Card>

            {/* Details Modal */}
            {selectedLog && (
                <AuditDetails log={selectedLog} onClose={() => setSelectedLog(null)} />
            )}
        </div>
    );
}
