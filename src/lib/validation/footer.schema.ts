import { z } from 'zod';

/**
 * Footer settings schema
 * Validates input for footer settings (copyright, social links)
 */
export const FooterSettingsSchema = z.object({
  copyrightText: z.string()
    .min(1, 'Copyright text is required')
    .max(200, 'Copyright text must be less than 200 characters'),
  socialLinks: z.record(z.string().url('Invalid URL format'))
    .optional()
    .nullable(),
});

/**
 * Footer column creation schema
 * Validates input for creating a new footer column
 */
export const CreateFooterColumnSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(50, 'Title must be less than 50 characters'),
  order: z.number()
    .int('Order must be an integer')
    .min(0, 'Order must be non-negative'),
});

/**
 * Footer column update schema
 * Validates input for updating an existing footer column
 * All fields are optional for partial updates
 */
export const UpdateFooterColumnSchema = z.object({
  title: z.string()
    .min(1)
    .max(50)
    .optional(),
  order: z.number()
    .int()
    .min(0)
    .optional(),
});

/**
 * Footer link creation schema
 * Validates input for creating a new footer link
 */
export const CreateFooterLinkSchema = z.object({
  columnId: z.string()
    .min(1, 'Column ID is required'),
  label: z.string()
    .min(1, 'Label is required')
    .max(50, 'Label must be less than 50 characters'),
  url: z.string()
    .min(1, 'URL is required')
    .max(500, 'URL must be less than 500 characters'),
  order: z.number()
    .int('Order must be an integer')
    .min(0, 'Order must be non-negative'),
});

/**
 * Footer link update schema
 * Validates input for updating an existing footer link
 * All fields are optional for partial updates
 */
export const UpdateFooterLinkSchema = z.object({
  columnId: z.string().optional(),
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
});

// Export TypeScript types inferred from schemas
export type FooterSettingsInput = z.infer<typeof FooterSettingsSchema>;
export type CreateFooterColumnInput = z.infer<typeof CreateFooterColumnSchema>;
export type UpdateFooterColumnInput = z.infer<typeof UpdateFooterColumnSchema>;
export type CreateFooterLinkInput = z.infer<typeof CreateFooterLinkSchema>;
export type UpdateFooterLinkInput = z.infer<typeof UpdateFooterLinkSchema>;
