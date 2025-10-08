import { NextRequest, NextResponse } from 'next/server';
import { validateSecurity } from '@/lib/security/validate';
import { IngestPayloadSchema } from '@/lib/validation/schemas';
import { ContentService } from '@/lib/services/content.service';
import { ContentRepository } from '@/lib/repositories/content.repository';

/**
 * POST /api/ingest
 * Secure webhook endpoint for content ingestion
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 3.1, 3.2, 3.3, 3.4, 3.5, 6.2, 6.3, 6.4
 */
export async function POST(request: NextRequest) {
    try {
        // Extract raw body text for signature verification (Requirement 1.4)
        const rawBody = await request.text();

        // Extract security headers (Requirements 1.1, 1.2, 1.3)
        const securityHeaders = {
            apiKey: request.headers.get('x-api-key'),
            timestamp: request.headers.get('x-timestamp'),
            signature: request.headers.get('x-signature'),
        };

        // Validate security headers and signature (Requirements 1.1, 1.2, 1.3, 1.4, 1.5)
        const securityResult = validateSecurity(securityHeaders, rawBody);

        // Return 401 if security validation fails (Requirement 1.8)
        if (!securityResult.valid) {
            return NextResponse.json(
                { error: 'Unauthorized', details: securityResult.error },
                { status: 401 }
            );
        }

        // Parse JSON body
        let parsedBody;
        try {
            parsedBody = JSON.parse(rawBody);
        } catch (error) {
            return NextResponse.json(
                { error: 'Invalid JSON', details: 'Request body must be valid JSON' },
                { status: 400 }
            );
        }

        // Validate with IngestPayloadSchema (Requirements 1.6, 1.7)
        const validationResult = IngestPayloadSchema.safeParse(parsedBody);

        // Return 400 if Zod validation fails with detailed errors (Requirement 6.2)
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: validationResult.error.format(),
                },
                { status: 400 }
            );
        }

        // Initialize service with repository
        const repository = new ContentRepository();
        const contentService = new ContentService(repository);

        // Call contentService.ingestContent() (Requirements 3.1, 3.2, 3.3, 3.4, 3.5)
        const result = await contentService.ingestContent(validationResult.data);

        // Return 200 with result on success (Requirement 6.3)
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        // Log errors server-side (Requirement 6.4)
        console.error('Ingest API error:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
        });

        // Return 500 with generic error on exception (Requirement 6.4)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
