# Testing Documentation

Comprehensive testing guides for the Q&A Article FAQ API, covering unit tests, integration tests, E2E tests, and manual testing procedures.

## Quick Start

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Testing Guides

### Automated Testing

- **[Unit Testing](./unit-testing.md)**
  - Writing unit tests with Vitest
  - Testing services and repositories
  - Mocking dependencies
  - Test coverage guidelines

- **[E2E Testing](./e2e-testing.md)**
  - End-to-end test setup
  - Testing complete user flows
  - Admin dashboard tests
  - Public pages tests

- **[Docker Testing](./docker-testing.md)**
  - Testing in Docker containers
  - Docker Compose test setup
  - Container integration tests
  - CI/CD Docker testing

### Manual Testing

- **[Manual Testing](./manual-testing.md)**
  - Manual test procedures
  - API testing with curl/Postman
  - Homepage testing checklist
  - CMS functionality verification

## Test Categories

### Security Tests
- HMAC signature verification
- API key authentication
- Timestamp validation
- Replay attack prevention

### Validation Tests
- Zod schema validation
- Request payload validation
- Malformed data handling
- Edge case validation

### Business Logic Tests
- Topic ingestion and retrieval
- FAQ item management
- Article publishing workflow
- Cache revalidation

### Integration Tests
- Complete ingestion flow
- Database operations
- Cache invalidation
- API endpoint integration

### Performance Tests
- Response time benchmarks
- Database query performance
- Cache hit rates
- Load testing

## Test Structure

```
tests/
├── unit/              # Unit tests
│   ├── api/          # API logic tests
│   └── lib/          # Library/utility tests
├── integration/       # Integration tests
│   └── api/          # API integration tests
├── e2e/              # End-to-end tests
│   ├── admin-dashboard.test.ts
│   └── public-pages.test.ts
└── utils/            # Test utilities and helpers
```

## Writing Tests

### Test Naming Convention

```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do something when condition', () => {
      // Test implementation
    });
  });
});
```

### Test Organization

1. **Arrange**: Set up test data and mocks
2. **Act**: Execute the code being tested
3. **Assert**: Verify the expected outcome

### Example Test

```typescript
import { describe, it, expect } from 'vitest';
import { validateIngestPayload } from '@/lib/validation/schemas';

describe('validateIngestPayload', () => {
  it('should validate a correct payload', () => {
    const payload = {
      topic: { slug: 'test', title: 'Test', locale: 'en' },
      mainQuestion: { text: 'Question?' },
      article: { content: 'Content', status: 'PUBLISHED' },
      faqItems: []
    };
    
    const result = validateIngestPayload(payload);
    expect(result.success).toBe(true);
  });
});
```

## Running Specific Tests

Run tests for a specific file:
```bash
npm test -- tests/unit/api/ingest.test.ts
```

Run tests matching a pattern:
```bash
npm test -- --grep "authentication"
```

Run tests in a specific directory:
```bash
npm test -- tests/unit/
```

## Test Coverage

View coverage report:
```bash
npm run test:coverage
```

Coverage goals:
- **Overall**: > 80%
- **Critical paths**: > 90%
- **Security code**: 100%

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Pre-deployment checks

CI configuration:
- All tests must pass
- Coverage thresholds must be met
- No linting errors

## Troubleshooting Tests

### Database Connection Issues

If tests fail with database errors:
1. Ensure `TEST_DATABASE_URL` is set in `.env`
2. Run migrations on test database
3. Check PostgreSQL is running

### Flaky Tests

If tests pass/fail inconsistently:
1. Check for race conditions
2. Ensure proper test isolation
3. Use proper async/await patterns
4. Clear database between tests

### Slow Tests

If tests run slowly:
1. Use test database instead of production
2. Mock external dependencies
3. Parallelize test execution
4. Optimize database queries

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Clear Names**: Test names should describe what they test
3. **One Assertion**: Focus on one thing per test
4. **Fast Tests**: Keep unit tests fast (< 100ms)
5. **Mock External**: Mock external services and APIs
6. **Clean Up**: Reset state after each test

## Related Documentation

- [Unit Testing Guide](./unit-testing.md) - Detailed unit testing guide
- [E2E Testing Guide](./e2e-testing.md) - End-to-end testing guide
- [Docker Testing Guide](./docker-testing.md) - Docker testing procedures
- [Manual Testing Guide](./manual-testing.md) - Manual test procedures
- [Test Reports](../reports/) - Test results and reports

## Contributing

When adding new tests:
1. Follow the existing test structure
2. Use descriptive test names
3. Add tests for new features
4. Maintain test coverage
5. Document complex test scenarios
