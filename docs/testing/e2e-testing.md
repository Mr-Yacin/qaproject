# End-to-End Testing Guide

## Overview

This guide covers end-to-end testing for both public-facing pages and the admin dashboard. E2E tests validate complete user workflows and ensure all components work together correctly.

## Test Framework

- **Framework**: Vitest
- **Test Type**: Server-side fetch-based + Database operations
- **Database**: PostgreSQL with Prisma ORM
- **Application**: Next.js 14+ App Router with NextAuth.js
- **Base URL**: http://localhost:3000

## Running E2E Tests

```bash
# Run all E2E tests
npm test tests/e2e/ -- --run

# Run specific test suite
npm test tests/e2e/public-pages.test.ts -- --run
npm test tests/e2e/admin-dashboard.test.ts -- --run
```

## Public Pages Testing

### Test Coverage

#### 1. Homepage Tests
- Homepage loads successfully with 200 status
- Featured topics are displayed
- Search functionality is present
- Responsive viewport meta tag is included

#### 2. Topics Listing Page
- Topics listing page loads successfully
- Published topics are displayed
- Tag filtering is supported
- Locale filtering is supported

#### 3. Topic Detail Page
- Valid topics display correctly
- Returns 404 for non-existent topics
- Title and main question are displayed
- Article content is rendered
- FAQ items are shown

#### 4. SEO Meta Tags
- Title tag is present
- Meta description is present
- Open Graph tags are included
- Twitter Card tags are included
- Canonical URL is set

#### 5. Structured Data
- Article schema JSON-LD is present
- FAQ schema JSON-LD is included
- JSON-LD structure is valid

#### 6. Search Functionality
- Search page loads successfully
- Empty search query is handled
- Search results display correctly
- No results message appears when appropriate

#### 7. Sitemap and Robots
- Sitemap.xml is served correctly
- Sitemap includes URL structure
- Robots.txt is served correctly
- Robots.txt includes proper directives

#### 8. Responsive Design
- Responsive viewport meta tag is present
- CSS is loaded correctly
- Mobile-friendly layout

#### 9. Navigation and Accessibility
- Header navigation is present
- Footer is included
- Semantic HTML is used
- ARIA labels are present

### Test Results Summary

| Category | Tests | Status |
|----------|-------|--------|
| Homepage | 4 | ✅ PASSED |
| Topics Listing | 4 | ✅ PASSED |
| Topic Detail | 5 | ⚠️ PARTIAL |
| SEO Meta Tags | 5 | ⚠️ PARTIAL |
| Structured Data | 3 | ⚠️ PARTIAL |
| Search | 4 | ✅ PASSED |
| Sitemap/Robots | 4 | ✅ PASSED |
| Responsive Design | 2 | ✅ PASSED |
| Navigation/A11y | 4 | ⚠️ PARTIAL |

### Key Findings

**Positive Findings:**
- ✅ Core infrastructure is working (sitemap, robots.txt, basic pages load)
- ✅ Responsive design meta tags are properly configured
- ✅ Search functionality page structure is in place
- ✅ 404 handling works correctly
- ✅ Topics listing and filtering functionality works

**Issues Identified:**
- ⚠️ Test data persistence issue - topics created in beforeAll are not accessible
- ⚠️ Client-side rendered components (search) show loading states in SSR tests
- ⚠️ SEO tags and structured data only appear on valid topic pages (not 404s)

## Admin Dashboard Testing

### Test Coverage

#### 1. Login Flow Tests
- Login page loads successfully
- Login form fields are visible
- Admin routes redirect unauthenticated users
- Invalid credentials are handled
- Valid credentials authenticate successfully

#### 2. Topic Creation Tests
- New topic creation page loads
- API topic creation works
- Field validation is enforced
- Slug auto-generation functions

#### 3. Topic Editing Tests
- Edit page loads correctly
- API topic update works
- Topic ID is preserved

#### 4. Topic Deletion Tests
- Topic and related data deletion works
- Confirmation dialog appears

#### 5. FAQ Management Tests
- Multiple FAQ creation works
- FAQ order is maintained
- FAQ updates function correctly

