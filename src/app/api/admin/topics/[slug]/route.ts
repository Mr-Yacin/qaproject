import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ContentService } from '@/lib/services/content.service';
import { ContentRepository } from '@/lib/repositories/content.repository';
import { revalidateTag } from 'next/cache';

/**
 * GET /api/admin/topics/[slug]
 * Get a single topic including drafts (admin only)
 * Requirements: 4.4, 4.5
 */
export async function GET(
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

    // Initialize repository
    const repository = new ContentRepository();

    // Get topic (including drafts)
    const topic = await repository.findTopicBySlugIncludingDrafts(slug);
    
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(topic);
  } catch (error) {
    console.error('Get admin topic error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch topic',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

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

    // Get topic details for impact summary (including drafts)
    const topic = await repository.findTopicBySlugIncludingDrafts(slug);
    
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
