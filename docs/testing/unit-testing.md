# Unit Testing Guide

## Overview

This project uses Vitest for unit testing with a PostgreSQL database. The test utilities provide helpers for database seeding, cleanup, and authenticated API requests.

## Prerequisites

1. **PostgreSQL Database**: Ensure PostgreSQL is running and accessible
2. **Environment Variables**: Configure test database connection

## Configuration

### Environment Variables

Create a `.env` file (or use `.env.example` as a template) with the following variables:

```bash
# Main database
DATABASE_URL="postgresql://user:password@localhost:5432/qa_article_faq?schema=public"

# Test database (optional - uses DATABASE_URL if not set)
TEST_DATABASE_URL="postgresql://user:password@localhost:5432/qa_article_faq_test?schema=public"

# Security credentials for testing
INGEST_API_KEY="test-api-key"
INGEST_WEBHOOK_SECRET="test-webhook-secret"
```

### Database Setup

1. Create the test database:
```bash
createdb qa_article_faq_test
```

2. Run migrations on the test database:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/qa_article_faq_test?schema=public" npx prisma migrate deploy
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in a specific file
npm test tests/unit/api/topics.test.ts

# Run tests with coverage
npm test -- --coverage

# Run tests once without watch mode
npm test -- --run
```

## Test Utilities

### `generateTestSignature(timestamp, body)`

Generates a valid HMAC-SHA256 signature for authenticated requests.

```typescript
const timestamp = Date.now().toString();
const body = JSON.stringify({ test: 'data' });
const signature = generateTestSignature(timestamp, body);
```

### `authenticatedRequest(url, payload, method)`

Makes an authenticated API request with proper HMAC headers.

```typescript
const response = await authenticatedRequest('/api/ingest', {
  topic: { slug: 'test', title: 'Test', locale: 'en', tags: [] },
  mainQuestion: { text: 'What is this?' },
  article: { content: 'Content', status: 'PUBLISHED' },
  faqItems: []
});

console.log(response.status); // 200
console.log(response.body);   // Response data
```

### `seedTopic(data)`

Seeds a single topic with optional related entities.

```typescript
const topic = await seedTopic({
  slug: 'test-topic',
  title: 'Test Topic',
  locale: 'en',
  tags: ['test'],
  articleStatus: ContentStatus.PUBLISHED,
  articleContent: 'Article content',
  primaryQuestion: 'What is this?',
  faqItems: [
    { question: 'Q1', answer: 'A1', order: 0 },
    { question: 'Q2', answer: 'A2', order: 1 }
  ]
});
```

### `seedTopics(count | dataArray)`

Seeds multiple topics at once.

```typescript
// Create 5 topics with default data
const topics = await seedTopics(5);

// Create topics with custom data
const topics = await seedTopics([
  { slug: 'topic-1', locale: 'en' },
  { slug: 'topic-2', locale: 'es' }
]);
```

### `cleanDatabase()`

Removes all data from the test database. This is automatically called before each test via the setup file.

```typescript
await cleanDatabase();
```

## Writing Tests

Example test structure:

```typescript
import { describe, test, expect } from 'vitest';
import { seedTopic, authenticatedRequest } from '../../utils/test-helpers';

describe('POST /api/ingest', () => {
  test('successfully ingests content', async () => {
    const payload = {
      topic: { slug: 'test', title: 'Test', locale: 'en', tags: [] },
      mainQuestion: { text: 'What is this?' },
      article: { content: 'Content', status: 'PUBLISHED' },
      faqItems: []
    };

    const response = await authenticatedRequest(
      'http://localhost:3000/api/ingest',
      payload
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

## Test Structure

```
tests/
├── setup.ts                    # Global test setup (runs before all tests)
├── utils/
│   ├── test-helpers.ts         # Test utility functions
│   └── test-helpers.test.ts    # Tests for test utilities
├── unit/
│   ├── api/                    # API logic unit tests
│   └── lib/                    # Library unit tests
└── integration/
    └── api/                    # API integration tests
```

## Troubleshooting

### Database Connection Errors

If you see "Can't reach database server" errors:

1. Ensure PostgreSQL is running
2. Verify DATABASE_URL or TEST_DATABASE_URL is correct
3. Check that the database exists
4. Verify user credentials and permissions

### Migration Errors

If schema is out of sync:

```bash
# Reset test database
DATABASE_URL="your-test-db-url" npx prisma migrate reset

# Or deploy migrations
DATABASE_URL="your-test-db-url" npx prisma migrate deploy
```

### Test Isolation Issues

Each test should be isolated. The `cleanDatabase()` function runs before each test automatically via `tests/setup.ts`. If you're experiencing test pollution:

1. Check that `beforeEach` hook is running
2. Verify no tests are skipping cleanup
3. Ensure transactions are properly committed/rolled back

## Best Practices

1. **Keep tests focused**: Each test should verify one specific behavior
2. **Use descriptive names**: Test names should clearly describe what they're testing
3. **Clean up after tests**: Use `cleanDatabase()` to ensure test isolation
4. **Mock external dependencies**: Don't make real API calls to external services
5. **Test edge cases**: Include tests for error conditions and boundary cases
6. **Use test utilities**: Leverage helper functions for common operations

## Related Documentation

- [E2E Testing Guide](./e2e-testing.md)
- [Docker Testing Guide](./docker-testing.md)
- [Manual Testing Guide](./manual-testing.md)
