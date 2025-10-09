# Design Document

## Overview

This design document outlines the technical approach to fix critical bugs in the CMS application. The fixes address authentication middleware issues, frontend page errors, and the creation of test data for comprehensive testing.

## Architecture

### System Components Affected

1. **Middleware Layer** (`middleware.ts`)
   - NextAuth authentication middleware
   - Route protection logic
   - Session validation

2. **Frontend Pages**
   - Topics listing page (`src/app/(public)/topics/page.tsx`)
   - Search page (`src/app/(public)/search/page.tsx`)
   - SearchResults component (`src/app/(public)/search/SearchResults.tsx`)

3. **Database Layer**
   - Prisma ORM queries
   - Data seeding utilities

4. **API Layer**
   - Topics API (`src/lib/api/topics.ts`)
   - Error handling and logging

## Components and Interfaces

### 1. Admin Middleware Fix

#### Problem Analysis
The current middleware uses `withAuth` from NextAuth but may not be properly configured for production/Docker environments. The test reports show that unauthenticated users can access admin routes in Docker.

#### Root Causes
1. **Middleware execution order**: NextAuth middleware may not execute before route handlers in standalone builds
2. **Session validation**: Token validation might fail silently
3. **Environment variables**: NEXTAUTH_SECRET or NEXTAUTH_URL might not be properly set in Docker
4. **Matcher configuration**: Route matcher might not catch all admin routes

#### Solution Design

**Approach 1: Enhanced Middleware with Explicit Checks**
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if accessing admin routes
  if (pathname.startsWith('/admin')) {
    // Skip login page
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }
    
    // Validate session token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    // Redirect if no valid token
    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

**Approach 2: Server-Side Session Checks**
Add explicit session checks in admin layout:
```typescript
// src/app/admin/layout.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/admin/login');
  }
  
  return (
    <SessionProvider session={session}>
      {/* ... */}
    </SessionProvider>
  );
}
```

**Recommended Solution**: Implement both approaches for defense-in-depth
- Middleware provides first line of defense
- Server-side checks provide backup validation
- Logging added for debugging

### 2. Topics Listing Page Fix

#### Problem Analysis
The topics page returns 500 errors, likely due to:
1. Database query failures
2. Missing or malformed data
3. Unhandled exceptions in data fetching
4. Prisma relation loading issues

#### Root Causes
1. **Missing error boundaries**: No try-catch around async operations
2. **Database queries**: May be fetching too much data or missing includes
3. **Empty database**: No test data causes unexpected behavior
4. **Type mismatches**: Data structure doesn't match TypeScript types

#### Solution Design

**Error Handling Wrapper**
```typescript
// src/app/(public)/topics/page.tsx
export default async function TopicsPage({ searchParams }: TopicsPageProps) {
  try {
    const currentPage = parseInt(searchParams.page || '1', 10);
    const locale = searchParams.locale;
    const tag = searchParams.tag;
    
    // Fetch topics with error handling
    const topicsData = await getTopics({
      page: currentPage,
      limit: 12,
      locale,
      tag,
    }).catch((error) => {
      console.error('Failed to fetch topics:', error);
      return { items: [], total: 0, totalPages: 0, page: 1, limit: 12 };
    });

    // Fetch filter data with fallback
    const allTopicsData = await getTopics({ limit: 1000 }).catch(() => ({
      items: [],
      total: 0,
      totalPages: 0,
      page: 1,
      limit: 1000,
    }));
    
    // ... rest of component
  } catch (error) {
    console.error('Topics page error:', error);
    return <ErrorPage error={error} />;
  }
}
```

