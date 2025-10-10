import { z } from 'zod';
import { ContentStatus } from '@prisma/client';

/**
 * Bulk delete schema
 * Validates input for bulk deleting topics
 */
export const BulkDeleteSchema = z.object({
  topicIds: z.array(z.string().cuid())
    .min(1, 'At least one topic ID is required')
    .max(100, 'Cannot delete more than 100 topics at once'),
});

/**
 * Bulk update schema
 * Validates input for bulk updating topics
 */
export const BulkUpdateSchema = z.object({
  topicIds: z.array(z.string().cuid())
    .min(1, 'At least one topic ID is required')
    .max(100, 'Cannot update more than 100 topics at once'),
  updates: z.object({
    status: z.nativeEnum(ContentStatus).optional(),
    tags: z.object({
      add: z.array(z.string()).optional(),
      remove: z.array(z.string()).optional(),
    }).optional(),
  }).refine(
    (data) => data.status !== undefined || data.tags !== undefined,
    { message: 'At least one update field is required' }
  ),
});

/**
 * Export topics schema
 * Validates input for exporting topics
 */
export const ExportTopicsSchema = z.object({
  topicIds: z.array(z.string().cuid()).optional(),
  filters: z.object({
    locale: z.string().optional(),
    tag: z.string().optional(),
    status: z.nativeEnum(ContentStatus).optional(),
  }).optional(),
});

/**
 * Import topics schema
 * Validates input for importing topics
 */
export const ImportTopicsSchema = z.object({
  topics: z.array(z.object({
    slug: z.string()
      .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
      .min(1, 'Slug is required')
      .max(200, 'Slug must be less than 200 characters'),
    title: z.string()
      .min(1, 'Title is required')
      .max(200, 'Title must be less than 200 characters'),
    locale: z.string()
      .min(2, 'Locale must be at least 2 characters')
      .max(10, 'Locale must be less than 10 characters'),
    tags: z.array(z.string()).default([]),
    mainQuestion: z.object({
      text: z.string().min(1, 'Main question text is required'),
    }),
    article: z.object({
      content: z.string().min(1, 'Article content is required'),
      status: z.nativeEnum(ContentStatus),
    }),
    faqItems: z.array(z.object({
      question: z.string().min(1, 'FAQ question is required'),
      answer: z.string().min(1, 'FAQ answer is required'),
      order: z.number().int().min(0),
    })).default([]),
  }))
    .min(1, 'At least one topic is required')
    .max(100, 'Cannot import more than 100 topics at once'),
  mode: z.enum(['create', 'upsert']).default('upsert'),
});

// Export TypeScript types inferred from schemas
export type BulkDeleteInput = z.infer<typeof BulkDeleteSchema>;
export type BulkUpdateInput = z.infer<typeof BulkUpdateSchema>;
export type ExportTopicsInput = z.infer<typeof ExportTopicsSchema>;
export type ImportTopicsInput = z.infer<typeof ImportTopicsSchema>;
