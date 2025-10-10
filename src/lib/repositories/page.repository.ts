import { prisma } from '@/lib/db';
import { Page, ContentStatus } from '@prisma/client';

export interface CreatePageData {
  slug: string;
  title: string;
  content: string;
  status?: ContentStatus;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[];
  createdBy?: string;
}

export interface UpdatePageData {
  slug?: string;
  title?: string;
  content?: string;
  status?: ContentStatus;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[];
  updatedBy?: string;
}

export interface PageFilters {
  status?: ContentStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedPages {
  pages: Page[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class PageRepository {
  /**
   * Find a page by slug
   */
  async findBySlug(slug: string): Promise<Page | null> {
    return prisma.page.findUnique({
      where: { slug },
    });
  }

  /**
   * Find a page by ID
   */
  async findById(id: string): Promise<Page | null> {
    return prisma.page.findUnique({
      where: { id },
    });
  }

  /**
   * List pages with filtering and pagination
   */
  async list(filters: PageFilters = {}): Promise<PaginatedPages> {
    const {
      status,
      search,
      page = 1,
      limit = 20,
    } = filters;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.page.count({ where });

    // Get paginated results
    const pages = await prisma.page.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      pages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Create a new page
   */
  async create(data: CreatePageData): Promise<Page> {
    return prisma.page.create({
      data: {
        slug: data.slug,
        title: data.title,
        content: data.content,
        status: data.status || 'DRAFT',
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        seoKeywords: data.seoKeywords || [],
        createdBy: data.createdBy,
        updatedBy: data.createdBy,
      },
    });
  }

  /**
   * Update an existing page
   */
  async update(slug: string, data: UpdatePageData): Promise<Page> {
    return prisma.page.update({
      where: { slug },
      data,
    });
  }

  /**
   * Delete a page
   */
  async delete(slug: string): Promise<void> {
    await prisma.page.delete({
      where: { slug },
    });
  }

  /**
   * Check if a slug already exists
   */
  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const where: any = { slug };
    
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await prisma.page.count({ where });
    return count > 0;
  }
}
