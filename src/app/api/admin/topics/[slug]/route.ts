import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ContentService } from '@/lib/services/content.service';
import { ContentRepository } from '@/lib/repositories/content.repository';
import { revalidateTag } from 'next/cache';

/**
 * DELETE /api/admin/topics/[slug]
 * Delete a topic and all related records
 * Requirements: 1.5, 1.6, 1.7
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { slug } = params;

    // Initialize service
    const repository = new ContentRepository();
    const service = new ContentService(repository);

    // Get topic details for impact summary
    const topic = await service.getTopicBySlug(slug);
    
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Delete the topic (cascade delete will handle related records)
    await repository.deleteTopicBySlug(slug);

    // Revalidate cache
    revalidateTag('topics');
    revalidateTag(`topic:${slug}`);

    // Return success with impact summary
    return NextResponse.json({
      success: true,
      message: 'Topic deleted successfully',
      impact: {
        topicId: topic.topic.id,
        slug: topic.topic.slug,
        title: topic.topic.title,
        deletedRecords: {
          questions: topic.primaryQuestion ? 1 : 0,
          article: topic.article ? 1 : 0,
          faqItems: topic.faqItems.length,
        },
      },
    });
  } catch (error) {
    console.error('Delete topic error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete topic',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
