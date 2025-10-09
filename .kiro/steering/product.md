# Product Overview

Q&A Article FAQ API is a secure, API-first backend for managing Q&A content, articles, and FAQs.

## Core Purpose

Provides a content management system with:
- Secure webhook ingestion with HMAC-SHA256 signature verification
- Public read API for retrieving published content
- On-demand cache revalidation
- Multi-locale support with tagging

## Key Features

- **Content Types**: Topics, Questions, Articles, FAQ Items
- **Security**: HMAC signature verification, timing-safe comparison, timestamp validation (±5 minutes)
- **Caching**: Next.js cache tags with on-demand revalidation
- **Validation**: Zod schemas for runtime type safety
- **Database**: PostgreSQL with Prisma ORM
- **Status Management**: DRAFT/PUBLISHED workflow

## API Endpoints

- `POST /api/ingest` - Ingest complete topic packages (protected)
- `GET /api/topics` - List topics with filtering/pagination (public)
- `GET /api/topics/[slug]` - Get topic details (public)
- `POST /api/revalidate` - Trigger cache invalidation (protected)

## Data Model

- **Topic**: Unique slug, title, locale, tags
- **Question**: Belongs to topic, has isPrimary flag
- **Article**: One-to-one with topic, has content and status
- **FAQItem**: Belongs to topic, has question/answer/order
- **IngestJob**: Audit log for ingestion operations
