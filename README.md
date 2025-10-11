# Q&A Article FAQ API

A secure, full-stack content management system for managing Q&A content, articles, FAQs, and site-wide settings with both API-first ingestion and a comprehensive admin interface. Built with Next.js 14+ App Router, TypeScript, Prisma ORM, and PostgreSQL.

## Features

### Core Features
- 🔒 **Secure Webhook Ingestion**: HMAC-SHA256 signature verification for content updates
- 📚 **Content Management**: Topics, questions, articles, and FAQ items
- 🔍 **Public Read API**: Retrieve published content by slug or filtered listings
- ♻️ **Cache Revalidation**: On-demand cache invalidation via webhook
- ✅ **Type-Safe**: Full TypeScript support with Zod validation
- 🧪 **Tested**: Comprehensive test coverage with Vitest

### Admin CMS Features
- ⚙️ **Site Settings**: Manage logo, site name, SEO metadata, and branding
- 📄 **Custom Pages**: Create and manage pages (About, Contact, Privacy, etc.) with rich text editor
- 🧭 **Navigation Management**: Dynamic menu builder with nested items and drag-and-drop
- 🦶 **Footer Management**: Configurable footer columns and links
- 🖼️ **Media Library**: Upload, organize, and manage images and files
- 👥 **User Management**: Role-based access control (Admin, Editor, Viewer)
- 📊 **Audit Logging**: Track all admin actions with detailed logs
- 🗂️ **Bulk Operations**: Bulk delete, update, export/import for topics
- 💾 **Cache Management**: View cache stats and clear cache on-demand

## Table of Contents

