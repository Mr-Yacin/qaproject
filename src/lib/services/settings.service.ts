import { SiteSettings } from '@prisma/client';
import { SettingsRepository, UpdateSettingsInput } from '@/lib/repositories/settings.repository';
import { SiteSettingsInput } from '@/lib/validation/schemas';

export class SettingsService {
  private settingsRepository: SettingsRepository;

  constructor(settingsRepository: SettingsRepository = new SettingsRepository()) {
    this.settingsRepository = settingsRepository;
  }

  async getSettings(): Promise<SiteSettings> {
    return this.settingsRepository.getOrCreate();
  }

  async updateSettings(data: SiteSettingsInput, updatedBy?: string): Promise<SiteSettings> {
    const updateData: UpdateSettingsInput = {
      siteName: data.siteName,
      logoUrl: data.logoUrl ?? undefined,
      faviconUrl: data.faviconUrl ?? undefined,
      seoTitle: data.seoTitle ?? undefined,
      seoDescription: data.seoDescription ?? undefined,
      seoKeywords: data.seoKeywords,
      socialLinks: data.socialLinks ?? undefined,
      customCss: data.customCss ?? undefined,
      customJs: data.customJs ?? undefined,
      updatedBy,
    };

    return this.settingsRepository.update(updateData);
  }

  async uploadLogo(logoUrl: string, updatedBy?: string): Promise<SiteSettings> {
    return this.settingsRepository.update({
      logoUrl,
      updatedBy,
    });
  }
}
