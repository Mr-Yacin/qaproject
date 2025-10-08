'use client';

import { useRouter } from 'next/navigation';
import { TopicForm } from '@/components/admin/TopicForm';
import { createOrUpdateTopic } from '@/lib/api/ingest';
import { revalidateTopicCache } from '@/lib/api/ingest';
import { useToast } from '@/hooks/use-toast';
import type { TopicFormSchema } from '@/lib/utils/validation';
import type { IngestPayload } from '@/types/api';

/**
 * New Topic Page
 * Allows admins to create a new topic
 * Requirements: 4.2, 4.3, 8.8
 */
export default function NewTopicPage() {
  const router = useRouter();
  const { toast } = useToast();

  /**
   * Handle form submission
   * Creates a new topic via the ingest API
   */
  const handleSubmit = async (data: TopicFormSchema) => {
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
          text: data.title, // Use title as default main question
        },
        article: {
          content: '', // Empty content for now, will be added in later tasks
          status: 'DRAFT',
        },
        faqItems: [],
      };

      // Create the topic
      const result = await createOrUpdateTopic(payload);

      // Revalidate cache
      await revalidateTopicCache(data.slug);

      // Show success message
      toast({
        title: 'Success',
        description: 'Topic created successfully',
      });

      // Redirect to topics list
      router.push('/admin/topics');
    } catch (error) {
      // Show error message
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create topic',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Create New Topic</h1>
        <p className="text-gray-600">
          Fill in the basic information for your new topic. You can add article content and FAQs later.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <TopicForm mode="create" onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
