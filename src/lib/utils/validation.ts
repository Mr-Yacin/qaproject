import { z } from 'zod';

/**
 * Validation schema for topic form
 * Requirements: 4.3, 4.4, 4.5, 4.8, 5.1, 5.4, 5.5, 5.6, 8.6, 1.1, 1.2, 1.3, 1.4, 1.8
 */
export const topicFormSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required - please provide a unique identifier for this topic')
    .max(100, 'Slug must be 100 characters or less')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug must contain only lowercase letters, numbers, and hyphens (e.g., "my-topic-name")'
    )
    .refine(
      (val) => !val.startsWith('-') && !val.endsWith('-'),
      'Slug cannot start or end with a hyphen'
    ),
  title: z
    .string()
    .min(1, 'Title is required - please provide a descriptive title for your topic')
    .min(5, 'Title must be at least 5 characters to be meaningful')
    .max(200, 'Title must be 200 characters or less for better readability'),
  locale: z
    .string()
    .length(2, 'Locale must be exactly 2 characters (e.g., "en" for English, "fr" for French)')
    .regex(/^[a-z]{2}$/, 'Locale must be lowercase letters only (e.g., "en", "fr", "es")'),
  tags: z
    .array(z.string().min(1, 'Tag cannot be empty').max(50, 'Tag must be 50 characters or less'))
    .min(1, 'At least one tag is required to help categorize your topic')
    .max(10, 'Maximum 10 tags allowed to keep topics organized'),
  mainQuestion: z
    .string()
    .min(10, 'Main question must be at least 10 characters to be clear and specific')
    .max(500, 'Main question must be 500 characters or less for better readability'),
  articleContent: z
    .string()
    .min(50, 'Article content must be at least 50 characters to provide meaningful information')
    .max(50000, 'Article content must be 50,000 characters or less'),
  articleStatus: z
    .enum(['DRAFT', 'PUBLISHED'], {
      errorMap: () => ({ message: 'Status must be either DRAFT or PUBLISHED' }),
    }),
  faqItems: z
    .array(
      z.object({
        question: z
          .string()
          .min(5, 'FAQ question must be at least 5 characters')
          .max(500, 'FAQ question must be 500 characters or less'),
        answer: z
          .string()
          .min(10, 'FAQ answer must be at least 10 characters to be helpful')
          .max(5000, 'FAQ answer must be 5,000 characters or less'),
        order: z.number().int().min(0),
      })
    )
    .max(20, 'Maximum 20 FAQ items allowed'),
});

export type TopicFormSchema = z.infer<typeof topicFormSchema>;
