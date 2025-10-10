import { MenuItem } from '@prisma/client';
import {
  MenuRepository,
  CreateMenuItemData,
  UpdateMenuItemData,
  MenuItemWithChildren,
  ReorderItem,
} from '@/lib/repositories/menu.repository';
import {
  CreateMenuItemInput,
  UpdateMenuItemInput,
  ReorderMenuItemsInput,
} from '@/lib/validation/menu.schema';

export class MenuItemNotFoundError extends Error {
  constructor(id: string) {
    super(`Menu item with ID "${id}" not found`);
    this.name = 'MenuItemNotFoundError';
  }
}

export class InvalidParentError extends Error {
  constructor(parentId: string) {
    super(`Parent menu item with ID "${parentId}" not found`);
    this.name = 'InvalidParentError';
  }
}

export class CircularReferenceError extends Error {
  constructor() {
    super('Cannot set a menu item as its own parent or descendant');
    this.name = 'CircularReferenceError';
  }
}

export class MenuService {
  private menuRepository: MenuRepository;

  constructor(menuRepository: MenuRepository = new MenuRepository()) {
    this.menuRepository = menuRepository;
  }

  /**
   * Get the complete menu structure with hierarchical nesting
   */
  async getMenuStructure(): Promise<MenuItemWithChildren[]> {
    return this.menuRepository.getMenuStructure();
  }

  /**
   * Get all menu items as a flat list
   */
  async listMenuItems(): Promise<MenuItem[]> {
    return this.menuRepository.list();
  }

  /**
   * Get a menu item by ID
   */
  async getMenuItemById(id: string): Promise<MenuItem | null> {
    return this.menuRepository.findById(id);
  }

  /**
   * Create a new menu item
   * Validates parent existence if parentId is provided
   * Automatically assigns order if not provided
   */
  async createMenuItem(data: CreateMenuItemInput): Promise<MenuItem> {
    // Validate parent exists if parentId is provided
    if (data.parentId) {
      const parentExists = await this.menuRepository.validateParent(data.parentId);
      if (!parentExists) {
        throw new InvalidParentError(data.parentId);
      }
    }

    // If order is not provided or is 0, get the next available order
    let order = data.order;
    if (order === undefined || order === 0) {
      const maxOrder = await this.menuRepository.getMaxOrder(data.parentId);
      order = maxOrder + 1;
    }

    const createData: CreateMenuItemData = {
      label: data.label,
      url: data.url,
      order,
      parentId: data.parentId,
      isExternal: data.isExternal,
      openNewTab: data.openNewTab,
    };

    return this.menuRepository.create(createData);
  }

  /**
   * Update an existing menu item
   * Validates parent existence if parentId is being changed
   * Prevents circular references
   */
  async updateMenuItem(id: string, data: UpdateMenuItemInput): Promise<MenuItem> {
    // Check if menu item exists
    const existingItem = await this.menuRepository.findById(id);
    if (!existingItem) {
      throw new MenuItemNotFoundError(id);
    }

    // If parentId is being changed, validate it
    if (data.parentId !== undefined) {
      // Check for circular reference (item cannot be its own parent)
      if (data.parentId === id) {
        throw new CircularReferenceError();
      }

      // If parentId is not null, validate parent exists
      if (data.parentId) {
        const parentExists = await this.menuRepository.validateParent(data.parentId);
        if (!parentExists) {
          throw new InvalidParentError(data.parentId);
        }

        // Check if the new parent is a descendant of this item
        const isDescendant = await this.isDescendant(id, data.parentId);
        if (isDescendant) {
          throw new CircularReferenceError();
        }
      }
    }

    const updateData: UpdateMenuItemData = {
      label: data.label,
      url: data.url,
      order: data.order,
      parentId: data.parentId,
      isExternal: data.isExternal,
      openNewTab: data.openNewTab,
    };

    return this.menuRepository.update(id, updateData);
  }

  /**
   * Delete a menu item
   * Note: Children will be cascade deleted
   */
  async deleteMenuItem(id: string): Promise<void> {
    // Check if menu item exists
    const existingItem = await this.menuRepository.findById(id);
    if (!existingItem) {
      throw new MenuItemNotFoundError(id);
    }

    await this.menuRepository.delete(id);
  }

  /**
   * Reorder multiple menu items
   * Updates order and optionally parentId for multiple items
   */
  async reorderMenuItems(data: ReorderMenuItemsInput): Promise<void> {
    // Validate all items exist
    for (const item of data.items) {
      const exists = await this.menuRepository.findById(item.id);
      if (!exists) {
        throw new MenuItemNotFoundError(item.id);
      }

      // Validate parent if provided
      if (item.parentId) {
        const parentExists = await this.menuRepository.validateParent(item.parentId);
        if (!parentExists) {
          throw new InvalidParentError(item.parentId);
        }

        // Check for circular reference
        if (item.parentId === item.id) {
          throw new CircularReferenceError();
        }
      }
    }

    const reorderItems: ReorderItem[] = data.items.map(item => ({
      id: item.id,
      order: item.order,
      parentId: item.parentId,
    }));

    await this.menuRepository.reorder(reorderItems);
  }

  /**
   * Check if a menu item is a descendant of another item
   * Used to prevent circular references
   */
  private async isDescendant(ancestorId: string, descendantId: string): Promise<boolean> {
    const descendant = await this.menuRepository.findById(descendantId);
    if (!descendant) {
      return false;
    }

    // If descendant has no parent, it's not a descendant of ancestorId
    if (!descendant.parentId) {
      return false;
    }

    // If descendant's parent is the ancestor, it's a descendant
    if (descendant.parentId === ancestorId) {
      return true;
    }

    // Recursively check if descendant's parent is a descendant of ancestor
    return this.isDescendant(ancestorId, descendant.parentId);
  }

  /**
   * Get children of a specific menu item
   */
  async getChildren(parentId: string): Promise<MenuItem[]> {
    return this.menuRepository.getChildren(parentId);
  }

  /**
   * Check if a menu item has children
   */
  async hasChildren(id: string): Promise<boolean> {
    return this.menuRepository.hasChildren(id);
  }
}
