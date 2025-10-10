import { prisma } from '@/lib/db';
import { SiteSettings } from '@prisma/client';

export interface UpdateSettingsInput {
  siteName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  socialLinks?: Record<string, string>;
  customCss?: string;
  customJs?: string;
  updatedBy?: string;
}

export class SettingsRepository {
  async get(): Promise<SiteSettings | null> {
    // Get the first (and only) settings record
    return prisma.siteSettings.findFirst();
  }

  async getOrCreate(): Promise<SiteSettings> {
    // Try to get existing settings
    let settings = await this.get();
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          siteName: 'Q&A Article FAQ',
          seoKeywords: [],
        },
      });
    }
    
    return settings;
  }

  async update(data: UpdateSettingsInput): Promise<SiteSettings> {
    // Ensure settings exist
    const existing = await this.getOrCreate();
    
    // Update the settings
    return prisma.siteSettings.update({
      where: { id: existing.id },
      data,
    });
  }
}
