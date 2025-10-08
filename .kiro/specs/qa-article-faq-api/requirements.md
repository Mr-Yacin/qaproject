# Requirements Document

## Introduction

This feature implements a secure, API-first backend for managing Q&A content, articles, and FAQs. The system provides webhook-based content ingestion with HMAC signature verification, public read endpoints for content retrieval, and cache revalidation capabilities. Built on Next.js App Router with TypeScript, Prisma ORM, and PostgreSQL, it serves as a headless CMS for knowledge base content without UI components.

## Requirements

### Requirement 1: Secure Webhook Ingestion

**User Story:** As a content management system, I want to securely receive and process content updates via webhook, so that only authorized sources can modify the knowledge base.

#### Acceptance Criteria

1. WHEN a POST request is made to /api/ingest THEN the system SHALL validate the presence of x-api-key, x-timestamp, and x-signature headers
2. WHEN x-api-key does not match the configured INGEST_API_KEY THEN the system SHALL return 401 Unauthorized
3. WHEN x-timestamp is more than 5 minutes in the past or future THEN the system SHALL return 401 Unauthorized with "Request expired"
4. WHEN x-signature is computed, the system SHALL use HMAC-SHA256 with INGEST_WEBHOOK_SECRET on the string "{timestamp}.{rawBody}"
5. WHEN x-signature does not match the computed signature THEN the system SHALL perform timing-safe comparison and return 401 Unauthorized
6. WHEN all security checks pass THEN the system SHALL parse the JSON body using Zod validation
7. WHEN the JSON body fails Zod validation THEN the system SHALL return 400 Bad Request with validation errors
8. WHEN validation succeeds THEN the system SHALL process the content and return 200 OK

### Requirement 2: Content Data Models

**User Story:** As a developer, I want well-defined data models for content entities, so that the system maintains data integrity and supports the required content structure.

#### Acceptance Criteria

1. WHEN defining the Topic model THEN it SHALL include fields: id, slug (unique), title, locale, tags (array), createdAt, updatedAt
2. WHEN defining the Question model THEN it SHALL include fields: id, topicId (FK), text, isPrimary (boolean), createdAt, updatedAt
3. WHEN defining the Article model THEN it SHALL include fields: id, topicId (FK), content, status (ContentStatus enum), createdAt, updatedAt
4. WHEN defining the FAQItem model THEN it SHALL include fields: id, topicId (FK), question, answer, order, createdAt, updatedAt
5. WHEN defining the IngestJob model THEN it SHALL include fields: id, topicSlug, status, payload (JSON), error, createdAt, completedAt
6. WHEN defining ContentStatus enum THEN it SHALL have values: DRAFT, PUBLISHED
7. WHEN a Topic is deleted THEN the system SHALL cascade delete related Questions, Articles, and FAQItems

### Requirement 3: Content Ingestion Processing

**User Story:** As a content publisher, I want to ingest complete topic packages with questions, articles, and FAQs, so that content updates are atomic and consistent.

#### Acceptance Criteria

1. WHEN processing an ingest request THEN the system SHALL upsert the Topic by slug
2. WHEN upserting a Topic THEN the system SHALL update title, locale, and tags if the topic exists
3. WHEN processing the main question THEN the system SHALL upsert a Question with isPrimary=true for the topic
4. WHEN processing the article THEN the system SHALL upsert the Article for the topic
5. WHEN processing FAQ items THEN the system SHALL delete all existing FAQItems for the topic and create new ones
6. WHEN the ingest operation begins THEN the system SHALL create an IngestJob record with status "processing"
7. WHEN the ingest operation succeeds THEN the system SHALL update IngestJob status to "completed" with completedAt timestamp
8. WHEN the ingest operation fails THEN the system SHALL update IngestJob status to "failed" with error details
9. WHEN the same ingest payload is submitted twice THEN the system SHALL produce identical results (idempotency)

### Requirement 4: Public Content Retrieval

**User Story:** As a content consumer, I want to retrieve published content by topic or through filtered listings, so that I can display knowledge base content to end users.

