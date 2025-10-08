import { NextRequest, NextResponse } from 'next/server';
import { ContentService } from '@/lib/services/content.service';
import { ContentRepository } from '@/lib/repositories/content.repository';
import { prisma } from '@/lib/db';

/**
 * GET /api/topics/[slug]
 * Retrieve a single topic by slug with unified structure
 * Requirements: 4.1, 4.2, 4.3, 4.4, 6.3, 6.4
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Extract slug from params (Requirement 4.1)
    const { slug } = params;

    // Initialize service with repository
    const repository = new ContentRepository();
    const contentService = new ContentService(repository);

    // Call contentService.getTopicBySlug() (Requirements 4.1, 4.2, 4.3, 4.4)
    const topic = await contentService.getTopicBySlug(slug);

    // Return 404 if topic not found (Requirement 4.2)
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Return 200 with unified topic data (Requirements 4.1, 4.3, 4.4)
    return NextResponse.json(topic, { status: 200 });
  } catch (error) {
    // Return 500 with generic error on exception (Requirement 6.3)
    // Log detailed error information server-side (Requirement 6.4)
    console.error('Get topic error:', {
      slug: params.slug,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
