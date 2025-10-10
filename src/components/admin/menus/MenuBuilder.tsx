'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MenuItemForm } from './MenuItemForm';

interface MenuItem {
  id: string;
  label: string;
  url: string;
  order: number;
  parentId: string | null;
  isExternal: boolean;
  openNewTab: boolean;
  children?: MenuItem[];
}

interface MenuBuilderProps {
  initialMenuItems: MenuItem[];
}

/**
 * Menu Builder Component
 * Drag-and-drop interface for managing menu items
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.6
 */
export function MenuBuilder({ initialMenuItems }: MenuBuilderProps) {
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<MenuItem | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | 'inside' | null>(null);
  const [reordering, setReordering] = useState(false);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/admin/menus');
      if (!response.ok) {
        throw new Error('Failed to fetch menu items');
      }
      const data = await response.json();
      setMenuItems(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch menu items',
        variant: 'destructive',
      });
      console.error('Failed to fetch menu items:', error);
    }
  };

  const handleCreate = async (data: Partial<MenuItem>) => {
    try {
      const response = await fetch('/api/admin/menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create menu item');
      }

      toast({
        title: 'Success',
        description: 'Menu item created successfully',
      });

      setShowCreateForm(false);
      await fetchMenuItems();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create menu item',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleUpdate = async (data: Partial<MenuItem>) => {
    if (!editingItem) return;

    try {
      const response = await fetch(`/api/admin/menus/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update menu item');
      }

      toast({
        title: 'Success',
        description: 'Menu item updated successfully',
      });

      setEditingItem(null);
      await fetchMenuItems();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update menu item',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(`Are you sure you want to delete "${item.label}"?${item.children?.length ? ' This will also delete all child items.' : ''}`)) {
      return;
    }

    try {
      setDeletingId(item.id);
      const response = await fetch(`/api/admin/menus/${item.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete menu item');
      }

      toast({
        title: 'Success',
        description: 'Menu item deleted successfully',
      });

      await fetchMenuItems();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete menu item',
        variant: 'destructive',
      });
      console.error('Failed to delete menu item:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const getAllMenuItems = (items: MenuItem[]): MenuItem[] => {
    const result: MenuItem[] = [];
    const traverse = (items: MenuItem[]) => {
      items.forEach((item) => {
        result.push(item);
        if (item.children) {
          traverse(item.children);
        }
      });
    };
    traverse(items);
    return result;
  };

  const getParentOptions = (): { id: string; label: string }[] => {
    return getAllMenuItems(menuItems)
      .filter((item) => !item.parentId)
      .map((item) => ({ id: item.id, label: item.label }));
  };

  const handleReorder = async (items: { id: string; order: number; parentId: string | null }[]) => {
    try {
      setReordering(true);
      const response = await fetch('/api/admin/menus/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reorder menu items');
      }

      toast({
        title: 'Success',
        description: 'Menu items reordered successfully',
      });

      await fetchMenuItems();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reorder menu items',
        variant: 'destructive',
      });
      console.error('Failed to reorder menu items:', error);
    } finally {
      setReordering(false);
    }
  };

  const handleDrop = (targetItem: MenuItem, position: 'before' | 'after' | 'inside') => {
    if (!draggedItem || draggedItem.id === targetItem.id) {
      return;
    }

    // Get all items as flat list
    const allItems = getAllMenuItems(menuItems);
    
    // Calculate new order and parentId based on drop position
    const reorderItems: { id: string; order: number; parentId: string | null }[] = [];

    if (position === 'inside') {
      // Make dragged item a child of target
      const targetChildren = allItems.filter(item => item.parentId === targetItem.id);
      const newOrder = targetChildren.length;
      
      reorderItems.push({
        id: draggedItem.id,
        order: newOrder,
        parentId: targetItem.id,
      });
    } else {
      // Reorder at same level as target
      const siblings = allItems.filter(item => item.parentId === targetItem.parentId);
      const targetIndex = siblings.findIndex(item => item.id === targetItem.id);
      const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;

      // Remove dragged item from siblings if it's at the same level
      const filteredSiblings = siblings.filter(item => item.id !== draggedItem.id);
      
      // Insert dragged item at new position
      filteredSiblings.splice(insertIndex, 0, draggedItem);

      // Update order for all siblings
      filteredSiblings.forEach((item, index) => {
        reorderItems.push({
          id: item.id,
          order: index,
          parentId: targetItem.parentId,
        });
      });
    }

    handleReorder(reorderItems);
  };

  const handleDragOver = (e: React.DragEvent, itemId: string, position: 'before' | 'after' | 'inside') => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverItem(itemId);
    setDropPosition(position);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    // Only clear if we're actually leaving the component
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDragOverItem(null);
      setDropPosition(null);
    }
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const isDragging = draggedItem?.id === item.id;
    const isDragOverBefore = dragOverItem === item.id && dropPosition === 'before';
    const isDragOverAfter = dragOverItem === item.id && dropPosition === 'after';
    const isDragOverInside = dragOverItem === item.id && dropPosition === 'inside';

    return (
      <div key={item.id} className="relative group">
        {/* Drop zone before item */}
        <div
          className={`relative transition-all ${
            draggedItem && !isDragging ? 'h-6' : 'h-1'
          } ${
            isDragOverBefore ? 'h-10' : ''
          }`}
          onDragOver={(e) => handleDragOver(e, item.id, 'before')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDrop(item, 'before');
            setDragOverItem(null);
            setDropPosition(null);
          }}
        >
          {isDragOverBefore && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-1 bg-blue-500 rounded-full shadow-lg">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
              </div>
            </div>
          )}
        </div>

        <div
          className={`flex items-center gap-2 p-3 border rounded-lg transition-all relative bg-white ${
            level > 0 ? 'ml-8' : ''
          } ${
            isDragging ? 'opacity-40 scale-95 cursor-grabbing' : 'cursor-grab hover:shadow-md'
          } ${
            isDragOverInside ? 'ring-2 ring-green-500 bg-green-50 shadow-lg scale-105' : ''
          } ${
            draggedItem && !isDragging && !isDragOverInside ? 'hover:bg-blue-50' : ''
          }`}
          draggable
          onDragStart={(e) => {
            setDraggedItem(item);
            e.dataTransfer.effectAllowed = 'move';
            // Add a custom drag image
            const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
            dragImage.style.opacity = '0.8';
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, 0, 0);
            setTimeout(() => document.body.removeChild(dragImage), 0);
          }}
          onDragEnd={() => {
            setDraggedItem(null);
            setDragOverItem(null);
            setDropPosition(null);
          }}
          onDragOver={(e) => handleDragOver(e, item.id, 'inside')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDrop(item, 'inside');
            setDragOverItem(null);
            setDropPosition(null);
          }}
        >
          <div className="cursor-move">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(item.id);
              }}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{item.label}</span>
              {item.isExternal && (
                <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              )}
            </div>
            <span className="text-sm text-muted-foreground truncate block">{item.url}</span>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setEditingItem(item);
              }}
              disabled={reordering}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(item);
              }}
              disabled={deletingId === item.id || reordering}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {deletingId === item.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 text-destructive" />
              )}
            </Button>
          </div>

          {isDragOverInside && (
            <div className="absolute inset-0 border-2 border-green-500 rounded-lg pointer-events-none flex items-center justify-center">
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded font-medium">
                Drop to nest as child
              </span>
            </div>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-0">
            {item.children!.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}

        {/* Drop zone after item */}
        <div
          className={`relative transition-all ${
            draggedItem && !isDragging ? 'h-6' : 'h-1'
          } ${
            isDragOverAfter ? 'h-10' : ''
          }`}
          onDragOver={(e) => handleDragOver(e, item.id, 'after')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDrop(item, 'after');
            setDragOverItem(null);
            setDropPosition(null);
          }}
        >
          {isDragOverAfter && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-1 bg-blue-500 rounded-full shadow-lg">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (showCreateForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Create Menu Item</h2>
        </div>
        <MenuItemForm
          parentOptions={getParentOptions()}
          onSave={handleCreate}
          onCancel={() => setShowCreateForm(false)}
        />
      </div>
    );
  }

  if (editingItem) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Edit Menu Item</h2>
        </div>
        <MenuItemForm
          item={editingItem}
          parentOptions={getParentOptions()}
          onSave={handleUpdate}
          onCancel={() => setEditingItem(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Menu Structure</h2>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Menu Item
        </Button>
      </div>

      <Card className="p-4">
        {reordering && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm text-blue-600">Reordering menu items...</span>
          </div>
        )}
        
        {menuItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No menu items yet</p>
            <Button
              className="mt-4"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create First Menu Item
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {menuItems.map((item) => renderMenuItem(item))}
          </div>
        )}
      </Card>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="space-y-2">
          <p className="font-semibold text-sm flex items-center gap-2">
            <GripVertical className="h-4 w-4" />
            How to Reorder Menu Items
          </p>
          <ul className="text-sm space-y-1.5 ml-6">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span><strong>Drag</strong> items by clicking and holding the grip icon (⋮⋮)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span><strong>Drop on blue line</strong> above/below items to reorder at same level</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">•</span>
              <span><strong>Drop on green item</strong> to make it a nested child menu</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-600 font-bold">•</span>
              <span>Hover over items to see edit/delete buttons</span>
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
