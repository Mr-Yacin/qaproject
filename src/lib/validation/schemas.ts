import { z } from 'zod';

/**
 * Ingest payload schema for POST /api/ingest
 * Validates the complete content package including topic, question, article, and FAQ items
 */
export const IngestPayloadSchema = z.object({
  topic: z.object({
    slug: z.string().min(1).max(255),
    title: z.string().min(1),
    locale: z.string().length(2), // e.g., "en", "es"
    tags: z.array(z.string()).default([])
  }),
  mainQuestion: z.object({
    text: z.string().min(1)
  }),
  article: z.object({
    content: z.string().min(1),
    status: z.enum(['DRAFT', 'PUBLISHED'])
  }),
  faqItems: z.array(z.object({
    question: z.string().min(1),
    answer: z.string().min(1),
    order: z.number().int().min(0)
  })).default([])
});

/**
 * Revalidate payload schema for POST /api/revalidate
 * Validates the cache tag to be revalidated
 */
export const RevalidatePayloadSchema = z.object({
  tag: z.string().min(1)
});

/**
 * Topics query schema for GET /api/topics
 * Validates query parameters for filtering and pagination
 */
export const TopicsQuerySchema = z.object({
  locale: z.string().length(2).optional(),
  tag: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

// Export TypeScript types inferred from schemas
export type IngestPayload = z.infer<typeof IngestPayloadSchema>;
export type RevalidatePayload = z.infer<typeof RevalidatePayloadSchema>;
export type TopicsQuery = z.infer<typeof TopicsQuerySchema>;
