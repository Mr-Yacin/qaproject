import { Page } from '@prisma/client';
import {
  PageRepository,
  CreatePageData,
  UpdatePageData,
  PageFilters,
  PaginatedPages,
} from '@/lib/repositories/page.repository';
import { CreatePageInput, UpdatePageInput } from '@/lib/validation/page.schema';
import { DuplicateError, NotFoundError } from '@/lib/errors';

export class PageNotFoundError extends Error {
  constructor(slug: string) {
    super(`Page with slug "${slug}" not found`);
    this.name = 'PageNotFoundError';
  }
}

export class DuplicateSlugError extends Error {
  constructor(slug: string) {
    super(`Page with slug "${slug}" already exists`);
    this.name = 'DuplicateSlugError';
  }
}

export class PageService {
  private pageRepository: PageRepository;

  constructor(pageRepository: PageRepository = new PageRepository()) {
    this.pageRepository = pageRepository;
  }

  /**
   * Get a page by slug
   */
  async getPageBySlug(slug: string): Promise<Page | null> {
    return this.pageRepository.findBySlug(slug);
  }

  /**
   * List pages with filtering and pagination
   */
  async listPages(filters: PageFilters = {}): Promise<PaginatedPages> {
    return this.pageRepository.list(filters);
  }

  /**
   * Create a new page
   * Validates that the slug is unique
   */
  async createPage(data: CreatePageInput, createdBy?: string): Promise<Page> {
    // Check if slug already exists
    const slugExists = await this.pageRepository.slugExists(data.slug);
    if (slugExists) {
      throw new DuplicateSlugError(data.slug);
    }

    const createData: CreatePageData = {
      slug: data.slug,
      title: data.title,
      content: data.content,
      status: data.status,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      seoKeywords: data.seoKeywords,
      createdBy,
    };

    return this.pageRepository.create(createData);
  }

  /**
   * Update an existing page
   * Validates slug uniqueness if slug is being changed
   */
  async updatePage(
    slug: string,
    data: UpdatePageInput,
    updatedBy?: string
  ): Promise<Page> {
    // Check if page exists
    const existingPage = await this.pageRepository.findBySlug(slug);
    if (!existingPage) {
      throw new PageNotFoundError(slug);
    }

    // If slug is being changed, check if new slug already exists
    if (data.slug && data.slug !== slug) {
      const slugExists = await this.pageRepository.slugExists(
        data.slug,
        existingPage.id
      );
      if (slugExists) {
        throw new DuplicateSlugError(data.slug);
      }
    }

    const updateData: UpdatePageData = {
      ...data,
      updatedBy,
    };

    return this.pageRepository.update(slug, updateData);
  }

  /**
   * Delete a page
   */
  async deletePage(slug: string): Promise<void> {
    // Check if page exists
    const existingPage = await this.pageRepository.findBySlug(slug);
    if (!existingPage) {
      throw new PageNotFoundError(slug);
    }

    await this.pageRepository.delete(slug);
  }

  /**
   * Validate slug uniqueness
   */
  async validateSlugUniqueness(slug: string, excludeId?: string): Promise<boolean> {
    const exists = await this.pageRepository.slugExists(slug, excludeId);
    return !exists;
  }
}
