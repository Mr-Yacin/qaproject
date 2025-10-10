'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { TopicForm } from '@/components/admin/TopicForm';
import { getTopicBySlug } from '@/lib/api/topics';
import { createOrUpdateTopic, revalidateTopicCache } from '@/lib/api/ingest';
import { useToast } from '@/hooks/use-toast';
import type { TopicFormSchema } from '@/lib/utils/validation';
import type { IngestPayload, UnifiedTopic } from '@/types/api';

/**
 * Edit Topic Page
 * Allows admins to edit an existing topic
 * Requirements: 4.4, 4.5, 8.8
 */
export default function EditTopicPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const slug = params.slug as string;

  const [topic, setTopic] = useState<UnifiedTopic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch topic data on mount
   */
  useEffect(() => {
    const fetchTopic = async () => {
      try {
        setIsLoading(true);
        const data = await getTopicBySlug(slug);
        setTopic(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch topic');
        toast({
          title: 'Error',
          description: 'Failed to load topic data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchTopic();
    }
  }, [slug, toast]);

  /**
   * Handle form submission
   * Updates the topic via the ingest API
   */
  const handleSubmit = async (data: TopicFormSchema) => {
    if (!topic) return;

    try {
      // Transform form data to IngestPayload format
      const payload: IngestPayload = {
        topic: {
          slug: data.slug,
          title: data.title,
          locale: data.locale,
          tags: data.tags,
        },
        mainQuestion: {
          text: data.mainQuestion,
        },
        article: {
          content: data.articleContent,
          status: data.articleStatus,
        },
        faqItems: data.faqItems.map((item) => ({
          question: item.question,
          answer: item.answer,
          order: item.order,
        })),
      };

      // Update the topic
      await createOrUpdateTopic(payload);

      // Show loading toast for revalidation
      toast({
        title: 'Revalidating cache...',
        description: 'Updating cached content',
      });

      // Revalidate cache for 'topics' tag and specific 'topic:[slug]' tag
      await revalidateTopicCache(data.slug);

      // Show success message
      toast({
        title: 'Success',
        description: 'Topic updated and cache revalidated successfully',
      });

      // Redirect to topics list
      router.push('/admin/topics');
    } catch (error) {
      // Show error message
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update topic',
        variant: 'destructive',
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="space-y-3">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !topic) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error || 'Topic not found'}</p>
            <button
              onClick={() => router.push('/admin/topics')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Back to Topics
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Prepare initial form data
  const initialData: TopicFormSchema = {
    slug: topic.topic.slug,
    title: topic.topic.title,
    locale: topic.topic.locale,
    tags: topic.topic.tags,
    mainQuestion: topic.primaryQuestion?.text || topic.topic.title,
    articleContent: topic.article?.content || '',
    articleStatus: (topic.article?.status as 'DRAFT' | 'PUBLISHED') || 'DRAFT',
    faqItems: topic.faqItems.map((item) => ({
      question: item.question,
      answer: item.answer,
      order: item.order,
    })),
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Edit Topic</h1>
        <p className="text-gray-600">
          Update the basic information for this topic.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <TopicForm mode="edit" initialData={initialData} onSubmit={handleSubmit} enableAutoSave={true} />
      </div>
    </div>
  );
}
