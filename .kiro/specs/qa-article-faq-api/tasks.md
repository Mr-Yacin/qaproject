# Implementation Plan

- [x] 1. Initialize Next.js project and configure dependencies





  - Create Next.js 14+ project with TypeScript and App Router
  - Install dependencies: prisma, @prisma/client, zod, vitest
  - Configure TypeScript with strict mode
  - Set up basic project structure (src/, app/, lib/ directories)
  - _Requirements: 8.4_

- [x] 2. Set up Prisma and database schema





  - Initialize Prisma with PostgreSQL provider
  - Define Prisma schema with Topic, Question, Article, FAQItem, IngestJob models
  - Define ContentStatus enum (DRAFT, PUBLISHED)
  - Add indexes for slug, locale, tags, status fields
  - Configure cascade deletes for topic relationships
  - Create initial migration
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 3. Create Prisma client singleton and type definitions





  - Implement Prisma client singleton in src/lib/db.ts
  - Create TypeScript types in src/types/api.ts for API payloads and responses
  - Export type definitions for IngestPayload, UnifiedTopic, PaginatedTopics
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. Implement security utilities





  - [x] 4.1 Create HMAC signature verification function


    - Implement generateSignature() using crypto.createHmac with SHA256
    - Compute signature from timestamp + "." + rawBody
    - Use INGEST_WEBHOOK_SECRET from environment
    - _Requirements: 1.4_

  - [x] 4.2 Create timing-safe comparison function

    - Implement timingSafeCompare() using crypto.timingSafeEqual
    - Handle string length differences safely
    - _Requirements: 1.5_
  - [x] 4.3 Create security validation middleware


    - Implement validateSecurity() to check API key, timestamp, and signature
    - Validate timestamp is within ±5 minutes
    - Return structured validation result with error messages
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 5. Create Zod validation schemas





  - Define IngestPayloadSchema with topic, mainQuestion, article, faqItems
  - Define RevalidatePayloadSchema with tag field
  - Define TopicsQuerySchema with locale, tag, page, limit
  - Add proper constraints (min/max lengths, enums, defaults)
  - _Requirements: 1.6, 1.7, 6.1_

- [x] 6. Implement repository layer




  - [x] 6.1 Create ContentRepository class


    - Implement upsertTopic() with Prisma upsert
    - Implement findTopicBySlug() with include relations
    - Implement findTopics() with filtering and pagination
    - _Requirements: 3.1, 3.2, 4.1, 4.2, 4.6, 4.7, 4.8, 4.9_
  - [x] 6.2 Implement question and article operations


    - Implement upsertPrimaryQuestion() to create/update isPrimary question
    - Implement upsertArticle() for article creation/update
    - _Requirements: 3.3, 3.4_
  - [x] 6.3 Implement FAQ operations


    - Implement replaceFAQItems() using transaction
    - Delete existing FAQ items for topic
    - Bulk create new FAQ items
    - _Requirements: 3.5_
  - [x] 6.4 Implement IngestJob operations


    - Implement createIngestJob() with status "processing"
    - Implement updateIngestJob() to set completed/failed status
    - _Requirements: 3.6, 3.7, 3.8_

- [x] 7. Implement service layer





  - [x] 7.1 Create ContentService class


    - Inject ContentRepository dependency
    - Set up error handling and logging
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 7.2 Implement ingestContent() method


    - Create IngestJob with "processing" status
    - Execute upsert operations in Prisma transaction
    - Upsert topic, primary question, article
    - Replace FAQ items
    - Update IngestJob to "completed" on success
    - Update IngestJob to "failed" with error on failure
    - Return result with topicId and jobId
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_
  - [x] 7.3 Implement getTopicBySlug() method



    - Fetch topic with questions, articles, faqItems relations
    - Filter for isPrimary question
    - Filter for PUBLISHED article only
    - Sort FAQ items by order field
    - Return unified structure or null
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 7.4 Implement listTopics() method



    - Apply locale and tag filters
    - Only include topics with PUBLISHED articles
    - Calculate total count for pagination
    - Apply page and limit for pagination
    - Return paginated results with metadata
    - _Requirements: 4.5, 4.6, 4.7, 4.8, 4.9_

- [x] 8. Implement POST /api/ingest route





  - Create app/api/ingest/route.ts with POST handler
  - Extract raw body text for signature verification
  - Call validateSecurity() with headers and raw body
  - Return 401 if security validation fails
  - Parse JSON and validate with IngestPayloadSchema
  - Return 400 if Zod validation fails with detailed errors
  - Call contentService.ingestContent()
  - Return 200 with result on success
  - Return 500 with generic error on exception
  - Log errors server-side
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 3.1, 3.2, 3.3, 3.4, 3.5, 6.2, 6.3, 6.4_

- [x] 9. Implement GET /api/topics/[slug] route





  - Create app/api/topics/[slug]/route.ts with GET handler
  - Extract slug from params
  - Call contentService.getTopicBySlug()
  - Return 404 if topic not found
  - Return 200 with unified topic data
  - Return 500 with generic error on exception
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 6.3, 6.4_

- [x] 10. Implement GET /api/topics route





  - Create app/api/topics/route.ts with GET handler
  - Extract query parameters from URL
  - Validate with TopicsQuerySchema
  - Return 400 if validation fails
  - Call contentService.listTopics()
  - Return 200 with paginated results
  - Return 500 with generic error on exception
  - _Requirements: 4.5, 4.6, 4.7, 4.8, 4.9, 6.2_

