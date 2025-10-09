# Q&A Article FAQ API

A secure, API-first backend for managing Q&A content, articles, and FAQs. Built with Next.js 14+ App Router, TypeScript, Prisma ORM, and PostgreSQL.

## Features

- 🔒 **Secure Webhook Ingestion**: HMAC-SHA256 signature verification for content updates
- 📚 **Content Management**: Topics, questions, articles, and FAQ items
- 🔍 **Public Read API**: Retrieve published content by slug or filtered listings
- ♻️ **Cache Revalidation**: On-demand cache invalidation via webhook
- ✅ **Type-Safe**: Full TypeScript support with Zod validation
- 🧪 **Tested**: Comprehensive test coverage with Vitest

## Table of Contents

- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [API Documentation](#api-documentation)
  - [POST /api/ingest](#post-apiingest)
  - [GET /api/topics](#get-apitopics)
  - [GET /api/topics/[slug]](#get-apitopicsslug)
  - [POST /api/revalidate](#post-apirevalidate)
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

## Documentation

Comprehensive documentation is available in the `docs/` directory:

### Setup Guides
- [Getting Started](docs/setup/getting-started.md) - Installation and first steps
- [Environment Configuration](docs/setup/environment-setup.md) - Environment variables explained
- [Database Setup](docs/setup/database-setup.md) - Database configuration and management
- [Docker Setup](docs/setup/docker-setup.md) - Docker deployment and testing

### Architecture
- [Architecture Overview](docs/architecture/README.md) - System design and components
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

### Authentication

Protected endpoints (`/api/ingest` and `/api/revalidate`) require three headers:

- `x-api-key`: Your static API key
- `x-timestamp`: Current Unix timestamp in milliseconds
- `x-signature`: HMAC-SHA256 signature

See [Authentication](#authentication) section for details on generating signatures.

---

### POST /api/ingest

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
- This endpoint is idempotent - sending the same payload multiple times produces the same result
- Existing FAQ items are replaced (not merged) on each ingest
- Topics are upserted by slug

---

### GET /api/topics

List topics with optional filtering and pagination.

**Authentication**: Not required (public endpoint)

**Query Parameters**:

- `locale` (string, optional): Filter by language code (e.g., "en")
- `tag` (string, optional): Filter by tag
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)

**Example Request**:

```
GET /api/topics?locale=en&tag=security&page=1&limit=10
```

**Success Response** (200):

```json
{
  "items": [
    {
      "id": "clx1234567890",
      "slug": "how-to-reset-password",
      "title": "How to Reset Your Password",
      "locale": "en",
      "tags": ["account", "security"],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

**Notes**:
- Only topics with at least one PUBLISHED article are included
- Results are paginated for performance

---

### GET /api/topics/[slug]

Retrieve a complete topic with its question, article, and FAQ items.

**Authentication**: Not required (public endpoint)

**Example Request**:

```
GET /api/topics/how-to-reset-password
```

**Success Response** (200):

```json
{
  "topic": {
    "id": "clx1234567890",
    "slug": "how-to-reset-password",
    "title": "How to Reset Your Password",
    "locale": "en",
    "tags": ["account", "security"],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "primaryQuestion": {
    "id": "clx2234567890",
    "text": "How do I reset my password?",
    "isPrimary": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "article": {
    "id": "clx3234567890",
    "content": "To reset your password, follow these steps...",
    "status": "PUBLISHED",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "faqItems": [
    {
      "id": "clx4234567890",
      "question": "What if I don't receive the reset email?",
      "answer": "Check your spam folder...",
      "order": 0,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Error Responses**:

- `404 Not Found`: Topic doesn't exist or has no published article
- `500 Internal Server Error`: Server error

**Notes**:
- Only returns topics with PUBLISHED articles
- FAQ items are sorted by the `order` field

---

### POST /api/revalidate

Trigger cache revalidation for a specific tag.

**Authentication**: Required

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
- Common tags: "topics", "topic:[slug]"

---

## Authentication

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

### Topic
- Unique slug identifier
- Title, locale, tags
- One-to-many: Questions, Articles, FAQ Items

### Question
- Belongs to Topic
- `isPrimary` flag for main question

### Article
- One-to-one with Topic
- Content and status (DRAFT/PUBLISHED)

### FAQItem
- Belongs to Topic
- Question, answer, and display order

### IngestJob
- Audit log for ingestion operations
- Stores payload and status (processing/completed/failed)

## License

[Your License Here]

## Support

For issues and questions, please open an issue on the repository.