**API Client Enhancement**
```typescript
// src/lib/api/topics.ts
export async function getTopics(params: GetTopicsParams = {}): Promise<TopicsResponse> {
  try {
    const queryParams = new URLSearchParams();
    // ... build query params
    
    const response = await fetch(`${getBaseUrl()}/api/topics?${queryParams}`, {
      next: { revalidate: 60 },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Topics API error:', response.status, errorText);
      throw new Error(`Failed to fetch topics: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('getTopics error:', error);
    throw error;
  }
}
```

**Database Query Optimization**
```typescript
// src/app/api/topics/route.ts
// Ensure all relations are properly included
const topics = await prisma.topic.findMany({
  where: whereClause,
  include: {
    primaryQuestion: true,
    article: {
      select: {
        id: true,
        content: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    },
    faqItems: {
      orderBy: { order: 'asc' },
      select: {
        id: true,
        question: true,
        answer: true,
        order: true,
      },
    },
  },
  orderBy: { createdAt: 'desc' },
  skip,
  take: limit,
});
```

### 3. Search Page Fix

#### Problem Analysis
The search page may have similar issues to the topics page, plus:
1. Client-side data fetching errors
2. State management issues
3. Search query parsing problems

#### Solution Design

**Enhanced Error Handling**
```typescript
// src/app/(public)/search/SearchResults.tsx
export default function SearchResults() {
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchTopics() {
      try {
        setLoading(true);
        setError(null);
        
        const data = await getTopics({ limit: 1000 });
        setAllTopics(data.items);
        
        if (initialQuery) {
          filterTopics(data.items, initialQuery);
        } else {
          setFilteredTopics(data.items);
        }
      } catch (err) {
        console.error('Search fetch error:', err);
        setError(
          err instanceof Error 
            ? err.message 
            : 'Failed to fetch topics. Please try again later.'
        );
        setAllTopics([]);
        setFilteredTopics([]);
      } finally {
        setLoading(false);
      }
    }

    fetchTopics();
  }, [initialQuery]);
  
  // ... rest of component
}
```

**Graceful Degradation**
- Show error message if fetch fails
- Allow retry mechanism
- Cache previous results if available
- Provide fallback UI

### 4. Test Data Seeder

#### Design

**Seed Script Structure**
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

interface SeedOptions {
  clear?: boolean;
  count?: number;
}

async function seed(options: SeedOptions = {}) {
  const { clear = false, count = 20 } = options;
  
  console.log('🌱 Starting database seed...');
  
  // Clear existing data if requested
  if (clear) {
    console.log('🗑️  Clearing existing data...');
    await prisma.fAQItem.deleteMany();
    await prisma.article.deleteMany();
    await prisma.question.deleteMany();
    await prisma.topic.deleteMany();
    console.log('✅ Data cleared');
  }
  
  // Create topics
  console.log(`📝 Creating ${count} topics...`);
  
  for (let i = 0; i < count; i++) {
    await createTopic(i);
  }
  
  console.log('✅ Seed completed successfully');
}

async function createTopic(index: number) {
  const title = faker.lorem.sentence({ min: 3, max: 6 });
  const slug = faker.helpers.slugify(title).toLowerCase() + `-${index}`;
  const locale = faker.helpers.arrayElement(['en', 'es', 'fr']);
  const tags = faker.helpers.arrayElements(
    ['technology', 'business', 'health', 'education', 'finance', 'lifestyle'],
    { min: 2, max: 4 }
  );
  const status = faker.helpers.arrayElement(['PUBLISHED', 'DRAFT']);
  
  const topic = await prisma.topic.create({
    data: {
      slug,
      title,
      locale,
      tags,
      primaryQuestion: {
        create: {
          text: faker.lorem.sentence() + '?',
        },
      },
      article: {
        create: {
          content: faker.lorem.paragraphs(3, '\n\n'),
          status,
        },
      },
      faqItems: {
        create: Array.from({ length: faker.number.int({ min: 3, max: 6 }) }, (_, i) => ({
          question: faker.lorem.sentence() + '?',
          answer: faker.lorem.paragraph(),
          order: i + 1,
        })),
      },
    },
  });
  
  return topic;
}

seed({ clear: true, count: 20 })
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**CLI Interface**
```bash
# Clear and seed with 20 topics
npm run seed

# Seed without clearing
npm run seed:append

# Seed with custom count
npm run seed -- --count=50
```

**Package.json Scripts**
```json
{
  "scripts": {
    "seed": "tsx prisma/seed.ts",
    "seed:append": "tsx prisma/seed.ts --no-clear",
    "seed:large": "tsx prisma/seed.ts --count=100"
  }
}
```

## Data Models

### Seed Data Structure

```typescript
interface SeedTopic {
  slug: string;          // Unique, URL-friendly
  title: string;         // 3-6 words
  locale: 'en' | 'es' | 'fr';
  tags: string[];        // 2-4 tags
  primaryQuestion: {
    text: string;        // Question ending with ?
  };
  article: {
    content: string;     // 3 paragraphs
    status: 'PUBLISHED' | 'DRAFT';
  };
  faqItems: Array<{
    question: string;    // Question ending with ?
    answer: string;      // 1 paragraph
    order: number;       // Sequential
  }>;
}
```

## Error Handling

### Middleware Errors
- Log authentication failures
- Redirect to login with callback URL
- Handle missing environment variables gracefully

### Page Errors
- Wrap async operations in try-catch
- Return fallback data on errors
- Display user-friendly error messages
- Log errors for debugging

### API Errors
- Return appropriate HTTP status codes
- Include error messages in response
- Log errors with context
- Implement retry logic where appropriate

### Database Errors
- Handle connection failures
- Catch query errors
- Validate data before operations
- Use transactions for multi-step operations

## Testing Strategy

### 1. Middleware Testing
```typescript
// Test unauthenticated access
test('redirects unauthenticated users to login', async () => {
  const response = await fetch('http://localhost:3000/admin');
  expect(response.status).toBe(307); // Redirect
  expect(response.headers.get('location')).toContain('/admin/login');
});

