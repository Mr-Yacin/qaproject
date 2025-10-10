'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  url: string;
  order: number;
  parentId: string | null;
  isExternal: boolean;
  openNewTab: boolean;
}

interface MenuItemFormProps {
  item?: MenuItem;
  parentOptions: { id: string; label: string }[];
  onSave: (data: Partial<MenuItem>) => Promise<void>;
  onCancel: () => void;
}

/**
 * Menu Item Form Component
 * Form for creating or editing a menu item
 * Requirements: 4.2
 */
export function MenuItemForm({
  item,
  parentOptions,
  onSave,
  onCancel,
}: MenuItemFormProps) {
  const [label, setLabel] = useState(item?.label || '');
  const [url, setUrl] = useState(item?.url || '');
  const [order, setOrder] = useState(item?.order?.toString() || '0');
  const [parentId, setParentId] = useState<string>(item?.parentId || '');
  const [isExternal, setIsExternal] = useState(item?.isExternal || false);
  const [openNewTab, setOpenNewTab] = useState(item?.openNewTab || false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!label.trim()) {
      newErrors.label = 'Label is required';
    } else if (label.length > 50) {
      newErrors.label = 'Label must be less than 50 characters';
    }

    if (!url.trim()) {
      newErrors.url = 'URL is required';
    } else if (url.length > 500) {
      newErrors.url = 'URL must be less than 500 characters';
    }

    const orderNum = parseInt(order);
    if (isNaN(orderNum) || orderNum < 0) {
      newErrors.order = 'Order must be a non-negative number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setSaving(true);
      await onSave({
        label: label.trim(),
        url: url.trim(),
        order: parseInt(order),
        parentId: parentId || null,
        isExternal,
        openNewTab,
      });
    } catch (error) {
      console.error('Failed to save menu item:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="label" className="block text-sm font-medium mb-2">
            Label *
          </label>
          <Input
            id="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Home"
            maxLength={50}
          />
          {errors.label && (
            <p className="text-sm text-destructive mt-1">{errors.label}</p>
          )}
        </div>

        <div>
          <label htmlFor="url" className="block text-sm font-medium mb-2">
            URL *
          </label>
          <Input
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/about or https://example.com"
            maxLength={500}
          />
          {errors.url && (
            <p className="text-sm text-destructive mt-1">{errors.url}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            Use relative paths (e.g., /about) for internal links or full URLs for external links
          </p>
        </div>

        <div>
          <label htmlFor="order" className="block text-sm font-medium mb-2">
            Order
          </label>
          <Input
            id="order"
            type="number"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            min="0"
          />
          {errors.order && (
            <p className="text-sm text-destructive mt-1">{errors.order}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            Lower numbers appear first
          </p>
        </div>

        <div>
          <label htmlFor="parentId" className="block text-sm font-medium mb-2">
            Parent Menu Item
          </label>
          <select
            id="parentId"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">None (Top Level)</option>
            {parentOptions
              .filter((option) => option.id !== item?.id)
              .map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
          </select>
          <p className="text-sm text-muted-foreground mt-1">
            Select a parent to create a nested menu item
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isExternal"
            checked={isExternal}
            onChange={(e) => setIsExternal(e.target.checked)}
            className="rounded border-input"
          />
          <label htmlFor="isExternal" className="text-sm cursor-pointer">
            External Link
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="openNewTab"
            checked={openNewTab}
            onChange={(e) => setOpenNewTab(e.target.checked)}
            className="rounded border-input"
          />
          <label htmlFor="openNewTab" className="text-sm cursor-pointer">
            Open in New Tab
          </label>
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {item ? 'Update' : 'Create'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
