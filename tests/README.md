# Test Code Documentation

## Overview

This directory contains all test code for the project. For comprehensive testing guides, setup instructions, and best practices, see the [Testing Documentation](../docs/testing/).

## Test Structure

```
tests/
├── setup.ts                    # Global test setup (runs before all tests)
├── utils/
│   ├── test-helpers.ts         # Test utility functions
│   └── test-helpers.test.ts    # Tests for test utilities
├── unit/                       # Unit tests
│   ├── api/                    # API logic unit tests
│   └── lib/                    # Library unit tests
├── integration/                # Integration tests
│   └── api/                    # API integration tests
└── e2e/                        # End-to-end tests
    ├── admin-dashboard.test.ts # Admin dashboard E2E tests
    └── public-pages.test.ts    # Public pages E2E tests
```

## Quick Start

```bash
# Run all tests
npm test

# Run tests once without watch mode
npm test -- --run

# Run specific test file
npm test tests/unit/api/topics.test.ts

# Run tests with coverage
npm test -- --coverage
```

## Test Utilities API

### Database Helpers

#### `cleanDatabase()`
Removes all data from the test database. Automatically called before each test.

```typescript
await cleanDatabase();
```

#### `seedTopic(data)`
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

#### `seedTopics(count | dataArray)`
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

### Authentication Helpers

#### `generateTestSignature(timestamp, body)`
Generates a valid HMAC-SHA256 signature for authenticated requests.

```typescript
const timestamp = Date.now().toString();
const body = JSON.stringify({ test: 'data' });
const signature = generateTestSignature(timestamp, body);
```

#### `authenticatedRequest(url, payload, method)`
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

## Writing Tests

### Basic Test Structure

```typescript
import { describe, test, expect } from 'vitest';
import { seedTopic, authenticatedRequest } from '../utils/test-helpers';

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

### Test Isolation

Each test is automatically isolated through the `cleanDatabase()` function that runs before each test via `tests/setup.ts`. This ensures:
- No test pollution between tests
- Predictable test state
- Reliable test results

## Testing Guides

For detailed information about testing, see:

- **[Unit Testing Guide](../docs/testing/unit-testing.md)** - Setup, configuration, and unit testing best practices
- **[E2E Testing Guide](../docs/testing/e2e-testing.md)** - End-to-end testing for public pages and admin dashboard
- **[Docker Testing Guide](../docs/testing/docker-testing.md)** - Testing in Docker containers
- **[Manual Testing Guide](../docs/testing/manual-testing.md)** - Manual testing procedures and checklists

## Configuration

See the [Unit Testing Guide](../docs/testing/unit-testing.md#configuration) for:
- Environment variable setup
- Database configuration
- Test database setup

## Troubleshooting

See the [Unit Testing Guide](../docs/testing/unit-testing.md#troubleshooting) for:
- Database connection errors
- Migration errors
- Test isolation issues