// Test authenticated access
test('allows authenticated users to access admin', async () => {
  const response = await fetch('http://localhost:3000/admin', {
    headers: {
      Cookie: `next-auth.session-token=${validToken}`,
    },
  });
  expect(response.status).toBe(200);
});
```

### 2. Topics Page Testing
```typescript
// Test page loads
test('topics page returns 200', async () => {
  const response = await fetch('http://localhost:3000/topics');
  expect(response.status).toBe(200);
});

// Test with filters
test('topics page handles filters', async () => {
  const response = await fetch('http://localhost:3000/topics?locale=en&tag=technology');
  expect(response.status).toBe(200);
  const html = await response.text();
  expect(html).toContain('technology');
});

// Test empty state
test('topics page shows empty state when no data', async () => {
  // Clear database
  await prisma.topic.deleteMany();
  
  const response = await fetch('http://localhost:3000/topics');
  const html = await response.text();
  expect(html).toContain('No topics available');
});
```

### 3. Search Page Testing
```typescript
// Test search functionality
test('search returns results', async () => {
  const response = await fetch('http://localhost:3000/search?q=test');
  expect(response.status).toBe(200);
});

// Test empty search
test('search handles empty query', async () => {
  const response = await fetch('http://localhost:3000/search');
  expect(response.status).toBe(200);
  const html = await response.text();
  expect(html).toContain('Start searching');
});
```

### 4. Seed Testing
```typescript
// Test seed creates data
test('seed creates topics', async () => {
  await seed({ clear: true, count: 5 });
  
  const topics = await prisma.topic.findMany();
  expect(topics.length).toBe(5);
  
  // Verify relations
  const topic = await prisma.topic.findFirst({
    include: {
      primaryQuestion: true,
      article: true,
      faqItems: true,
    },
  });
  
  expect(topic?.primaryQuestion).toBeDefined();
  expect(topic?.article).toBeDefined();
  expect(topic?.faqItems.length).toBeGreaterThan(0);
});
```

### 5. Integration Testing
- Run full test suite after all fixes
- Test in Docker environment
- Verify all requirements are met
- Check performance metrics

## Implementation Order

1. **Create test data seeder** (Requirement 4)
   - Implement seed script
   - Add CLI commands
   - Test seed functionality
   - Generate initial test data

2. **Fix topics listing page** (Requirement 2)
   - Add error handling
   - Optimize database queries
   - Test with seed data
   - Verify all filters work

3. **Fix search page** (Requirement 3)
   - Enhance error handling
   - Test with seed data
   - Verify search functionality
   - Test edge cases

4. **Fix admin middleware** (Requirement 1)
   - Implement enhanced middleware
   - Add server-side checks
   - Test authentication flow
   - Verify in Docker

5. **Comprehensive testing** (Requirement 5)
   - Run automated tests
   - Perform manual testing
   - Test in Docker
   - Verify all fixes

## Deployment Considerations

### Environment Variables
Ensure all required variables are set:
- `NEXTAUTH_SECRET` - Must be set in production
- `NEXTAUTH_URL` - Must match production URL
- `DATABASE_URL` - Must point to production database
- `ADMIN_EMAIL` - Admin login email
- `ADMIN_PASSWORD` - Admin login password (use strong password)

### Docker Configuration
- Verify environment variables in docker-compose.yml
- Ensure standalone build includes middleware
- Test authentication in Docker before deployment
- Monitor logs for errors

### Database
- Run migrations before seeding
- Backup database before clearing
- Use seed script to populate production (if needed)
- Monitor query performance

### Monitoring
- Add logging for authentication events
- Monitor error rates
- Track page load times
- Set up alerts for failures

## Security Considerations

1. **Authentication**
   - Use strong NEXTAUTH_SECRET
   - Implement rate limiting on login
   - Log authentication attempts
   - Use HTTPS in production

2. **Data Validation**
   - Validate all user inputs
   - Sanitize search queries
   - Prevent SQL injection
   - Use Prisma's built-in protections

3. **Error Messages**
   - Don't expose sensitive information
   - Use generic error messages for users
   - Log detailed errors server-side
   - Implement error boundaries

## Performance Optimization

1. **Caching**
   - Cache topics API responses (60s revalidation)
   - Use Next.js static generation where possible
   - Implement Redis for session storage (future)

2. **Database**
   - Add indexes on frequently queried fields
   - Optimize Prisma queries
   - Use pagination for large datasets
   - Monitor slow queries

3. **Frontend**
   - Implement loading states
   - Use Suspense boundaries
   - Lazy load components
   - Optimize images

## Success Criteria

1. ✅ Admin middleware blocks unauthenticated users (100% success rate)
2. ✅ Topics page loads without 500 errors
3. ✅ Search page functions correctly
4. ✅ Test data seeder creates realistic data
5. ✅ All automated tests pass
6. ✅ Manual testing confirms all fixes
7. ✅ Docker deployment works correctly
8. ✅ Performance meets requirements (< 2s page load)
