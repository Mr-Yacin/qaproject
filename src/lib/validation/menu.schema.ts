import { z } from 'zod';

/**
 * Menu item creation schema
 * Validates input for creating a new menu item
 */
export const CreateMenuItemSchema = z.object({
  label: z.string()
    .min(1, 'Label is required')
    .max(50, 'Label must be less than 50 characters'),
  url: z.string()
    .min(1, 'URL is required')
    .max(500, 'URL must be less than 500 characters'),
  order: z.number()
    .int('Order must be an integer')
    .min(0, 'Order must be non-negative'),
  parentId: z.string()
    .optional()
    .nullable(),
  isExternal: z.boolean().default(false),
  openNewTab: z.boolean().default(false),
});

/**
 * Menu item update schema
 * Validates input for updating an existing menu item
 * All fields are optional for partial updates
 */
export const UpdateMenuItemSchema = z.object({
  label: z.string()
    .min(1)
    .max(50)
    .optional(),
  url: z.string()
    .min(1)
    .max(500)
    .optional(),
  order: z.number()
    .int()
    .min(0)
    .optional(),
  parentId: z.string()
    .optional()
    .nullable(),
  isExternal: z.boolean().optional(),
  openNewTab: z.boolean().optional(),
});

/**
 * Menu reorder schema
 * Validates input for reordering menu items
 */
export const ReorderMenuItemsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      order: z.number().int().min(0),
      parentId: z.string().optional().nullable(),
    })
  ).min(1, 'At least one item is required'),
});

// Export TypeScript types inferred from schemas
export type CreateMenuItemInput = z.infer<typeof CreateMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof UpdateMenuItemSchema>;
export type ReorderMenuItemsInput = z.infer<typeof ReorderMenuItemsSchema>;
