import { z } from 'zod';

/**
 * Page creation schema
 * Validates input for creating a new page
 */
export const CreatePageSchema = z.object({
  slug: z.string()
    .min(1, 'Slug is required')
    .max(255, 'Slug must be less than 255 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  content: z.string()
    .min(1, 'Content is required'),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  seoTitle: z.string()
    .max(60, 'SEO title must be less than 60 characters')
    .optional()
    .nullable(),
  seoDescription: z.string()
    .max(160, 'SEO description must be less than 160 characters')
    .optional()
    .nullable(),
  seoKeywords: z.array(z.string()).default([]),
});

/**
 * Page update schema
 * Validates input for updating an existing page
 * All fields are optional for partial updates
 */
export const UpdatePageSchema = z.object({
  slug: z.string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  title: z.string()
    .min(1)
    .max(200)
    .optional(),
  content: z.string()
    .min(1)
    .optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  seoTitle: z.string()
    .max(60)
    .optional()
    .nullable(),
  seoDescription: z.string()
    .max(160)
    .optional()
    .nullable(),
  seoKeywords: z.array(z.string()).optional(),
});

/**
 * Page query schema for listing pages
 * Validates query parameters for filtering and pagination
 */
export const PageQuerySchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Export TypeScript types inferred from schemas
export type CreatePageInput = z.infer<typeof CreatePageSchema>;
export type UpdatePageInput = z.infer<typeof UpdatePageSchema>;
export type PageQuery = z.infer<typeof PageQuerySchema>;
