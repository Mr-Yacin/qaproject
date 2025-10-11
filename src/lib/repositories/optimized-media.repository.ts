import { prisma } from '@/lib/db';
import { Media, Prisma } from '@prisma/client';

export interface MediaFilters {
  mimeType?: string;
  uploadedBy?: string;
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedMedia {
  items: Media[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  nextCursor?: string;
}

/**
 * Optimized MediaRepository with cursor-based pagination and selective field fetching
 * Requirements: 6.1, 6.4, 6.6 - Performance optimization
 */
export class OptimizedMediaRepository {
  /**
   * Find media with cursor-based pagination
   * More efficient for large media libraries
   */
  async findManyWithCursor(filters: MediaFilters): Promise<PaginatedMedia> {
    const { mimeType, uploadedBy, limit = 20, cursor } = filters;

    const where: Prisma.MediaWhereInput = {};

    if (mimeType) {
      where.mimeType = mimeType;
    }

    if (uploadedBy) {
      where.uploadedBy = uploadedBy;
    }

    // Get total count
    const total = await prisma.media.count({ where });

    // Build cursor query
    const queryOptions: Prisma.MediaFindManyArgs = {
      where,
      select: {
        id: true,
        filename: true,
        originalName: true,
        mimeType: true,
        size: true,
        url: true,
        thumbnailUrl: true,
        uploadedBy: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    };

    if (cursor) {
      queryOptions.cursor = { id: cursor };
      queryOptions.skip = 1;
    }

    const items = await prisma.media.findMany(queryOptions);

    // Check if there are more results
    const hasMore = items.length > limit;
    const mediaItems = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? mediaItems[mediaItems.length - 1].id : undefined;

    // Calculate page for backward compatibility
    const page = cursor ? Math.ceil((total - mediaItems.length) / limit) : 1;

    return {
      items: mediaItems as Media[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      nextCursor,
    };
  }

  /**
   * Find media with minimal data for grid views
   * Only fetches fields needed for thumbnail display
   */
  async findManyMinimal(filters: MediaFilters): Promise<PaginatedMedia> {
    const { mimeType, uploadedBy, page = 1, limit = 20 } = filters;

    const where: Prisma.MediaWhereInput = {};

    if (mimeType) {
      where.mimeType = mimeType;
    }

    if (uploadedBy) {
      where.uploadedBy = uploadedBy;
    }

    const total = await prisma.media.count({ where });

    const items = await prisma.media.findMany({
      where,
      select: {
        id: true,
        filename: true,
        originalName: true,
        mimeType: true,
        thumbnailUrl: true,
        createdAt: true,
        // Exclude: url, size, uploadedBy for grid view
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return {
      items: items as Media[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Batch delete media files
   * More efficient than deleting one by one
   */
  async deleteManyBatch(ids: string[]): Promise<number> {
    const result = await prisma.media.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
    return result.count;
  }

  /**
   * Get media statistics efficiently
   * Uses aggregation for better performance
   */
  async getStatistics(): Promise<{
    totalFiles: number;
    totalSize: number;
    byMimeType: Record<string, number>;
  }> {
    const [totalFiles, totalSizeResult, byMimeType] = await Promise.all([
      prisma.media.count(),
      prisma.media.aggregate({
        _sum: {
          size: true,
        },
      }),
      prisma.media.groupBy({
        by: ['mimeType'],
        _count: {
          id: true,
        },
      }),
    ]);

    const mimeTypeStats: Record<string, number> = {};
    byMimeType.forEach((item) => {
      mimeTypeStats[item.mimeType] = item._count.id;
    });

    return {
      totalFiles,
      totalSize: totalSizeResult._sum.size || 0,
      byMimeType: mimeTypeStats,
    };
  }
}
