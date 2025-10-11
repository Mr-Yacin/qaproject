/**
 * Query optimization utilities
 * Provides helpers for efficient database queries
 */

/**
 * Calculate optimal batch size based on data size
 * Prevents memory issues with large datasets
 */
export function calculateBatchSize(totalItems: number, maxBatchSize: number = 1000): number {
  if (totalItems <= 100) return totalItems;
  if (totalItems <= 1000) return 100;
  if (totalItems <= 10000) return 500;
  return maxBatchSize;
}

/**
 * Process items in batches to avoid memory issues
 * Useful for bulk operations
 */
export async function processBatch<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Create a cursor from an ID for pagination
 */
export function createCursor(id: string): string {
  return Buffer.from(id).toString('base64');
}

/**
 * Parse a cursor to get the ID
 */
export function parseCursor(cursor: string): string {
  return Buffer.from(cursor, 'base64').toString('utf-8');
}

/**
 * Build efficient where clause for text search
 * Uses database indexes when possible
 */
export function buildTextSearchWhere(
  searchTerm: string,
  fields: string[]
): Record<string, any> {
  if (!searchTerm || searchTerm.trim() === '') {
    return {};
  }

  const term = searchTerm.trim();
  
  // If only one field, use simple contains
  if (fields.length === 1) {
    return {
      [fields[0]]: {
        contains: term,
        mode: 'insensitive',
      },
    };
  }

  // Multiple fields, use OR
  return {
    OR: fields.map((field) => ({
      [field]: {
        contains: term,
        mode: 'insensitive',
      },
    })),
  };
}

/**
 * Build efficient date range where clause
 */
export function buildDateRangeWhere(
  field: string,
  startDate?: Date,
  endDate?: Date
): Record<string, any> {
  if (!startDate && !endDate) {
    return {};
  }

  const where: Record<string, any> = {};
  
  if (startDate || endDate) {
    where[field] = {};
    if (startDate) {
      where[field].gte = startDate;
    }
    if (endDate) {
      where[field].lte = endDate;
    }
  }

  return where;
}

/**
 * Merge multiple where clauses efficiently
 */
export function mergeWhereClauses(...clauses: Record<string, any>[]): Record<string, any> {
  return clauses.reduce((acc, clause) => {
    return { ...acc, ...clause };
  }, {});
}

/**
 * Calculate skip value for offset-based pagination
 * Validates inputs to prevent errors
 */
export function calculateSkip(page: number, limit: number): number {
  const validPage = Math.max(1, page);
  const validLimit = Math.max(1, Math.min(limit, 100)); // Cap at 100
  return (validPage - 1) * validLimit;
}

/**
 * Calculate total pages
 */
export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / Math.max(1, limit));
}

/**
 * Validate and sanitize pagination parameters
 */
export function sanitizePaginationParams(params: {
  page?: number;
  limit?: number;
}): { page: number; limit: number } {
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(params.limit || 20, 100)); // Cap at 100
  
  return { page, limit };
}
