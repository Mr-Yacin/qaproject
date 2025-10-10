'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PageEditor } from '@/components/admin/pages/PageEditor';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface PageFormProps {
  page?: {
    slug: string;
    title: string;
    content: string;
    status: 'DRAFT' | 'PUBLISHED';
    seoTitle?: string | null;
    seoDescription?: string | null;
    seoKeywords?: string[];
  };
  mode: 'create' | 'edit';
}

/**
 * Page Form Component
 * Form for creating and editing pages with rich text editor
 * Requirements: 3.2, 3.3, 3.4, 3.9
 */
export function PageForm({ page, mode }: PageFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    slug: page?.slug || '',
    title: page?.title || '',
    content: page?.content || '',
    status: page?.status || 'DRAFT',
    seoTitle: page?.seoTitle || '',
    seoDescription: page?.seoDescription || '',
    seoKeywords: page?.seoKeywords?.join(', ') || '',
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

  const handleContentChange = (content: string) => {
    handleChange('content', content);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be 200 characters or less';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }

    if (formData.seoTitle && formData.seoTitle.length > 60) {
      newErrors.seoTitle = 'SEO title must be 60 characters or less';
    }

    if (formData.seoDescription && formData.seoDescription.length > 160) {
      newErrors.seoDescription = 'SEO description must be 160 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent, status?: 'DRAFT' | 'PUBLISHED') => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      // Prepare data for API
      const submitData = {
        slug: formData.slug,
        title: formData.title,
        content: formData.content,
        status: status || formData.status,
        seoTitle: formData.seoTitle || null,
        seoDescription: formData.seoDescription || null,
        seoKeywords: formData.seoKeywords
          ? formData.seoKeywords.split(',').map((k: string) => k.trim()).filter(Boolean)
          : [],
      };

      const url = mode === 'create'
        ? '/api/admin/pages'
        : `/api/admin/pages/${page?.slug}`;

      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${mode} page`);
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description: `Page ${mode === 'create' ? 'created' : 'updated'} successfully`,
      });

      // Redirect to pages list
      router.push('/admin/pages');
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${mode} page`,
        variant: 'destructive',
      });
      console.error(`Failed to ${mode} page:`, error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/admin/pages">
          <Button type="button" variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pages
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={(e) => handleSubmit(e, 'DRAFT')}
            disabled={saving}
          >
            Save as Draft
          </Button>
          <Button
            type="button"
            onClick={(e) => handleSubmit(e, 'PUBLISHED')}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Publish
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="About Us"
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && (
              <p className="text-sm text-destructive mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium mb-2">
              Slug <span className="text-destructive">*</span>
              <span className="text-muted-foreground text-xs ml-2">
                (URL-friendly identifier)
              </span>
            </label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => handleChange('slug', e.target.value.toLowerCase())}
              placeholder="about-us"
              className={errors.slug ? 'border-destructive' : ''}
              disabled={mode === 'edit'}
            />
            {errors.slug && (
              <p className="text-sm text-destructive mt-1">{errors.slug}</p>
            )}
            {mode === 'edit' && (
              <p className="text-sm text-muted-foreground mt-1">
                Slug cannot be changed after creation
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Content */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          Content <span className="text-destructive">*</span>
        </h2>
        <PageEditor content={formData.content} onChange={handleContentChange} />
        {errors.content && (
          <p className="text-sm text-destructive mt-2">{errors.content}</p>
        )}
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
              placeholder="Leave empty to use page title"
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
              placeholder="Brief description for search engines"
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
    </form>
  );
}
