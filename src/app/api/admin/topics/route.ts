import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ContentRepository } from '@/lib/repositories/content.repository';
import { ContentService } from '@/lib/services/content.service';

/**
 * GET /api/admin/topics
 * Get all topics including drafts (admin only)
 * Requirements: 4.1, 4.2
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const locale = searchParams.get('locale') || undefined;
    const tag = searchParams.get('tag') || undefined;

    // Initialize service
    const repository = new ContentRepository();
    const service = new ContentService(repository);

    // Fetch all topics (including drafts) using the repository directly
    const result = await repository.findAllTopics({
      page,
      limit,
      locale,
      tag,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get admin topics error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch topics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
