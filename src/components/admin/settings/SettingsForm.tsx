'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { LogoUploader } from '@/components/admin/settings/LogoUploader';
import { Loader2, Save } from 'lucide-react';
import { showErrorToast, showSuccessToast, handleFetchError } from '@/lib/errors';

interface SettingsFormProps {
  settings: any;
  onUpdate: (settings: any) => void;
}

/**
 * Settings Form Component
 * Form for editing site settings
 * Requirements: 2.1, 2.2, 2.3, 2.8
 */
export function SettingsForm({ settings, onUpdate }: SettingsFormProps) {
  const [formData, setFormData] = useState({
    siteName: settings.siteName || '',
    logoUrl: settings.logoUrl || '',
    faviconUrl: settings.faviconUrl || '',
    seoTitle: settings.seoTitle || '',
    seoDescription: settings.seoDescription || '',
    seoKeywords: settings.seoKeywords?.join(', ') || '',
    socialLinks: {
      twitter: settings.socialLinks?.twitter || '',
      facebook: settings.socialLinks?.facebook || '',
      linkedin: settings.socialLinks?.linkedin || '',
      instagram: settings.socialLinks?.instagram || '',
    },
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value,
      },
    }));
  };

  const handleLogoUpload = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      logoUrl: url,
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.siteName.trim()) {
      newErrors.siteName = 'Site name is required';
    }

    if (formData.seoTitle && formData.seoTitle.length > 60) {
      newErrors.seoTitle = 'SEO title must be 60 characters or less';
    }

    if (formData.seoDescription && formData.seoDescription.length > 160) {
      newErrors.seoDescription = 'SEO description must be 160 characters or less';
    }

    // Validate URLs
    const urlFields = ['logoUrl', 'faviconUrl'];
    urlFields.forEach((field) => {
      const value = formData[field as keyof typeof formData] as string;
      if (value && !value.startsWith('http') && !value.startsWith('/')) {
        newErrors[field] = 'Must be a valid URL or path';
      }
    });

    // Validate social links
    Object.entries(formData.socialLinks).forEach(([platform, url]) => {
      if (url && !url.startsWith('http')) {
        newErrors[`socialLinks.${platform}`] = 'Must be a valid URL';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showErrorToast('Please fix the errors in the form');
      return;
    }

    try {
      setSaving(true);

      // Prepare data for API
      const updateData = {
        siteName: formData.siteName,
        logoUrl: formData.logoUrl || null,
        faviconUrl: formData.faviconUrl || null,
        seoTitle: formData.seoTitle || null,
        seoDescription: formData.seoDescription || null,
        seoKeywords: formData.seoKeywords
          ? formData.seoKeywords.split(',').map((k: string) => k.trim()).filter(Boolean)
          : [],
        socialLinks: Object.fromEntries(
          Object.entries(formData.socialLinks).filter(([_, url]) => url)
        ),
      };

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        await handleFetchError(response);
      }

      const updatedSettings = await response.json();
      onUpdate(updatedSettings);

      showSuccessToast('Settings updated successfully');
    } catch (error) {
      showErrorToast(error, 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* General Settings */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">General Settings</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="siteName" className="block text-sm font-medium mb-2">
              Site Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="siteName"
              value={formData.siteName}
              onChange={(e) => handleChange('siteName', e.target.value)}
              placeholder="Q&A Article FAQ"
              className={errors.siteName ? 'border-destructive' : ''}
            />
            {errors.siteName && (
              <p className="text-sm text-destructive mt-1">{errors.siteName}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Branding */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Branding</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Logo</label>
            <LogoUploader
              currentLogoUrl={formData.logoUrl}
              onUpload={handleLogoUpload}
            />
          </div>

          <div>
            <label htmlFor="faviconUrl" className="block text-sm font-medium mb-2">
              Favicon URL
            </label>
            <Input
              id="faviconUrl"
              value={formData.faviconUrl}
              onChange={(e) => handleChange('faviconUrl', e.target.value)}
              placeholder="/favicon.ico"
              className={errors.faviconUrl ? 'border-destructive' : ''}
            />
            {errors.faviconUrl && (
              <p className="text-sm text-destructive mt-1">{errors.faviconUrl}</p>
            )}
          </div>
        </div>
      </Card>

      {/* SEO Settings */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">SEO Settings</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="seoTitle" className="block text-sm font-medium mb-2">
              SEO Title
              <span className="text-muted-foreground text-xs ml-2">
                ({formData.seoTitle.length}/60)
              </span>
            </label>
            <Input
              id="seoTitle"
              value={formData.seoTitle}
              onChange={(e) => handleChange('seoTitle', e.target.value)}
              placeholder="Default page title"
              maxLength={60}
              className={errors.seoTitle ? 'border-destructive' : ''}
            />
            {errors.seoTitle && (
              <p className="text-sm text-destructive mt-1">{errors.seoTitle}</p>
            )}
          </div>

          <div>
            <label htmlFor="seoDescription" className="block text-sm font-medium mb-2">
              SEO Description
              <span className="text-muted-foreground text-xs ml-2">
                ({formData.seoDescription.length}/160)
              </span>
            </label>
            <textarea
              id="seoDescription"
              value={formData.seoDescription}
              onChange={(e) => handleChange('seoDescription', e.target.value)}
              placeholder="Default meta description"
              maxLength={160}
              rows={3}
              className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                errors.seoDescription ? 'border-destructive' : ''
              }`}
            />
            {errors.seoDescription && (
              <p className="text-sm text-destructive mt-1">{errors.seoDescription}</p>
            )}
          </div>

          <div>
            <label htmlFor="seoKeywords" className="block text-sm font-medium mb-2">
              SEO Keywords
              <span className="text-muted-foreground text-xs ml-2">
                (comma-separated)
              </span>
            </label>
            <Input
              id="seoKeywords"
              value={formData.seoKeywords}
              onChange={(e) => handleChange('seoKeywords', e.target.value)}
              placeholder="keyword1, keyword2, keyword3"
            />
          </div>
        </div>
      </Card>

      {/* Social Media Links */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Social Media Links</h2>
        <div className="space-y-4">
          {(['twitter', 'facebook', 'linkedin', 'instagram'] as const).map((platform) => (
            <div key={platform}>
              <label htmlFor={platform} className="block text-sm font-medium mb-2 capitalize">
                {platform}
              </label>
              <Input
                id={platform}
                value={formData.socialLinks[platform]}
                onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                placeholder={`https://${platform}.com/yourprofile`}
                className={errors[`socialLinks.${platform}`] ? 'border-destructive' : ''}
              />
              {errors[`socialLinks.${platform}`] && (
                <p className="text-sm text-destructive mt-1">
                  {errors[`socialLinks.${platform}`]}
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
