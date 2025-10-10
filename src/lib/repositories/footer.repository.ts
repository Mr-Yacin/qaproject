import { prisma } from '@/lib/db';
import { FooterColumn, FooterLink, FooterSettings } from '@prisma/client';

export interface CreateFooterColumnData {
  title: string;
  order: number;
}

export interface UpdateFooterColumnData {
  title?: string;
  order?: number;
}

export interface CreateFooterLinkData {
  columnId: string;
  label: string;
  url: string;
  order: number;
}

export interface UpdateFooterLinkData {
  columnId?: string;
  label?: string;
  url?: string;
  order?: number;
}

export interface UpdateFooterSettingsData {
  copyrightText?: string;
  socialLinks?: Record<string, string> | null;
}

export interface FooterColumnWithLinks extends FooterColumn {
  links: FooterLink[];
}

export interface FooterConfig {
  settings: FooterSettings | null;
  columns: FooterColumnWithLinks[];
}

export class FooterRepository {
  /**
   * Get complete footer configuration
   * Returns settings and all columns with their links
   */
  async getFooterConfig(): Promise<FooterConfig> {
    const [settings, columns] = await Promise.all([
      this.getSettings(),
      this.listColumnsWithLinks(),
    ]);

    return {
      settings,
      columns,
    };
  }

  // ===== Footer Settings =====

  /**
   * Get footer settings
   * Returns null if no settings exist
   */
  async getSettings(): Promise<FooterSettings | null> {
    return prisma.footerSettings.findFirst();
  }

  /**
   * Update footer settings
   * Creates settings if they don't exist
   */
  async updateSettings(data: UpdateFooterSettingsData): Promise<FooterSettings> {
    const existing = await this.getSettings();

    if (existing) {
      return prisma.footerSettings.update({
        where: { id: existing.id },
        data,
      });
    }

    // Create new settings if none exist
    return prisma.footerSettings.create({
      data: {
        copyrightText: data.copyrightText || '',
        socialLinks: data.socialLinks,
      },
    });
  }

  // ===== Footer Columns =====

  /**
   * Find a footer column by ID
   */
  async findColumnById(id: string): Promise<FooterColumn | null> {
    return prisma.footerColumn.findUnique({
      where: { id },
    });
  }

  /**
   * List all footer columns ordered by order field
   */
  async listColumns(): Promise<FooterColumn[]> {
    return prisma.footerColumn.findMany({
      orderBy: { order: 'asc' },
    });
  }

  /**
   * List all footer columns with their links
   */
  async listColumnsWithLinks(): Promise<FooterColumnWithLinks[]> {
    return prisma.footerColumn.findMany({
      include: {
        links: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Create a new footer column
   */
  async createColumn(data: CreateFooterColumnData): Promise<FooterColumn> {
    return prisma.footerColumn.create({
      data: {
        title: data.title,
        order: data.order,
      },
    });
  }

  /**
   * Update an existing footer column
   */
  async updateColumn(id: string, data: UpdateFooterColumnData): Promise<FooterColumn> {
    return prisma.footerColumn.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a footer column
   * Note: Links will be cascade deleted due to onDelete: Cascade in schema
   */
  async deleteColumn(id: string): Promise<void> {
    await prisma.footerColumn.delete({
      where: { id },
    });
  }

  /**
   * Get the maximum order value for columns
   * Used to determine the order for new columns
   */
  async getMaxColumnOrder(): Promise<number> {
    const result = await prisma.footerColumn.aggregate({
      _max: { order: true },
    });

    return result._max.order ?? -1;
  }

  /**
   * Check if a column has links
   */
  async columnHasLinks(id: string): Promise<boolean> {
    const count = await prisma.footerLink.count({
      where: { columnId: id },
    });

    return count > 0;
  }

  // ===== Footer Links =====

  /**
   * Find a footer link by ID
   */
  async findLinkById(id: string): Promise<FooterLink | null> {
    return prisma.footerLink.findUnique({
      where: { id },
    });
  }

  /**
   * List all links for a specific column
   */
  async listLinksByColumn(columnId: string): Promise<FooterLink[]> {
    return prisma.footerLink.findMany({
      where: { columnId },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Create a new footer link
   */
  async createLink(data: CreateFooterLinkData): Promise<FooterLink> {
    return prisma.footerLink.create({
      data: {
        columnId: data.columnId,
        label: data.label,
        url: data.url,
        order: data.order,
      },
    });
  }

  /**
   * Update an existing footer link
   */
  async updateLink(id: string, data: UpdateFooterLinkData): Promise<FooterLink> {
    return prisma.footerLink.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a footer link
   */
  async deleteLink(id: string): Promise<void> {
    await prisma.footerLink.delete({
      where: { id },
    });
  }

  /**
   * Get the maximum order value for links in a specific column
   * Used to determine the order for new links
   */
  async getMaxLinkOrder(columnId: string): Promise<number> {
    const result = await prisma.footerLink.aggregate({
      where: { columnId },
      _max: { order: true },
    });

    return result._max.order ?? -1;
  }

  /**
   * Validate that a column exists
   */
  async validateColumn(columnId: string): Promise<boolean> {
    const column = await prisma.footerColumn.findUnique({
      where: { id: columnId },
    });

    return column !== null;
  }
}
