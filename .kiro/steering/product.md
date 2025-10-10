# Product Overview

Q&A Article FAQ API is a secure, full-stack content management system for managing Q&A content, articles, FAQs, and site-wide settings with both API-first ingestion and a comprehensive admin interface.

## Core Purpose

Provides a dual-interface content management system with:
- **API Interface**: Secure webhook ingestion with HMAC-SHA256 signature verification
- **Admin Interface**: Full-featured CMS for managing content, settings, and site structure
- **Public Interface**: Read API and frontend for retrieving published content
- On-demand cache revalidation
- Multi-locale support with tagging

## Key Features

### Content Management
- **Content Types**: Topics, Questions, Articles, FAQ Items, Custom Pages
- **Rich Text Editing**: TipTap editor for article and page content
- **Status Management**: DRAFT/PUBLISHED workflow
- **Bulk Operations**: Bulk delete, update, export/import for topics

### Admin CMS Features
- **Site Settings**: Logo, site name, SEO metadata, branding customization
- **Custom Pages**: Create and manage pages (About, Contact, Privacy, etc.)
- **Navigation Management**: Dynamic menu builder with nested items
- **Footer Management**: Configurable footer columns and links
- **Media Library**: Upload, organize, and manage images and files
- **User Management**: Role-based access control (Admin, Editor, Viewer)
- **Audit Logging**: Track all admin actions with detailed logs
- **Cache Management**: View cache stats and clear cache on-demand

### Security
- **Authentication**: NextAuth.js with role-based access control
- **API Security**: HMAC signature verification, timing-safe comparison, timestamp validation (±5 minutes)
- **Input Validation**: Zod schemas for runtime type safety
- **Content Security**: HTML sanitization, file upload validation

### Performance
- **Caching**: Next.js cache tags with on-demand revalidation
- **Database**: PostgreSQL with Prisma ORM and optimized indexes
- **Image Optimization**: Automatic thumbnail generation and compression

## API Endpoints

### Public API
- `GET /api/topics` - List topics with filtering/pagination
- `GET /api/topics/[slug]` - Get topic details
- `GET /pages/[slug]` - View custom pages

### Protected API (Webhook)
- `POST /api/ingest` - Ingest complete topic packages
- `POST /api/revalidate` - Trigger cache invalidation

### Admin API
- `/api/admin/settings` - Site settings management
- `/api/admin/pages` - Custom page CRUD
- `/api/admin/menus` - Navigation menu management
- `/api/admin/footer` - Footer configuration
- `/api/admin/media` - Media library operations
- `/api/admin/users` - User management
- `/api/admin/audit-log` - Audit log access
- `/api/admin/cache` - Cache management
- `/api/admin/topics/bulk-*` - Bulk operations

## Data Model

### Core Content
- **Topic**: Unique slug, title, locale, tags
- **Question**: Belongs to topic, has isPrimary flag
- **Article**: One-to-one with topic, has content and status
- **FAQItem**: Belongs to topic, has question/answer/order

### CMS Features
- **Page**: Custom pages with rich content and SEO
- **MenuItem**: Hierarchical navigation structure
- **FooterColumn/FooterLink**: Configurable footer
- **Media**: File uploads with metadata
- **User**: Admin users with role-based permissions
- **SiteSettings**: Global site configuration
- **AuditLog**: Activity tracking and audit trail
- **IngestJob**: Webhook ingestion audit log

## User Roles

- **Admin**: Full access to all features including settings and user management
- **Editor**: Content management access (topics, pages, media) but no settings/user changes
- **Viewer**: Read-only access to admin interface
