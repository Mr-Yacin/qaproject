'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Filter, X } from 'lucide-react';

interface AuditFiltersProps {
  filters: {
    userId?: string;
    action?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
  };
  onFilterChange: (filters: AuditFiltersProps['filters']) => void;
}

/**
 * Audit Filters Component
 * Provides filtering controls for audit logs
 * Requirements: 8.3, 8.4
 */
export function AuditFilters({ filters, onFilterChange }: AuditFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApply = () => {
    onFilterChange(localFilters);
  };

  const handleClear = () => {
    const emptyFilters = {};
    setLocalFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filters</span>
          {hasActiveFilters && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
              {Object.keys(filters).length}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Hide' : 'Show'}
        </Button>
      </div>

      {showFilters && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Action Filter */}
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <select
                id="action"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={localFilters.action || ''}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    action: e.target.value || undefined,
                  })
                }
              >
                <option value="">All actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
              </select>
            </div>

            {/* Entity Type Filter */}
            <div className="space-y-2">
              <Label htmlFor="entityType">Entity Type</Label>
              <Input
                id="entityType"
                placeholder="e.g., Topic, Page, User"
                value={localFilters.entityType || ''}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    entityType: e.target.value || undefined,
                  })
                }
              />
            </div>

            {/* User ID Filter */}
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                placeholder="User ID"
                value={localFilters.userId || ''}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    userId: e.target.value || undefined,
                  })
                }
              />
            </div>

            {/* Start Date Filter */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={
                  localFilters.startDate
                    ? new Date(localFilters.startDate)
                        .toISOString()
                        .slice(0, 16)
                    : ''
                }
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    startDate: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : undefined,
                  })
                }
              />
            </div>

            {/* End Date Filter */}
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={
                  localFilters.endDate
                    ? new Date(localFilters.endDate).toISOString().slice(0, 16)
                    : ''
                }
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    endDate: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : undefined,
                  })
                }
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button onClick={handleApply}>Apply Filters</Button>
            <Button variant="outline" onClick={handleClear}>
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
