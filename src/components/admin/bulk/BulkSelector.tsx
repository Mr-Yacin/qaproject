'use client';

import { Checkbox } from '@/components/ui/checkbox';

interface BulkSelectorProps {
  selectedIds: string[];
  allIds: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
}

/**
 * BulkSelector Component
 * Provides checkbox selection for bulk operations
 * Requirements: 10.1
 */
export function BulkSelector({
  selectedIds,
  allIds,
  onSelectAll,
  onSelectOne,
}: BulkSelectorProps) {
  const allSelected = allIds.length > 0 && selectedIds.length === allIds.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < allIds.length;

  return {
    // Header checkbox for select all
    HeaderCheckbox: () => (
      <Checkbox
        checked={allSelected}
        onCheckedChange={onSelectAll}
        aria-label="Select all"
        className={someSelected ? 'data-[state=checked]:bg-primary/50' : ''}
      />
    ),
    // Row checkbox for individual selection
    RowCheckbox: ({ id }: { id: string }) => (
      <Checkbox
        checked={selectedIds.includes(id)}
        onCheckedChange={(checked) => onSelectOne(id, checked as boolean)}
        aria-label={`Select item ${id}`}
      />
    ),
  };
}