- [Quick Start](#quick-start)
- [Admin Panel](#admin-panel)
- [Documentation](#documentation)
- [API Documentation](#api-documentation)
  - [Public API](#public-api)
  - [Webhook API](#webhook-api)
  - [Admin API](#admin-api)
- [Authentication](#authentication)
- [Project Structure](#project-structure)

## Quick Start

Get up and running in minutes:

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Set up database
npx prisma migrate dev

# Start development server
npm run dev
```

Visit `http://localhost:3000/api/topics` to verify the API is running.

For detailed setup instructions, see the [Getting Started Guide](docs/setup/getting-started.md).

## Admin Panel

Access the admin CMS at `http://localhost:3000/admin` to manage your content.

**Default Admin Credentials** (change after first login):
- Email: `admin@example.com`
- Password: `admin123`

**Admin Features:**
- Site settings and branding
- Custom page management with rich text editor
- Navigation menu builder
- Footer configuration
- Media library
- User management with roles
- Audit log viewer
- Cache management
- Bulk operations

For complete admin documentation, see the [Admin User Guide](docs/admin/admin-user-guide.md).

## Documentation

Comprehensive documentation is available in the `docs/` directory:

### Setup Guides
- [Getting Started](docs/setup/getting-started.md) - Installation and first steps
- [Environment Configuration](docs/setup/environment-setup.md) - Environment variables explained
- [Database Setup](docs/setup/database-setup.md) - Database configuration and management
- [Docker Setup](docs/setup/docker-setup.md) - Docker deployment and testing

### Admin Guides
- [Admin User Guide](docs/admin/admin-user-guide.md) - Complete admin CMS guide
- [Admin API Reference](docs/api/admin-api-reference.md) - Admin API endpoints

### Architecture
- [Architecture Overview](docs/architecture/README.md) - System design and components
- [Database Schema](docs/architecture/database-schema.md) - Complete database documentation
- [Caching Strategy](docs/architecture/caching-strategy.md) - Cache implementation details
- [Performance Optimization](docs/architecture/performance-optimization.md) - Performance features
- [Accessibility](docs/architecture/accessibility.md) - Accessibility implementation

### Testing
- [Testing Guide](docs/testing/README.md) - How to run and write tests
- [Unit Testing](docs/testing/unit-testing.md) - Unit test guidelines
- [E2E Testing](docs/testing/e2e-testing.md) - End-to-end test guide
- [Docker Testing](docs/testing/docker-testing.md) - Testing Docker deployments

### Reports
- [Test Reports](docs/reports/README.md) - Test execution reports and audits

## API Documentation

The system provides three types of APIs:

1. **Public API**: Read-only access to published content (no authentication)
2. **Webhook API**: Secure ingestion and revalidation (HMAC authentication)
3. **Admin API**: Full CMS management (session authentication)

For complete API documentation, see:
- [Admin API Reference](docs/api/admin-api-reference.md) - All admin endpoints

### Public API

#### GET /api/topics

List published topics with filtering and pagination.

**Query Parameters:**
- `locale` (string): Filter by language
- `tag` (string): Filter by tag
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)

#### GET /api/topics/[slug]

Get a complete topic with question, article, and FAQ items.

### Webhook API

Protected endpoints require HMAC-SHA256 signature verification.

**Authentication Headers:**

- `x-api-key`: Your static API key
- `x-timestamp`: Current Unix timestamp in milliseconds
- `x-signature`: HMAC-SHA256 signature

#### POST /api/ingest

Ingest a complete topic package with question, article, and FAQ items.

**Authentication**: Required

**Request Body**:

```json
{
  "topic": {
    "slug": "how-to-reset-password",
    "title": "How to Reset Your Password",
    "locale": "en",
    "tags": ["account", "security"]
  },
  "mainQuestion": {
    "text": "How do I reset my password?"
  },
  "article": {
    "content": "To reset your password, follow these steps...",
    "status": "PUBLISHED"
  },
  "faqItems": [
    {
      "question": "What if I don't receive the reset email?",
      "answer": "Check your spam folder...",
      "order": 0
    },
    {
      "question": "How long is the reset link valid?",
      "answer": "Reset links are valid for 24 hours.",
      "order": 1
    }
  ]
}
```

**Field Descriptions**:

- `topic.slug` (string, required): Unique identifier for the topic (used in URLs)
- `topic.title` (string, required): Display title
- `topic.locale` (string, required): Two-letter language code (e.g., "en", "es")
- `topic.tags` (array, optional): Tags for categorization
- `mainQuestion.text` (string, required): The primary question for this topic
- `article.content` (string, required): Full article content (supports markdown)
- `article.status` (enum, required): Either "DRAFT" or "PUBLISHED"
- `faqItems` (array, optional): Related FAQ items
- `faqItems[].question` (string, required): FAQ question
- `faqItems[].answer` (string, required): FAQ answer
- `faqItems[].order` (number, required): Display order (0-indexed)

**Success Response** (200):

```json
{
  "success": true,
  "topicId": "clx1234567890",
  "jobId": "clx0987654321"
}
```

**Error Responses**:

- `401 Unauthorized`: Invalid authentication
- `400 Bad Request`: Validation errors
- `500 Internal Server Error`: Server error

**Notes**:
- Idempotent operation
- Existing FAQ items are replaced (not merged)
- Topics are upserted by slug

#### POST /api/revalidate

Trigger cache revalidation for a specific tag.

**Request Body**:

```json
{
  "tag": "topics"
}
```

**Success Response** (200):

```json
{
  "message": "Revalidated successfully",
  "tag": "topics"
}
```

**Error Responses**:

- `401 Unauthorized`: Invalid authentication
- `400 Bad Request`: Missing or invalid tag
- `500 Internal Server Error`: Server error

**Notes**:
- Uses Next.js `revalidateTag()` for on-demand cache invalidation
- Common tags: "topics", "topic:[slug]", "pages", "menu", "footer", "settings"

### Admin API

Complete admin API documentation available at [Admin API Reference](docs/api/admin-api-reference.md).

**Key Endpoints:**
- `/api/admin/settings` - Site settings management
- `/api/admin/pages` - Custom page CRUD
- `/api/admin/menus` - Navigation menu management
- `/api/admin/footer` - Footer configuration
- `/api/admin/media` - Media library operations
- `/api/admin/users` - User management
- `/api/admin/audit-log` - Audit log access
- `/api/admin/cache` - Cache management
- `/api/admin/topics/bulk-*` - Bulk operations

**Authentication**: Session-based via NextAuth.js

**Authorization**: Role-based access control (Admin, Editor, Viewer)

---

## Authentication

### Webhook Authentication

Protected endpoints require HMAC-SHA256 signature verification to ensure request authenticity and integrity.

### Required Headers

1. **x-api-key**: Your static API key from `INGEST_API_KEY`
2. **x-timestamp**: Current Unix timestamp in milliseconds
3. **x-signature**: HMAC-SHA256 signature

### Generating the Signature

The signature is computed as:

```
HMAC-SHA256(INGEST_WEBHOOK_SECRET, timestamp + "." + rawBody)
```

### Example (Node.js)

```javascript
const crypto = require('crypto');

function generateSignature(timestamp, body, secret) {
  const payload = `${timestamp}.${JSON.stringify(body)}`;
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

// Usage
const timestamp = Date.now().toString();
const body = {
  topic: { slug: "example", title: "Example", locale: "en" },
  mainQuestion: { text: "What is this?" },
  article: { content: "Content here", status: "PUBLISHED" },
  faqItems: []
};

const signature = generateSignature(
  timestamp,
  body,
  process.env.INGEST_WEBHOOK_SECRET
);

// Make request
fetch('http://localhost:3000/api/ingest', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.INGEST_API_KEY,
    'x-timestamp': timestamp,
    'x-signature': signature
  },
  body: JSON.stringify(body)
});
```

### Example (Python)

```python
import hmac
import hashlib
import time
import json
import requests

def generate_signature(timestamp, body, secret):
    payload = f"{timestamp}.{json.dumps(body)}"
    signature = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return signature

# Usage
timestamp = str(int(time.time() * 1000))
body = {
    "topic": {"slug": "example", "title": "Example", "locale": "en"},
    "mainQuestion": {"text": "What is this?"},
    "article": {"content": "Content here", "status": "PUBLISHED"},
    "faqItems": []
}

signature = generate_signature(timestamp, body, INGEST_WEBHOOK_SECRET)

response = requests.post(
    'http://localhost:3000/api/ingest',
    headers={
        'Content-Type': 'application/json',
        'x-api-key': INGEST_API_KEY,
        'x-timestamp': timestamp,
        'x-signature': signature
    },
    json=body
)
```

### Example (cURL)

```bash
#!/bin/bash

API_KEY="your-api-key"
WEBHOOK_SECRET="your-webhook-secret"
TIMESTAMP=$(date +%s000)
BODY='{"topic":{"slug":"example","title":"Example","locale":"en"},"mainQuestion":{"text":"What?"},"article":{"content":"Content","status":"PUBLISHED"},"faqItems":[]}'

# Generate signature
PAYLOAD="${TIMESTAMP}.${BODY}"
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | sed 's/^.* //')

# Make request
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -H "x-timestamp: $TIMESTAMP" \
  -H "x-signature: $SIGNATURE" \
  -d "$BODY"
```

### Security Notes

- Timestamps must be within ±5 minutes of server time to prevent replay attacks
- Signatures use timing-safe comparison to prevent timing attacks
- Always use HTTPS in production
- Keep `INGEST_WEBHOOK_SECRET` confidential

### Admin Authentication

Admin endpoints use NextAuth.js session-based authentication:

1. Log in at `/admin` with your credentials
2. Session cookie is automatically included in requests
3. Role-based access control enforces permissions

**User Roles:**
- **Admin**: Full access to all features
- **Editor**: Content management only
- **Viewer**: Read-only access

See [Admin User Guide](docs/admin/admin-user-guide.md) for details.

## Deployment

Ready to deploy? Follow these guides:

- [Quick Deployment Guide](DEPLOYMENT.md) - Quick reference for deployment
- [Complete Migration Guide](docs/setup/migration-guide.md) - Detailed migration instructions
- [Deployment Checklist](docs/setup/deployment-checklist.md) - Pre-deployment checklist
- [Environment Variables](docs/setup/environment-variables.md) - Complete environment reference

**Quick Verification:**
```bash
npm run verify:all  # Verify all features before deployment
```

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

For detailed testing documentation, see:
- [Testing Guide](docs/testing/README.md) - Complete testing documentation
- [API Testing Examples](test-requests/README.md) - curl and script examples

## Project Structure

The project follows a clean, organized structure with clear separation of concerns:

```
/
├── docs/                          # 📚 All project documentation
│   ├── setup/                     # Setup and installation guides
│   ├── architecture/              # System design and architecture docs
│   ├── testing/                   # Testing guides and procedures
│   └── reports/                   # Test reports and audit results
│
├── scripts/                       # 🔧 Utility scripts
│   ├── test/                      # Test execution scripts
│   ├── verify/                    # Verification scripts
│   └── performance/               # Performance testing scripts
│
├── tests/                         # 🧪 Test code
│   ├── unit/                      # Unit tests
│   │   ├── api/                   # API logic unit tests
│   │   └── lib/                   # Library unit tests
│   ├── integration/               # Integration tests
│   ├── e2e/                       # End-to-end tests
│   └── utils/                     # Test utilities
│
├── src/                           # 💻 Application source code
│   ├── app/
│   │   └── api/
│   │       ├── ingest/
│   │       │   └── route.ts       # POST /api/ingest
│   │       ├── topics/
│   │       │   ├── route.ts       # GET /api/topics
│   │       │   └── [slug]/
│   │       │       └── route.ts   # GET /api/topics/[slug]
│   │       └── revalidate/
│   │           └── route.ts       # POST /api/revalidate
│   ├── lib/
│   │   ├── security/
│   │   │   ├── hmac.ts            # HMAC signature verification
│   │   │   └── timing.ts          # Timing-safe comparison
│   │   ├── validation/
│   │   │   └── schemas.ts         # Zod schemas
│   │   ├── services/
│   │   │   └── content.service.ts # Business logic
│   │   ├── repositories/
│   │   │   └── content.repository.ts # Data access
│   │   └── db.ts                  # Prisma client singleton
│   └── types/
│       └── api.ts                 # TypeScript types
│
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── migrations/                # Migration files
│
├── test-requests/                 # API testing examples
├── .env.example                   # Environment template
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### Folder Organization Conventions

- **docs/**: All documentation is organized by purpose (setup, architecture, testing, reports)
- **scripts/**: Utility scripts are categorized by function (test, verify, performance)
- **tests/**: Test code is separated by type (unit, integration, e2e)
- **src/**: Application code follows Next.js App Router conventions

For detailed information about the folder structure and where to place new files, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Data Models

### Core Content Models

- **Topic**: Q&A topics with slug, title, locale, tags
- **Question**: Questions associated with topics (isPrimary flag)
- **Article**: Article content with DRAFT/PUBLISHED status
- **FAQItem**: FAQ items with question, answer, and order
- **IngestJob**: Audit log for webhook ingestion

### CMS Models

- **SiteSettings**: Global site configuration (logo, SEO, branding)
- **Page**: Custom pages with rich content and SEO metadata
- **MenuItem**: Hierarchical navigation menu structure
- **FooterColumn/FooterLink**: Configurable footer
- **Media**: File uploads with metadata and thumbnails
- **User**: Admin users with role-based permissions
- **AuditLog**: Activity tracking and audit trail

For complete schema documentation, see [Database Schema](docs/architecture/database-schema.md).

## License

[Your License Here]

## Support

For issues and questions, please open an issue on the repository.
