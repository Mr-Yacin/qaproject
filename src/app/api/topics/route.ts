import { NextRequest, NextResponse } from 'next/server';
import { ContentService } from '@/lib/services/content.service';
import { ContentRepository } from '@/lib/repositories/content.repository';
import { prisma } from '@/lib/db';
import { TopicsQuerySchema } from '@/lib/validation/schemas';

/**
 * GET /api/topics
 * List topics with filtering and pagination
 * Requirements: 4.5, 4.6, 4.7, 4.8, 4.9, 6.2
 */
export async function GET(request: NextRequest) {
  try {
    // Extract query parameters from URL
    const { searchParams } = new URL(request.url);

    // Build query object, only including non-null values
    const query: any = {};
    const locale = searchParams.get('locale');
    const tag = searchParams.get('tag');
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');

    if (locale !== null) query.locale = locale;
    if (tag !== null) query.tag = tag;
    if (page !== null) query.page = page;
    if (limit !== null) query.limit = limit;

    // Validate with TopicsQuerySchema
    const queryResult = TopicsQuerySchema.safeParse(query);

    // Return 400 if validation fails (Requirement 6.2)
    if (!queryResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: queryResult.error.format(),
        },
        { status: 400 }
      );
    }

    // Initialize service with repository
    const repository = new ContentRepository(prisma);
    const contentService = new ContentService(repository);

    // Call contentService.listTopics() (Requirements 4.5, 4.6, 4.7, 4.8, 4.9)
    const result = await contentService.listTopics(queryResult.data);

    // Return 200 with paginated results
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    // Return 500 with generic error on exception (Requirement 6.2)
    // Log detailed error information server-side (Requirement 6.4)
    console.error('List topics error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
