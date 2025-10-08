import { z } from 'zod';

/**
 * Validation schema for topic form
 * Requirements: 4.3, 4.4, 4.5, 4.8, 5.1, 5.4, 5.5, 5.6, 8.6
 */
export const topicFormSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  locale: z
    .string()
    .length(2, 'Locale must be a 2-letter code (e.g., en, fr)'),
  tags: z
    .array(z.string())
    .min(1, 'At least one tag is required'),
  mainQuestion: z
    .string()
    .min(10, 'Main question must be at least 10 characters'),
  articleContent: z
    .string()
    .min(50, 'Article content must be at least 50 characters'),
  articleStatus: z
    .enum(['DRAFT', 'PUBLISHED'], {
      errorMap: () => ({ message: 'Status must be either DRAFT or PUBLISHED' }),
    }),
  faqItems: z
    .array(
      z.object({
        question: z.string().min(5, 'FAQ question must be at least 5 characters'),
        answer: z.string().min(10, 'FAQ answer must be at least 10 characters'),
        order: z.number().int().min(0),
      })
    ),
});

export type TopicFormSchema = z.infer<typeof topicFormSchema>;
