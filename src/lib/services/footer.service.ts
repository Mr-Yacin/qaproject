import { FooterColumn, FooterLink, FooterSettings } from '@prisma/client';
import {
  FooterRepository,
  CreateFooterColumnData,
  UpdateFooterColumnData,
  CreateFooterLinkData,
  UpdateFooterLinkData,
  UpdateFooterSettingsData,
  FooterColumnWithLinks,
  FooterConfig,
} from '@/lib/repositories/footer.repository';
import {
  FooterSettingsInput,
  CreateFooterColumnInput,
  UpdateFooterColumnInput,
  CreateFooterLinkInput,
  UpdateFooterLinkInput,
} from '@/lib/validation/footer.schema';

export class FooterColumnNotFoundError extends Error {
  constructor(id: string) {
    super(`Footer column with ID "${id}" not found`);
    this.name = 'FooterColumnNotFoundError';
  }
}

export class FooterLinkNotFoundError extends Error {
  constructor(id: string) {
    super(`Footer link with ID "${id}" not found`);
    this.name = 'FooterLinkNotFoundError';
  }
}

export class InvalidColumnError extends Error {
  constructor(columnId: string) {
    super(`Footer column with ID "${columnId}" not found`);
    this.name = 'InvalidColumnError';
  }
}

export class FooterService {
  private footerRepository: FooterRepository;

  constructor(footerRepository: FooterRepository = new FooterRepository()) {
    this.footerRepository = footerRepository;
  }

  /**
   * Get complete footer configuration
   * Returns settings and all columns with their links
   */
  async getFooterConfig(): Promise<FooterConfig> {
    return this.footerRepository.getFooterConfig();
  }

  // ===== Footer Settings =====

  /**
   * Get footer settings
   */
  async getFooterSettings(): Promise<FooterSettings | null> {
    return this.footerRepository.getSettings();
  }

  /**
   * Update footer settings
   * Creates settings if they don't exist
   */
  async updateFooterSettings(data: FooterSettingsInput): Promise<FooterSettings> {
    const updateData: UpdateFooterSettingsData = {
      copyrightText: data.copyrightText,
      socialLinks: data.socialLinks,
    };

    return this.footerRepository.updateSettings(updateData);
  }

  // ===== Footer Columns =====

  /**
   * Get all footer columns with their links
   */
  async listColumns(): Promise<FooterColumnWithLinks[]> {
    return this.footerRepository.listColumnsWithLinks();
  }

  /**
   * Get a footer column by ID
   */
  async getColumnById(id: string): Promise<FooterColumn | null> {
    return this.footerRepository.findColumnById(id);
  }

  /**
   * Create a new footer column
   * Automatically assigns order if not provided
   */
  async createColumn(data: CreateFooterColumnInput): Promise<FooterColumn> {
    // If order is not provided or is 0, get the next available order
    let order = data.order;
    if (order === undefined || order === 0) {
      const maxOrder = await this.footerRepository.getMaxColumnOrder();
      order = maxOrder + 1;
    }

    const createData: CreateFooterColumnData = {
      title: data.title,
      order,
    };

    return this.footerRepository.createColumn(createData);
  }

  /**
   * Update an existing footer column
   */
  async updateColumn(id: string, data: UpdateFooterColumnInput): Promise<FooterColumn> {
    // Check if column exists
    const existingColumn = await this.footerRepository.findColumnById(id);
    if (!existingColumn) {
      throw new FooterColumnNotFoundError(id);
    }

    const updateData: UpdateFooterColumnData = {
      title: data.title,
      order: data.order,
    };

    return this.footerRepository.updateColumn(id, updateData);
  }

  /**
   * Delete a footer column
   * Note: Links will be cascade deleted
   */
  async deleteColumn(id: string): Promise<void> {
    // Check if column exists
    const existingColumn = await this.footerRepository.findColumnById(id);
    if (!existingColumn) {
      throw new FooterColumnNotFoundError(id);
    }

    await this.footerRepository.deleteColumn(id);
  }

  /**
   * Check if a column has links
   */
  async columnHasLinks(id: string): Promise<boolean> {
    return this.footerRepository.columnHasLinks(id);
  }

  // ===== Footer Links =====

  /**
   * Get all links for a specific column
   */
  async getLinksByColumn(columnId: string): Promise<FooterLink[]> {
    return this.footerRepository.listLinksByColumn(columnId);
  }

  /**
   * Get a footer link by ID
   */
  async getLinkById(id: string): Promise<FooterLink | null> {
    return this.footerRepository.findLinkById(id);
  }

  /**
   * Create a new footer link
   * Validates that the column exists
   * Automatically assigns order if not provided
   */
  async createLink(data: CreateFooterLinkInput): Promise<FooterLink> {
    // Validate column exists
    const columnExists = await this.footerRepository.validateColumn(data.columnId);
    if (!columnExists) {
      throw new InvalidColumnError(data.columnId);
    }

    // If order is not provided or is 0, get the next available order
    let order = data.order;
    if (order === undefined || order === 0) {
      const maxOrder = await this.footerRepository.getMaxLinkOrder(data.columnId);
      order = maxOrder + 1;
    }

    const createData: CreateFooterLinkData = {
      columnId: data.columnId,
      label: data.label,
      url: data.url,
      order,
    };

    return this.footerRepository.createLink(createData);
  }

  /**
   * Update an existing footer link
   * Validates column if columnId is being changed
   */
  async updateLink(id: string, data: UpdateFooterLinkInput): Promise<FooterLink> {
    // Check if link exists
    const existingLink = await this.footerRepository.findLinkById(id);
    if (!existingLink) {
      throw new FooterLinkNotFoundError(id);
    }

    // If columnId is being changed, validate it
    if (data.columnId !== undefined) {
      const columnExists = await this.footerRepository.validateColumn(data.columnId);
      if (!columnExists) {
        throw new InvalidColumnError(data.columnId);
      }
    }

    const updateData: UpdateFooterLinkData = {
      columnId: data.columnId,
      label: data.label,
      url: data.url,
      order: data.order,
    };

    return this.footerRepository.updateLink(id, updateData);
  }

  /**
   * Delete a footer link
   */
  async deleteLink(id: string): Promise<void> {
    // Check if link exists
    const existingLink = await this.footerRepository.findLinkById(id);
    if (!existingLink) {
      throw new FooterLinkNotFoundError(id);
    }

    await this.footerRepository.deleteLink(id);
  }
}