- [x] 11. Implement POST /api/revalidate route





  - Create app/api/revalidate/route.ts with POST handler
  - Extract raw body for signature verification
  - Call validateSecurity() with headers and raw body
  - Return 401 if security validation fails
  - Parse JSON and validate with RevalidatePayloadSchema
  - Return 400 if tag field is missing
  - Call Next.js revalidateTag() with tag value
  - Return 200 with confirmation message
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 12. Set up Vitest testing environment





  - Configure Vitest with test database connection
  - Create test utilities for database seeding and cleanup
  - Implement generateTestSignature() helper
  - Implement authenticatedRequest() helper
  - Implement seedTopic() and seedTopics() helpers
  - Implement cleanDatabase() helper
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9_

- [x] 13. Write security acceptance tests





  - [x] 13.1 Write tests for invalid API key rejection








    - Test POST /api/ingest with wrong x-api-key
    - Test POST /api/revalidate with wrong x-api-key
    - Assert 401 response
    - _Requirements: 1.2, 5.2, 7.1_
  - [x] 13.2 Write tests for expired timestamp rejection






    - Test with timestamp > 5 minutes in past
    - Test with timestamp > 5 minutes in future
    - Assert 401 response with "Request expired"
    - _Requirements: 1.3, 7.2_
  - [x] 13.3 Write tests for invalid signature rejection






    - Test with incorrect x-signature
    - Test with missing x-signature
    - Assert 401 response
    - _Requirements: 1.5, 7.3_

- [x] 14. Write validation acceptance tests





  - [x] 14.1 Write tests for Zod validation failures






    - Test ingest with missing topic.slug
    - Test ingest with invalid locale format
    - Test ingest with invalid article.status enum
    - Test revalidate with missing tag field
    - Assert 400 response with validation details
    - _Requirements: 1.7, 6.2, 7.4_

- [x] 15. Write idempotency acceptance tests





  - [x] 15.1 Write test for duplicate ingest requests







    - Send same payload twice with valid authentication
    - Assert both return 200
    - Query database and verify only one topic exists
    - Verify topic data matches payload
    - Verify FAQ items were replaced correctly
    - _Requirements: 3.9, 7.6_

- [x] 16. Write business logic acceptance tests





  - [x] 16.1 Write tests for topic retrieval






    - Test GET /api/topics/[slug] with published article
    - Test GET /api/topics/[slug] with draft article (should not include)
    - Test GET /api/topics/[slug] with non-existent slug (404)
    - Assert correct unified structure
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 7.7_
  - [x] 16.2 Write tests for topic listing






    - Test filtering by locale
    - Test filtering by tag
    - Test pagination with page and limit
    - Test that only topics with PUBLISHED articles are included
    - Assert correct pagination metadata
    - _Requirements: 4.5, 4.6, 4.7, 4.8, 4.9, 7.8_

- [x] 17. Write integration acceptance tests





  - [x] 17.1 Write test for complete ingestion flow






    - Send full ingest payload with topic, question, article, FAQ items
    - Assert 200 response
    - Query database and verify all entities created
    - Verify primary question has isPrimary=true
    - Verify FAQ items have correct order
    - Verify IngestJob record exists with "completed" status
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 7.5_
  - [x] 17.2 Write test for cache revalidation






    - Send valid revalidate request with tag
    - Assert 200 response with confirmation
    - Verify revalidateTag was called (mock or integration check)
    - _Requirements: 5.3, 5.4, 5.5, 7.9_

- [x] 18. Create environment configuration and documentation





  - Create .env.example with required variables
  - Document DATABASE_URL, INGEST_API_KEY, INGEST_WEBHOOK_SECRET
  - Add README with setup instructions
  - Document API endpoints and authentication
  - Add examples of valid request payloads
  - _Requirements: 6.5_

- [x] 19. Create Docker configuration




  - [x] 19.1 Create Dockerfile for Next.js application


    - Use Node.js LTS base image
    - Set up multi-stage build (dependencies, build, production)
    - Copy package files and install dependencies
    - Copy source code and build Next.js app
    - Expose port 3000
    - Set CMD to start Next.js production server
    - _Requirements: 8.4_
  - [x] 19.2 Create docker-compose.yml


    - Define PostgreSQL service with persistent volume
    - Define Next.js app service with environment variables
    - Configure network between services
    - Set up health checks for database
    - Map ports (3000 for app, 5432 for database)
    - _Requirements: 2.1, 6.5_
  - [x] 19.3 Create .dockerignore file


    - Exclude node_modules, .next, .git
    - Exclude test files and development configs
    - _Requirements: 8.4_
  - [x] 19.4 Add Docker-specific scripts to package.json


    - Add docker:build script
    - Add docker:up and docker:down scripts
    - Add docker:migrate script for running Prisma migrations in container
    - _Requirements: 2.6_

- [x] 20. Create API testing documentation and examples





  - [x] 20.1 Create test-requests/ directory with example files



    - Create ingest-example.json with sample payload
    - Create revalidate-example.json with sample payload
    - _Requirements: 6.5_
  - [x] 20.2 Create API testing script


    - Write Node.js script or shell script to generate HMAC signatures
    - Include examples for testing POST /api/ingest
    - Include examples for testing POST /api/revalidate
    - Include examples for testing GET /api/topics and GET /api/topics/[slug]
    - _Requirements: 1.4, 6.5_
  - [x] 20.3 Document curl commands for API testing


    - Add curl examples to README for POST /api/ingest with proper headers
    - Add curl examples for GET /api/topics with query parameters
    - Add curl examples for GET /api/topics/[slug]
    - Add curl examples for POST /api/revalidate
    - Include instructions for generating x-signature header
    - _Requirements: 1.1, 1.4, 4.5, 5.1, 6.5_
  - [x] 20.4 Create Postman/Thunder Client collection (optional)


    - Export collection JSON with all endpoints
    - Include pre-request scripts for HMAC signature generation
    - Add environment variables template
    - _Requirements: 6.5_
