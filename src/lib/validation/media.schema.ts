import { z } from 'zod';

export const MediaUploadSchema = z.object({
  file: z.instanceof(File),
});

export const MediaFiltersSchema = z.object({
  mimeType: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const MediaDeleteSchema = z.object({
  id: z.string().cuid(),
});

export const BulkDeleteSchema = z.object({
  ids: z.array(z.string().cuid()).min(1),
});

export type MediaUploadInput = z.infer<typeof MediaUploadSchema>;
export type MediaFiltersInput = z.infer<typeof MediaFiltersSchema>;
export type MediaDeleteInput = z.infer<typeof MediaDeleteSchema>;
export type BulkDeleteInput = z.infer<typeof BulkDeleteSchema>;
