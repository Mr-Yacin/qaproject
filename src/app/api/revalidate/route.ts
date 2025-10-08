import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { validateSecurity } from '@/lib/security/validate';
import { RevalidatePayloadSchema } from '@/lib/validation/schemas';

/**
 * POST /api/revalidate
 * Secure endpoint for triggering cache revalidation
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
export async function POST(request: NextRequest) {
    try {
        // Extract raw body text for signature verification (Requirement 5.1)
        const rawBody = await request.text();

        // Extract security headers (Requirement 5.1)
        const securityHeaders = {
            apiKey: request.headers.get('x-api-key'),
            timestamp: request.headers.get('x-timestamp'),
            signature: request.headers.get('x-signature'),
        };

        // Validate security headers and signature (Requirements 5.1, 5.2)
        const securityResult = validateSecurity(securityHeaders, rawBody);

        // Return 401 if security validation fails (Requirement 5.2)
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

        // Validate with RevalidatePayloadSchema (Requirement 5.4)
        const validationResult = RevalidatePayloadSchema.safeParse(parsedBody);

        // Return 400 if tag field is missing or validation fails (Requirement 5.4)
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: validationResult.error.format(),
                },
                { status: 400 }
            );
        }

        // Call Next.js revalidateTag() with tag value (Requirements 5.3, 5.5)
        revalidateTag(validationResult.data.tag);

        // Return 200 with confirmation message (Requirement 5.5)
        return NextResponse.json(
            {
                message: 'Revalidated successfully',
                tag: validationResult.data.tag,
            },
            { status: 200 }
        );
    } catch (error) {
        // Log errors server-side
        console.error('Revalidate API error:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
        });

        // Return 500 with generic error on exception
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
