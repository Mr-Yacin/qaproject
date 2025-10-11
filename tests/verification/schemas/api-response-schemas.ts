import { z } from 'zod';

/**
 * API Response Schema Validation
 * Validates all API response formats for topics, articles, and FAQ items
 * Requirements: 1.1, 6.1, 6.2
 */

// Base Prisma model schemas
export const TopicSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  locale: z.string(),
  tags: z.array(z.string()),
  thumbnailUrl: z.string().nullable(),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  seoKeywords: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const QuestionSchema = z.object({
  id: z.string(),
  topicId: z.string(),
  text: z.string(),
  isPrimary: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ArticleSchema = z.object({
  id: z.string(),
  topicId: z.string(),
  content: z.string(),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  seoKeywords: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const FAQItemSchema = z.object({
  id: z.string(),
  topicId: z.string(),
  question: z.string(),
  answer: z.string(),
  order: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Unified Topic Response Schema (GET /api/topics/[slug])
export const UnifiedTopicResponseSchema = z.object({
  topic: TopicSchema,
  primaryQuestion: QuestionSchema.nullable(),
  article: ArticleSchema.nullable(),
  faqItems: z.array(FAQItemSchema),
});

// Pagination Metadata Schema
export const PaginationMetadataSchema = z.object({
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  totalPages: z.number().int().min(0),
});

// Paginated Topics Response Schema (GET /api/topics)
export const PaginatedTopicsResponseSchema = z.object({
  items: z.array(UnifiedTopicResponseSchema),
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  totalPages: z.number().int().min(0),
});

// Ingest Success Response Schema (POST /api/ingest)
export const IngestSuccessResponseSchema = z.object({
  success: z.literal(true),
  topicId: z.string(),
  jobId: z.string(),
});

// Revalidate Success Response Schema (POST /api/revalidate)
export const RevalidateSuccessResponseSchema = z.object({
  message: z.string(),
  tag: z.string(),
});

// Error Response Schemas
export const ValidationErrorResponseSchema = z.object({
  error: z.string(),
  details: z.record(z.any()), // Zod error format
});

export const AuthErrorResponseSchema = z.object({
  error: z.literal('Unauthorized'),
  details: z.string(),
});

export const NotFoundErrorResponseSchema = z.object({
  error: z.literal('Topic not found'),
});

export const ServerErrorResponseSchema = z.object({
  error: z.literal('Internal server error'),
});

export const InvalidJSONErrorResponseSchema = z.object({
  error: z.literal('Invalid JSON'),
  details: z.string(),
});

// Generic Error Response Schema (for any error)
export const GenericErrorResponseSchema = z.object({
  error: z.string(),
  details: z.any().optional(),
});

// Export type definitions
export type TopicResponse = z.infer<typeof TopicSchema>;
export type QuestionResponse = z.infer<typeof QuestionSchema>;
export type ArticleResponse = z.infer<typeof ArticleSchema>;
export type FAQItemResponse = z.infer<typeof FAQItemSchema>;
export type UnifiedTopicResponse = z.infer<typeof UnifiedTopicResponseSchema>;
export type PaginatedTopicsResponse = z.infer<typeof PaginatedTopicsResponseSchema>;
export type IngestSuccessResponse = z.infer<typeof IngestSuccessResponseSchema>;
export type RevalidateSuccessResponse = z.infer<typeof RevalidateSuccessResponseSchema>;
export type ValidationErrorResponse = z.infer<typeof ValidationErrorResponseSchema>;
export type AuthErrorResponse = z.infer<typeof AuthErrorResponseSchema>;
export type NotFoundErrorResponse = z.infer<typeof NotFoundErrorResponseSchema>;
export type ServerErrorResponse = z.infer<typeof ServerErrorResponseSchema>;
export type GenericErrorResponse = z.infer<typeof GenericErrorResponseSchema>;