#### 6. Cache Revalidation Tests
- General cache revalidation works
- Specific topic cache revalidation works
- Invalid signature is rejected

#### 7. Admin Dashboard UI Tests
- Dashboard home loads
- Topic statistics display
- Topics management list works
- Search and filter functionality

### Test Results Summary

| Category | Tests | Status |
|----------|-------|--------|
| Login Flow | 5 | ⚠️ PARTIAL |
| Topic Creation | 4 | ⚠️ PARTIAL |
| Topic Editing | 3 | ⚠️ PARTIAL |
| Topic Deletion | 2 | ✅ PASSED |
| FAQ Management | 3 | ⚠️ PARTIAL |
| Cache Revalidation | 3 | ⚠️ PARTIAL |
| Dashboard UI | 4 | ✅ PASSED |

### Key Findings

**Positive Findings:**
- ✅ Authentication is properly enforced on all API endpoints
- ✅ HMAC signature validation works correctly
- ✅ Database operations (deletion) work properly with cascading
- ✅ Login page loads and renders correctly
- ✅ Admin layout and sidebar render properly

**Issues Identified:**
- ⚠️ API endpoints require authentication - tests need valid credentials
- ⚠️ Client-side rendered components show loading states in SSR tests
- ⚠️ Admin routes don't redirect unauthenticated users (middleware issue)
- ⚠️ Environment variables for API keys may not be set in test environment

### Security Validation

- ✅ `/api/ingest` correctly returns 401 without valid authentication
- ✅ `/api/revalidate` correctly returns 401 without valid signature
- ✅ HMAC signature validation prevents unauthorized access
- ✅ Invalid signatures are properly rejected

## Test Environment Setup

### Required Environment Variables

```bash
# Required environment variables for testing
INGEST_API_KEY=test-api-key
INGEST_WEBHOOK_SECRET=test-webhook-secret
NEXTAUTH_SECRET=test-nextauth-secret
ADMIN_EMAIL=admin@test.com
ADMIN_PASSWORD=test-password
```

## Recommendations

### Immediate Actions

1. **Configure Test Authentication**: Set up test API keys and webhook secrets in environment
2. **Add Browser Automation**: Use Playwright or Cypress for full UI testing
3. **Fix Middleware**: Ensure admin routes redirect unauthenticated users
4. **Mock Authentication**: Create test utilities for authenticated API calls

### Future Enhancements

1. **Integration Tests with Auth**: Create authenticated test sessions
2. **UI Component Tests**: Test forms, buttons, and interactions
3. **E2E Browser Tests**: Full user journey testing with Playwright
4. **API Mock Server**: Mock external dependencies for isolated testing
5. **Visual Regression**: Add screenshot comparison tests
6. **Performance Testing**: Add Lighthouse CI integration
7. **Accessibility Audit**: Run axe-core automated accessibility tests

## Writing E2E Tests

### Example Test Structure

```typescript
import { describe, test, expect, beforeAll } from 'vitest';
import { seedTopic } from '../utils/test-helpers';

describe('Topic Detail Page E2E', () => {
  let testTopic;

  beforeAll(async () => {
    testTopic = await seedTopic({
      slug: 'test-topic',
      title: 'Test Topic',
      locale: 'en'
    });
  });

  test('displays topic details correctly', async () => {
    const response = await fetch(`http://localhost:3000/topics/${testTopic.slug}`);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain(testTopic.title);
  });
});
```

## Troubleshooting

### Test Data Not Persisting

If topics created in `beforeAll` are not accessible:
1. Verify database connection
2. Check that transactions are committed
3. Ensure cleanup isn't running too early

### Client-Side Components Show Loading

Client-side rendered components with Suspense will show loading states in SSR tests. Consider:
1. Using browser automation (Playwright/Cypress)
2. Mocking client components for unit tests
3. Testing with running application server

### Authentication Failures

If API tests fail with 401:
1. Verify environment variables are set
2. Check HMAC signature generation
3. Ensure API keys match between test and application

## Related Documentation

- [Unit Testing Guide](./unit-testing.md)
- [Docker Testing Guide](./docker-testing.md)
- [Manual Testing Guide](./manual-testing.md)
