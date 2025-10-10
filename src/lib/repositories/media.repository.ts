import { prisma } from '@/lib/db';
import { Media, Prisma } from '@prisma/client';

export interface MediaFilters {
  mimeType?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedMedia {
  items: Media[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class MediaRepository {
  async create(data: Prisma.MediaCreateInput): Promise<Media> {
    return prisma.media.create({ data });
  }

  async findById(id: string): Promise<Media | null> {
    return prisma.media.findUnique({
      where: { id },
    });
  }

  async findMany(filters: MediaFilters): Promise<PaginatedMedia> {
    const { mimeType, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.MediaWhereInput = {};

    if (mimeType) {
      where.mimeType = { startsWith: mimeType };
    }

    if (search) {
      where.OR = [
        { filename: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.media.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.media.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async delete(id: string): Promise<Media> {
    return prisma.media.delete({
      where: { id },
    });
  }

  async deleteMany(ids: string[]): Promise<number> {
    const result = await prisma.media.deleteMany({
      where: { id: { in: ids } },
    });
    return result.count;
  }
}

export const mediaRepository = new MediaRepository();
