import { prisma } from '@/lib/db';
import { MenuItem } from '@prisma/client';

export interface CreateMenuItemData {
  label: string;
  url: string;
  order: number;
  parentId?: string | null;
  isExternal?: boolean;
  openNewTab?: boolean;
}

export interface UpdateMenuItemData {
  label?: string;
  url?: string;
  order?: number;
  parentId?: string | null;
  isExternal?: boolean;
  openNewTab?: boolean;
}

export interface MenuItemWithChildren extends MenuItem {
  children?: MenuItemWithChildren[];
}

export interface ReorderItem {
  id: string;
  order: number;
  parentId?: string | null;
}

export class MenuRepository {
  /**
   * Find a menu item by ID
   */
  async findById(id: string): Promise<MenuItem | null> {
    return prisma.menuItem.findUnique({
      where: { id },
    });
  }

  /**
   * Get all menu items with hierarchical structure
   * Returns top-level items with nested children
   */
  async getMenuStructure(): Promise<MenuItemWithChildren[]> {
    // Get all menu items ordered by order field
    const allItems = await prisma.menuItem.findMany({
      orderBy: { order: 'asc' },
    });

    // Build hierarchical structure
    const itemMap = new Map<string, MenuItemWithChildren>();
    const rootItems: MenuItemWithChildren[] = [];

    // First pass: create map of all items
    allItems.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    // Second pass: build hierarchy
    allItems.forEach(item => {
      const menuItem = itemMap.get(item.id)!;
      
      if (item.parentId) {
        const parent = itemMap.get(item.parentId);
        if (parent) {
          parent.children!.push(menuItem);
        } else {
          // Parent not found, treat as root item
          rootItems.push(menuItem);
        }
      } else {
        rootItems.push(menuItem);
      }
    });

    return rootItems;
  }

  /**
   * Get all menu items as flat list
   */
  async list(): Promise<MenuItem[]> {
    return prisma.menuItem.findMany({
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Get children of a specific menu item
   */
  async getChildren(parentId: string): Promise<MenuItem[]> {
    return prisma.menuItem.findMany({
      where: { parentId },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Create a new menu item
   */
  async create(data: CreateMenuItemData): Promise<MenuItem> {
    return prisma.menuItem.create({
      data: {
        label: data.label,
        url: data.url,
        order: data.order,
        parentId: data.parentId,
        isExternal: data.isExternal ?? false,
        openNewTab: data.openNewTab ?? false,
      },
    });
  }

  /**
   * Update an existing menu item
   */
  async update(id: string, data: UpdateMenuItemData): Promise<MenuItem> {
    return prisma.menuItem.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a menu item
   * Note: Children will be cascade deleted due to onDelete: Cascade in schema
   */
  async delete(id: string): Promise<void> {
    await prisma.menuItem.delete({
      where: { id },
    });
  }

  /**
   * Reorder multiple menu items
   * Updates order and parentId for multiple items in a transaction
   */
  async reorder(items: ReorderItem[]): Promise<void> {
    await prisma.$transaction(
      items.map(item =>
        prisma.menuItem.update({
          where: { id: item.id },
          data: {
            order: item.order,
            parentId: item.parentId,
          },
        })
      )
    );
  }

  /**
   * Get the maximum order value for items at a specific level
   * Used to determine the order for new items
   */
  async getMaxOrder(parentId?: string | null): Promise<number> {
    const result = await prisma.menuItem.aggregate({
      where: { parentId: parentId || null },
      _max: { order: true },
    });

    return result._max.order ?? -1;
  }

  /**
   * Check if a menu item has children
   */
  async hasChildren(id: string): Promise<boolean> {
    const count = await prisma.menuItem.count({
      where: { parentId: id },
    });

    return count > 0;
  }

  /**
   * Validate that parent exists (if parentId is provided)
   */
  async validateParent(parentId: string): Promise<boolean> {
    const parent = await prisma.menuItem.findUnique({
      where: { id: parentId },
    });

    return parent !== null;
  }
}
