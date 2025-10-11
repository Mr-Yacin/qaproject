import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth.middleware';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';
import { UserRole } from '@prisma/client';
import { ContentService } from '@/lib/services/content.service';
import { ContentRepository } from '@/lib/repositories/content.repository';
import { prisma } from '@/lib/db';
import { ExportTopicsSchema } from '@/lib/validation/bulk.schema';
import { AuditService } from '@/lib/services/audit.service';
import { z } from 'zod';

/**
 * POST /api/admin/topics/export
 * Export topics as JSON
 * Requires ADMIN or EDITOR role
 * Requirements: 10.7
 */
export async function POST(request: NextRequest) {
  try {
    // Require ADMIN or EDITOR role
    const authenticatedUser = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = ExportTopicsSchema.parse(body);

    const repository = new ContentRepository();
    const contentService = new ContentService(repository);

    // Export topics
    const topics = await contentService.exportTopics({
      topicIds: validatedData.topicIds,
      locale: validatedData.filters?.locale,
      tag: validatedData.filters?.tag,
      status: validatedData.filters?.status,
    });

    // Transform to export format
    const exportData = topics.map((topic) => ({
      slug: topic.topic.slug,
      title: topic.topic.title,
      locale: topic.topic.locale,
      tags: topic.topic.tags,
      mainQuestion: {
        text: topic.primaryQuestion?.text || '',
      },
      article: {
        content: topic.article?.content || '',
        status: topic.article?.status || 'DRAFT',
      },
      faqItems: topic.faqItems.map((item) => ({
        question: item.question,
        answer: item.answer,
        order: item.order,
      })),
    }));

    // Log the action
    const auditService = new AuditService();
    await auditService.logAction({
      userId: authenticatedUser.id,
      action: 'CREATE',
      entityType: 'Topic',
      details: {
        operation: 'export',
        count: exportData.length,
        filters: validatedData.filters,
      },
    });

    return NextResponse.json(
      {
        topics: exportData,
        count: exportData.length,
        exportedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in export:', error);
    return NextResponse.json(
      { error: 'Failed to export topics' },
      { status: 500 }
    );
  }
}
