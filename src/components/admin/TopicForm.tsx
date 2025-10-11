'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Eye, Loader2, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { topicFormSchema, type TopicFormSchema } from '@/lib/utils/validation';
import { RichTextEditorWithMedia as RichTextEditor } from './RichTextEditorWithMedia';
import { FAQManagerLazy as FAQManager } from './FAQManagerLazy';
import { type FAQItem } from './FAQManager';
import { MediaPicker } from './media/MediaPicker';
import { Media } from '@prisma/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Props for TopicForm component
 * Requirements: 4.3, 4.4, 4.5, 4.8, 5.1, 5.4, 5.5, 5.6, 8.6, 1.1, 1.2, 1.3, 1.4, 1.8
 */
interface TopicFormProps {
  initialData?: Partial<TopicFormSchema>;
  onSubmit: (data: TopicFormSchema) => Promise<void>;
  mode: 'create' | 'edit';
  enableAutoSave?: boolean;
}

/**
 * TopicForm component for creating and editing topics
 * Provides form fields for slug, title, locale, and tags with validation
 * Auto-generates slug from title in create mode
 * Supports auto-save draft functionality
 */
export function TopicForm({ initialData, onSubmit, mode, enableAutoSave = true }: TopicFormProps) {
  const [tagInput, setTagInput] = useState('');
  const [seoKeywordInput, setSeoKeywordInput] = useState('');
  const [articleSeoKeywordInput, setArticleSeoKeywordInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showTopicSeo, setShowTopicSeo] = useState(false);
  const [showArticleSeo, setShowArticleSeo] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showThumbnailPicker, setShowThumbnailPicker] = useState(false);

  const form = useForm<TopicFormSchema>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(topicFormSchema) as any,
    defaultValues: {
      slug: initialData?.slug || '',
      title: initialData?.title || '',
      locale: initialData?.locale || 'en',
      tags: initialData?.tags || [],
      thumbnailUrl: initialData?.thumbnailUrl || '',
      mainQuestion: initialData?.mainQuestion || '',
      seoTitle: initialData?.seoTitle || '',
      seoDescription: initialData?.seoDescription || '',
      seoKeywords: initialData?.seoKeywords || [],
      articleContent: initialData?.articleContent || '',
      articleStatus: initialData?.articleStatus || 'DRAFT',
      articleSeoTitle: initialData?.articleSeoTitle || '',
      articleSeoDescription: initialData?.articleSeoDescription || '',
      articleSeoKeywords: initialData?.articleSeoKeywords || [],
      faqItems: initialData?.faqItems || [],
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
    control,
    getValues,
  } = form;

  const title = watch('title');
  const slug = watch('slug');
  const tags = watch('tags');
  const thumbnailUrl = watch('thumbnailUrl');
  const seoKeywords = watch('seoKeywords');
  const articleContent = watch('articleContent');
  const articleStatus = watch('articleStatus');
  const articleSeoKeywords = watch('articleSeoKeywords');

  /**
   * Auto-generate slug from title in create mode
   * Converts title to lowercase, replaces spaces with hyphens
   */
  useEffect(() => {
    if (mode === 'create' && title && !slug) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setValue('slug', generatedSlug);
    }
  }, [title, slug, mode, setValue]);

  /**
   * Auto-save draft functionality
   * Saves form data to localStorage every 30 seconds
   */
  useEffect(() => {
    if (!enableAutoSave) return;

    const autoSaveInterval = setInterval(() => {
      const formData = getValues();
      
      // Only auto-save if there's meaningful content
      if (formData.title && formData.articleContent && formData.articleContent.length > 50) {
        try {
          setAutoSaveStatus('saving');
          
          // Save to localStorage
          const draftKey = mode === 'edit' ? `topic-draft-${slug}` : 'topic-draft-new';
          localStorage.setItem(draftKey, JSON.stringify({
            ...formData,
            savedAt: new Date().toISOString(),
          }));
          
          console.log('[Auto-save] Draft saved successfully:', draftKey);
          
          setAutoSaveStatus('saved');
          setLastSaved(new Date());
          
          // Reset status after 2 seconds
          setTimeout(() => setAutoSaveStatus('idle'), 2000);
        } catch (error) {
          console.error('[Auto-save] Failed:', error);
          setAutoSaveStatus('error');
          setTimeout(() => setAutoSaveStatus('idle'), 2000);
        }
      } else {
        console.log('[Auto-save] Skipped - insufficient content', {
          hasTitle: !!formData.title,
          contentLength: formData.articleContent?.length || 0,
        });
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [enableAutoSave, mode, slug, getValues]);

  /**
   * Load draft from localStorage on mount
   */
  useEffect(() => {
    if (!enableAutoSave || mode !== 'create') return;

    const draftKey = 'topic-draft-new';
    const savedDraft = localStorage.getItem(draftKey);
    
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        
        // Ask user if they want to restore the draft
        const shouldRestore = window.confirm(
          `A draft was found from ${new Date(draft.savedAt).toLocaleString()}. Would you like to restore it?`
        );
        
        if (shouldRestore) {
          Object.keys(draft).forEach((key) => {
            if (key !== 'savedAt') {
              setValue(key as keyof TopicFormSchema, draft[key]);
            }
          });
          setLastSaved(new Date(draft.savedAt));
        } else {
          localStorage.removeItem(draftKey);
        }
      } catch (error) {
        console.error('Failed to restore draft:', error);
      }
    }
  }, [enableAutoSave, mode, setValue]);

  /**
   * Handle form submission
   */
  const handleFormSubmit = async (data: TopicFormSchema) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Add a tag to the tags array
   */
  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setValue('tags', [...tags, trimmedTag]);
      setTagInput('');
      trigger('tags');
    }
  };

  /**
   * Remove a tag from the tags array
   */
  const handleRemoveTag = (tagToRemove: string) => {
    setValue(
      'tags',
      tags.filter((tag) => tag !== tagToRemove)
    );
    trigger('tags');
  };

  /**
   * Handle Enter key press in tag input
   */
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  /**
   * Add an SEO keyword to the topic SEO keywords array
   */
  const handleAddSeoKeyword = () => {
    const trimmedKeyword = seoKeywordInput.trim();
    if (trimmedKeyword && !seoKeywords.includes(trimmedKeyword)) {
      setValue('seoKeywords', [...seoKeywords, trimmedKeyword]);
      setSeoKeywordInput('');
      trigger('seoKeywords');
    }
  };

  /**
   * Remove an SEO keyword from the topic SEO keywords array
   */
  const handleRemoveSeoKeyword = (keywordToRemove: string) => {
    setValue(
      'seoKeywords',
      seoKeywords.filter((keyword) => keyword !== keywordToRemove)
    );
    trigger('seoKeywords');
  };

  /**
   * Handle Enter key press in SEO keyword input
   */
  const handleSeoKeywordInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSeoKeyword();
    }
  };

  /**
   * Add an SEO keyword to the article SEO keywords array
   */
  const handleAddArticleSeoKeyword = () => {
    const trimmedKeyword = articleSeoKeywordInput.trim();
    if (trimmedKeyword && !articleSeoKeywords.includes(trimmedKeyword)) {
      setValue('articleSeoKeywords', [...articleSeoKeywords, trimmedKeyword]);
      setArticleSeoKeywordInput('');
      trigger('articleSeoKeywords');
    }
  };

  /**
   * Remove an SEO keyword from the article SEO keywords array
   */
  const handleRemoveArticleSeoKeyword = (keywordToRemove: string) => {
    setValue(
      'articleSeoKeywords',
      articleSeoKeywords.filter((keyword) => keyword !== keywordToRemove)
    );
    trigger('articleSeoKeywords');
  };

  /**
   * Handle Enter key press in article SEO keyword input
   */
  const handleArticleSeoKeywordInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddArticleSeoKeyword();
    }
  };

  /**
   * Handle thumbnail selection from media picker
   */
  const handleThumbnailSelect = (media: Media) => {
    setValue('thumbnailUrl', media.url);
    trigger('thumbnailUrl');
  };

  /**
   * Remove selected thumbnail
   */
  const handleRemoveThumbnail = () => {
    setValue('thumbnailUrl', '');
    trigger('thumbnailUrl');
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Auto-save Status Indicator */}
      {enableAutoSave && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            {autoSaveStatus === 'saving' && (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-muted-foreground">Saving draft...</span>
              </>
            )}
            {autoSaveStatus === 'saved' && (
              <>
                <span className="h-2 w-2 rounded-full bg-green-600"></span>
                <span className="text-muted-foreground">Draft saved</span>
              </>
            )}
            {autoSaveStatus === 'error' && (
              <>
                <span className="h-2 w-2 rounded-full bg-red-600"></span>
                <span className="text-destructive">Auto-save failed</span>
              </>
            )}
            {autoSaveStatus === 'idle' && lastSaved && (
              <>
                <span className="h-2 w-2 rounded-full bg-gray-400"></span>
                <span className="text-muted-foreground">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              </>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            Auto-saves every 30 seconds
          </span>
        </div>
      )}

      {/* Title Field */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          Title <span className="text-red-500">*</span>
        </label>
        <Input
          id="title"
          type="text"
          {...register('title')}
          placeholder="Enter topic title"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        {errors.title && (
          <p id="title-error" role="alert" className="text-sm text-red-600 mt-1">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Slug Field */}
      <div>
        <label htmlFor="slug" className="block text-sm font-medium mb-2">
          Slug <span className="text-red-500">*</span>
        </label>
        <Input
          id="slug"
          type="text"
          {...register('slug')}
          placeholder="topic-slug"
          disabled={mode === 'edit'}
          aria-invalid={!!errors.slug}
          aria-describedby={errors.slug ? 'slug-error' : undefined}
        />
        {mode === 'create' && (
          <p className="text-sm text-gray-500 mt-1">
            Auto-generated from title. You can edit it before saving.
          </p>
        )}
        {mode === 'edit' && (
          <p className="text-sm text-gray-500 mt-1">
            Slug cannot be changed after creation.
          </p>
        )}
        {errors.slug && (
          <p id="slug-error" role="alert" className="text-sm text-red-600 mt-1">
            {errors.slug.message}
          </p>
        )}
      </div>

      {/* Locale Field */}
      <div>
        <label htmlFor="locale" className="block text-sm font-medium mb-2">
          Locale <span className="text-red-500">*</span>
        </label>
        <Input
          id="locale"
          type="text"
          {...register('locale')}
          placeholder="en"
          maxLength={2}
          aria-invalid={!!errors.locale}
          aria-describedby={errors.locale ? 'locale-error' : undefined}
        />
        <p className="text-sm text-gray-500 mt-1">
          2-letter language code (e.g., en, fr, es)
        </p>
        {errors.locale && (
          <p id="locale-error" role="alert" className="text-sm text-red-600 mt-1">
            {errors.locale.message}
          </p>
        )}
      </div>

      {/* Tags Field */}
      <div>
        <label htmlFor="tag-input" className="block text-sm font-medium mb-2">
          Tags <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <Input
            id="tag-input"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            placeholder="Enter a tag and press Enter"
            aria-describedby="tags-help"
          />
          <Button
            type="button"
            onClick={handleAddTag}
            variant="outline"
            disabled={!tagInput.trim()}
          >
            Add
          </Button>
        </div>
        <p id="tags-help" className="text-sm text-gray-500 mt-1">
          Press Enter or click Add to add a tag
        </p>

        {/* Display Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                  aria-label={`Remove ${tag} tag`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {errors.tags && (
          <p role="alert" className="text-sm text-red-600 mt-1">
            {errors.tags.message}
          </p>
        )}
      </div>

      {/* Thumbnail Field */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Thumbnail Image
        </label>
        <div className="space-y-3">
          {thumbnailUrl ? (
            <div className="flex items-start gap-4 p-4 border rounded-lg bg-gray-50">
              <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={thumbnailUrl}
                  alt="Topic thumbnail"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 mb-1">Thumbnail selected</p>
                <p className="text-xs text-gray-500 break-all">{thumbnailUrl}</p>
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowThumbnailPicker(true)}
                  >
                    Change
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveThumbnail}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                  <Search className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 mb-3">No thumbnail selected</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowThumbnailPicker(true)}
                >
                  Select Thumbnail
                </Button>
              </div>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Choose an image to represent this topic. Recommended size: 400x300px or larger.
        </p>
        {errors.thumbnailUrl && (
          <p role="alert" className="text-sm text-red-600 mt-1">
            {errors.thumbnailUrl.message}
          </p>
        )}
      </div>

      {/* Main Question Field */}
      <div>
        <label htmlFor="mainQuestion" className="block text-sm font-medium mb-2">
          Main Question <span className="text-red-500">*</span>
        </label>
        <Input
          id="mainQuestion"
          type="text"
          {...register('mainQuestion')}
          placeholder="What is the main question this article answers?"
          aria-invalid={!!errors.mainQuestion}
          aria-describedby={errors.mainQuestion ? 'mainQuestion-error' : undefined}
        />
        {errors.mainQuestion && (
          <p id="mainQuestion-error" role="alert" className="text-sm text-red-600 mt-1">
            {errors.mainQuestion.message}
          </p>
        )}
      </div>

      {/* Topic SEO Section */}
      <Card>
        <Collapsible open={showTopicSeo} onOpenChange={setShowTopicSeo}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Topic SEO Settings
                </div>
                {showTopicSeo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Optimize how this topic appears in search engines and social media.
              </p>

              {/* Topic SEO Title */}
              <div>
                <label htmlFor="seoTitle" className="block text-sm font-medium mb-2">
                  SEO Title
                </label>
                <Input
                  id="seoTitle"
                  type="text"
                  {...register('seoTitle')}
                  placeholder="Optimized title for search engines (10-60 characters)"
                  maxLength={60}
                  aria-invalid={!!errors.seoTitle}
                  aria-describedby={errors.seoTitle ? 'seoTitle-error' : undefined}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {watch('seoTitle')?.length || 0}/60 characters
                </p>
                {errors.seoTitle && (
                  <p id="seoTitle-error" role="alert" className="text-sm text-red-600 mt-1">
                    {errors.seoTitle.message}
                  </p>
                )}
              </div>

              {/* Topic SEO Description */}
              <div>
                <label htmlFor="seoDescription" className="block text-sm font-medium mb-2">
                  SEO Description
                </label>
                <Textarea
                  id="seoDescription"
                  {...register('seoDescription')}
                  placeholder="Brief description for search results (50-160 characters)"
                  maxLength={160}
                  rows={3}
                  aria-invalid={!!errors.seoDescription}
                  aria-describedby={errors.seoDescription ? 'seoDescription-error' : undefined}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {watch('seoDescription')?.length || 0}/160 characters
                </p>
                {errors.seoDescription && (
                  <p id="seoDescription-error" role="alert" className="text-sm text-red-600 mt-1">
                    {errors.seoDescription.message}
                  </p>
                )}
              </div>

              {/* Topic SEO Keywords */}
              <div>
                <label htmlFor="seo-keyword-input" className="block text-sm font-medium mb-2">
                  SEO Keywords
                </label>
                <div className="flex gap-2">
                  <Input
                    id="seo-keyword-input"
                    type="text"
                    value={seoKeywordInput}
                    onChange={(e) => setSeoKeywordInput(e.target.value)}
                    onKeyDown={handleSeoKeywordInputKeyDown}
                    placeholder="Enter SEO keyword and press Enter"
                    maxLength={30}
                  />
                  <Button
                    type="button"
                    onClick={handleAddSeoKeyword}
                    variant="outline"
                    disabled={!seoKeywordInput.trim()}
                  >
                    Add
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Keywords help search engines understand your content
                </p>

                {/* Display SEO Keywords */}
                {seoKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {seoKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => handleRemoveSeoKeyword(keyword)}
                          className="hover:bg-green-200 rounded-full p-0.5 transition-colors"
                          aria-label={`Remove ${keyword} SEO keyword`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {errors.seoKeywords && (
                  <p role="alert" className="text-sm text-red-600 mt-1">
                    {errors.seoKeywords.message}
                  </p>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Article Status Field */}
      <div>
        <label htmlFor="articleStatus" className="block text-sm font-medium mb-2">
          Article Status <span className="text-red-500">*</span>
        </label>
        <select
          id="articleStatus"
          {...register('articleStatus')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-invalid={!!errors.articleStatus}
          aria-describedby={errors.articleStatus ? 'articleStatus-error' : undefined}
        >
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>
        <p className="text-sm text-gray-500 mt-1">
          Draft articles are not visible to the public
        </p>
        {errors.articleStatus && (
          <p id="articleStatus-error" role="alert" className="text-sm text-red-600 mt-1">
            {errors.articleStatus.message}
          </p>
        )}
      </div>

      {/* Article Content Field */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="articleContent" className="block text-sm font-medium">
            Article Content <span className="text-red-500">*</span>
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(true)}
            disabled={!articleContent}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </div>
        <Controller
          name="articleContent"
          control={control}
          render={({ field }) => (
            <RichTextEditor
              content={field.value}
              onChange={field.onChange}
              placeholder="Write your article content here..."
            />
          )}
        />
        {errors.articleContent && (
          <p role="alert" className="text-sm text-red-600 mt-1">
            {errors.articleContent.message}
          </p>
        )}
      </div>

      {/* Article SEO Section */}
      <Card>
        <Collapsible open={showArticleSeo} onOpenChange={setShowArticleSeo}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Article SEO Settings
                </div>
                {showArticleSeo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Fine-tune SEO specifically for the article content.
              </p>

              {/* Article SEO Title */}
              <div>
                <label htmlFor="articleSeoTitle" className="block text-sm font-medium mb-2">
                  Article SEO Title
                </label>
                <Input
                  id="articleSeoTitle"
                  type="text"
                  {...register('articleSeoTitle')}
                  placeholder="Article-specific SEO title (10-60 characters)"
                  maxLength={60}
                  aria-invalid={!!errors.articleSeoTitle}
                  aria-describedby={errors.articleSeoTitle ? 'articleSeoTitle-error' : undefined}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {watch('articleSeoTitle')?.length || 0}/60 characters
                </p>
                {errors.articleSeoTitle && (
                  <p id="articleSeoTitle-error" role="alert" className="text-sm text-red-600 mt-1">
                    {errors.articleSeoTitle.message}
                  </p>
                )}
              </div>

              {/* Article SEO Description */}
              <div>
                <label htmlFor="articleSeoDescription" className="block text-sm font-medium mb-2">
                  Article SEO Description
                </label>
                <Textarea
                  id="articleSeoDescription"
                  {...register('articleSeoDescription')}
                  placeholder="Article-specific description for search results (50-160 characters)"
                  maxLength={160}
                  rows={3}
                  aria-invalid={!!errors.articleSeoDescription}
                  aria-describedby={errors.articleSeoDescription ? 'articleSeoDescription-error' : undefined}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {watch('articleSeoDescription')?.length || 0}/160 characters
                </p>
                {errors.articleSeoDescription && (
                  <p id="articleSeoDescription-error" role="alert" className="text-sm text-red-600 mt-1">
                    {errors.articleSeoDescription.message}
                  </p>
                )}
              </div>

              {/* Article SEO Keywords */}
              <div>
                <label htmlFor="article-seo-keyword-input" className="block text-sm font-medium mb-2">
                  Article SEO Keywords
                </label>
                <div className="flex gap-2">
                  <Input
                    id="article-seo-keyword-input"
                    type="text"
                    value={articleSeoKeywordInput}
                    onChange={(e) => setArticleSeoKeywordInput(e.target.value)}
                    onKeyDown={handleArticleSeoKeywordInputKeyDown}
                    placeholder="Enter article SEO keyword and press Enter"
                    maxLength={30}
                  />
                  <Button
                    type="button"
                    onClick={handleAddArticleSeoKeyword}
                    variant="outline"
                    disabled={!articleSeoKeywordInput.trim()}
                  >
                    Add
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Article-specific keywords for better content targeting
                </p>

                {/* Display Article SEO Keywords */}
                {articleSeoKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {articleSeoKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => handleRemoveArticleSeoKeyword(keyword)}
                          className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                          aria-label={`Remove ${keyword} article SEO keyword`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {errors.articleSeoKeywords && (
                  <p role="alert" className="text-sm text-red-600 mt-1">
                    {errors.articleSeoKeywords.message}
                  </p>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* FAQ Items Section */}
      <div>
        <Controller
          name="faqItems"
          control={control}
          render={({ field }) => (
            <FAQManager
              items={field.value}
              onChange={(items: FAQItem[]) => {
                field.onChange(items);
                trigger('faqItems');
              }}
            />
          )}
        />
        {errors.faqItems && (
          <p role="alert" className="text-sm text-red-600 mt-1">
            {errors.faqItems.message}
          </p>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Article Preview</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="mb-4 pb-4 border-b">
              <h1 className="text-3xl font-bold mb-2">{title || 'Untitled'}</h1>
              <p className="text-lg text-gray-600 italic">{watch('mainQuestion') || 'No main question'}</p>
              <div className="flex gap-2 mt-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-2">
                <span
                  className={`inline-block px-2 py-1 rounded text-sm ${
                    articleStatus === 'PUBLISHED'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {articleStatus}
                </span>
              </div>
            </div>
            <div
              className="prose prose-sm sm:prose lg:prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: articleContent }}
            />
            {watch('faqItems').length > 0 && (
              <div className="mt-8 pt-8 border-t">
                <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {watch('faqItems').map((item, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <h3 className="font-semibold text-lg mb-2">{item.question}</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Submit Button */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Topic' : 'Update Topic'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
      </div>

      {/* Media Picker Modal */}
      <MediaPicker
        isOpen={showThumbnailPicker}
        onClose={() => setShowThumbnailPicker(false)}
        onSelect={handleThumbnailSelect}
        selectedMediaId={thumbnailUrl ? undefined : undefined}
        title="Select Thumbnail Image"
        allowedTypes={['image']}
      />
    </form>
  );
}
