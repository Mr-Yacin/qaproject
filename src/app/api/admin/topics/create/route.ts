import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ContentService } from '@/lib/services/content.service';
import { ContentRepository } from '@/lib/repositories/content.repository';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';

/**
 * Validation schema for topic creation
 */
const createTopicSchema = z.object({
  topic: z.object({
    slug: z.string(),
    title: z.string(),
    locale: z.string(),
    tags: z.array(z.string()),
  }),
  mainQuestion: z.object({
    text: z.string(),
  }),
  article: z.object({
    content: z.string(),
    status: z.enum(['DRAFT', 'PUBLISHED']),
  }),
  faqItems: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
      order: z.number(),
    })
  ),
});

/**
 * POST /api/admin/topics/create
 * Create a new topic (admin only, no HMAC required)
 * Requirements: 4.3, 1.1, 1.2, 1.3, 1.4
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createTopicSchema.parse(body);

    // Initialize service
    const repository = new ContentRepository();
    const service = new ContentService(repository);

    // Create the topic using the ingest service
    const result = await service.ingestContent(validatedData);

    // Revalidate cache
    revalidateTag('topics');
    revalidateTag(`topic:${validatedData.topic.slug}`);

    return NextResponse.json({
      success: true,
      topicId: result.topicId,
      message: 'Topic created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Create topic error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to create topic',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
