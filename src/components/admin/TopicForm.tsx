'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { topicFormSchema, type TopicFormSchema } from '@/lib/utils/validation';
import { RichTextEditor } from './RichTextEditor';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Props for TopicForm component
 * Requirements: 4.3, 4.4, 4.5, 4.8, 5.1, 5.4, 5.5, 5.6, 8.6
 */
interface TopicFormProps {
  initialData?: Partial<TopicFormSchema>;
  onSubmit: (data: TopicFormSchema) => Promise<void>;
  mode: 'create' | 'edit';
}

/**
 * TopicForm component for creating and editing topics
 * Provides form fields for slug, title, locale, and tags with validation
 * Auto-generates slug from title in create mode
 */
export function TopicForm({ initialData, onSubmit, mode }: TopicFormProps) {
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm<TopicFormSchema>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(topicFormSchema) as any,
    defaultValues: {
      slug: initialData?.slug || '',
      title: initialData?.title || '',
      locale: initialData?.locale || 'en',
      tags: initialData?.tags || [],
      mainQuestion: initialData?.mainQuestion || '',
      articleContent: initialData?.articleContent || '',
      articleStatus: initialData?.articleStatus || 'DRAFT',
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
  } = form;

  const title = watch('title');
  const slug = watch('slug');
  const tags = watch('tags');
  const articleContent = watch('articleContent');
  const articleStatus = watch('articleStatus');

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

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Submit Button */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Topic' : 'Update Topic'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