#### Acceptance Criteria

1. WHEN a GET request is made to /api/topics/[slug] THEN the system SHALL return a unified document with topic, primary question, article, and FAQ items
2. WHEN retrieving a topic by slug AND the topic does not exist THEN the system SHALL return 404 Not Found
3. WHEN retrieving a topic by slug THEN the system SHALL only include Articles with status=PUBLISHED
4. WHEN retrieving a topic by slug THEN the system SHALL include FAQItems ordered by the order field
5. WHEN a GET request is made to /api/topics THEN the system SHALL support query parameters: locale, tag, page, limit
6. WHEN listing topics with locale filter THEN the system SHALL return only topics matching that locale
7. WHEN listing topics with tag filter THEN the system SHALL return only topics containing that tag
8. WHEN listing topics with page and limit THEN the system SHALL return paginated results with metadata (total, page, limit)
9. WHEN listing topics THEN the system SHALL only include topics that have at least one PUBLISHED article

### Requirement 5: Cache Revalidation

**User Story:** As a content publisher, I want to trigger cache revalidation after content updates, so that changes are reflected immediately without waiting for cache expiration.

#### Acceptance Criteria

1. WHEN a POST request is made to /api/revalidate THEN the system SHALL validate x-api-key, x-timestamp, and x-signature headers using the same security mechanism as /api/ingest
2. WHEN security validation fails on /api/revalidate THEN the system SHALL return 401 Unauthorized
3. WHEN the request body contains a "tag" field THEN the system SHALL call Next.js revalidateTag(tag)
4. WHEN the request body is missing the "tag" field THEN the system SHALL return 400 Bad Request
5. WHEN revalidation succeeds THEN the system SHALL return 200 OK with confirmation message

### Requirement 6: Validation and Error Handling

**User Story:** As a system administrator, I want comprehensive validation and clear error messages, so that integration issues can be quickly diagnosed and resolved.

#### Acceptance Criteria

1. WHEN validating ingest payloads THEN the system SHALL use Zod schemas for type safety
2. WHEN Zod validation fails THEN the system SHALL return 400 Bad Request with detailed field-level errors
3. WHEN a database operation fails THEN the system SHALL return 500 Internal Server Error with a generic message
4. WHEN a database operation fails THEN the system SHALL log detailed error information server-side
5. WHEN environment variables (INGEST_API_KEY, INGEST_WEBHOOK_SECRET, DATABASE_URL) are missing THEN the system SHALL fail to start with clear error messages

### Requirement 7: Testing Coverage

**User Story:** As a developer, I want comprehensive acceptance tests, so that security, validation, and business logic are verified automatically.

#### Acceptance Criteria

1. WHEN running acceptance tests THEN the system SHALL include tests for invalid API key rejection
2. WHEN running acceptance tests THEN the system SHALL include tests for expired timestamp rejection
3. WHEN running acceptance tests THEN the system SHALL include tests for invalid signature rejection
4. WHEN running acceptance tests THEN the system SHALL include tests for Zod validation failures
5. WHEN running acceptance tests THEN the system SHALL include tests for successful content ingestion
6. WHEN running acceptance tests THEN the system SHALL include tests for idempotent ingestion (double POST with same payload)
7. WHEN running acceptance tests THEN the system SHALL include tests for topic retrieval with published content
8. WHEN running acceptance tests THEN the system SHALL include tests for topic listing with filters
9. WHEN running acceptance tests THEN the system SHALL include tests for cache revalidation

### Requirement 8: Non-Goals and Constraints

**User Story:** As a project stakeholder, I want clear boundaries on what this feature does not include, so that scope is well-defined and expectations are managed.

#### Acceptance Criteria

1. WHEN implementing this feature THEN the system SHALL NOT include any UI components or pages
2. WHEN implementing this feature THEN the system SHALL NOT include authentication providers (OAuth, JWT, etc.)
3. WHEN implementing this feature THEN the system SHALL NOT include rate limiting mechanisms
4. WHEN implementing this feature THEN the system SHALL focus exclusively on API endpoints and data models
