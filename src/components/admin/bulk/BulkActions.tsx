'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Trash2, Edit, Download, Upload } from 'lucide-react';

export type BulkAction = 'delete' | 'update-status' | 'add-tags' | 'remove-tags' | 'export' | 'import';

interface BulkActionsProps {
  selectedCount: number;
  onAction: (action: BulkAction) => void;
  disabled?: boolean;
}

/**
 * BulkActions Component
 * Dropdown menu for bulk operations
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */
export function BulkActions({ selectedCount, onAction, disabled }: BulkActionsProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">
        {selectedCount} selected
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={disabled}>
            Bulk Actions
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onClick={() => onAction('update-status')}>
            <Edit className="mr-2 h-4 w-4" />
            Update Status
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction('add-tags')}>
            <Edit className="mr-2 h-4 w-4" />
            Add Tags
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction('remove-tags')}>
            <Edit className="mr-2 h-4 w-4" />
            Remove Tags
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onAction('export')}>
            <Download className="mr-2 h-4 w-4" />
            Export Selected
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onAction('delete')}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onAction('import')}
        disabled={disabled}
      >
        <Upload className="mr-2 h-4 w-4" />
        Import Topics
      </Button>
    </div>
  );
}
