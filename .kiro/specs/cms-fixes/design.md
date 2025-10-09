# Design Document

## Overview

This design addresses four critical issues preventing the CMS from functioning correctly:
1. Homepage displaying wrong content due to route conflict
2. API calls failing in server components due to relative URLs
3. Admin authentication not properly enforced
4. Data fetching errors in admin dashboard

The solution involves removing conflicting routes, creating a proper API client for server-side rendering, and ensuring authentication is properly configured.

## Architecture

### Current Issues

1. **Route Conflict**: `src/app/page.tsx` (root) takes precedence over `src/app/(public)/page.tsx`, causing the wrong homepage to display
2. **API Client**: The current `getTopics` function uses relative URLs (`/api/topics`) which don't work in server components during SSR/SSG
3. **Authentication**: NextAuth middleware is configured but admin pages may not be properly wrapped in SessionProvider
4. **Base URL**: No environment variable for API base URL, causing fetch calls to fail during build

### Solution Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Next.js App                          │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │  Public Routes   │      │   Admin Routes   │        │
│  │  (public)/       │      │   /admin/*       │        │
│  │  - page.tsx      │      │   - Protected    │        │
│  │  - topics/       │      │   - SessionProvider│      │
│  └────────┬─────────┘      └────────┬─────────┘        │
│           │                         │                   │
│           │                         │                   │
│  ┌────────▼─────────────────────────▼─────────┐        │
│  │         API Client Layer                    │        │
│  │  - getBaseUrl() helper                      │        │
│  │  - Server-safe fetch with absolute URLs     │        │
│  │  - Client-safe fetch with relative URLs     │        │
│  └────────┬────────────────────────────────────┘        │
│           │                                              │
│  ┌────────▼────────────────────────────────────┐        │
│  │         API Routes (/api/*)                  │        │
│  │  - /api/topics                               │        │
│  │  - /api/topics/[slug]                        │        │
│  │  - /api/auth/[...nextauth]                   │        │
│  └──────────────────────────────────────────────┘        │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Route Structure Fix

**Remove**: `src/app/page.tsx` (conflicting root page)

**Keep**: `src/app/(public)/page.tsx` (proper homepage)

The route group `(public)` allows the page.tsx inside it to serve as the root route without the group name in the URL.

### 2. API Client Enhancement

**File**: `src/lib/api/topics.ts`

Add a helper function to determine the correct base URL:

```typescript
function getBaseUrl(): string {
  // Browser environment
  if (typeof window !== 'undefined') {
    return '';
  }
  
  // Server environment
  // 1. Check for explicit API URL (for production)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // 2. Check for Vercel URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // 3. Default to localhost for development
  return 'http://localhost:3000';
}
```

Update fetch calls to use absolute URLs:

```typescript
const baseUrl = getBaseUrl();
const url = `${baseUrl}/api/topics${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
```

### 3. Environment Configuration

**File**: `.env.example` and `.env`

Add:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

For production, this should be set to the actual domain.

### 4. Admin Layout Authentication

**File**: `src/app/admin/layout.tsx`

The layout already wraps content in `SessionProvider`, which is correct. The middleware should handle redirects.

### 5. Middleware Configuration

**File**: `middleware.ts`

Current configuration is correct:
- Protects all `/admin/*` routes
- Redirects to `/admin/login` if not authenticated
- Uses NextAuth token validation

## Data Models

No changes to data models required. The issue is with data fetching, not data structure.

## Error Handling

### API Client Error Handling

1. **Network Errors**: Catch and wrap in APIError with appropriate status codes
2. **Server Errors**: Display user-friendly error messages in UI
3. **Build-time Errors**: Gracefully handle missing data during static generation

### Admin Dashboard Error Handling

The dashboard already has error handling:
```typescript
try {
  const topicsData = await getTopics({ limit: 1000 });
  // ... render stats
} catch (error) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-8">
      <p className="text-sm">Failed to load dashboard statistics</p>
    </div>
  );
}
```

This pattern should work once API calls are fixed.

## Testing Strategy

### Manual Testing

1. **Homepage Test**:
   - Visit `/` and verify proper homepage displays
   - Check that featured topics load
   - Verify search bar is present

2. **Admin Authentication Test**:
   - Try accessing `/admin` without login → should redirect to `/admin/login`
   - Login with valid credentials → should access dashboard
   - Verify dashboard statistics load correctly

3. **API Functionality Test**:
   - Check browser console for fetch errors
   - Verify topics display on homepage
   - Verify admin dashboard loads data

### Build Test

Run `npm run build` to ensure:
- No fetch errors during static generation
- All pages build successfully
- No TypeScript errors

## Implementation Notes

### Order of Operations

1. **First**: Remove conflicting root page (immediate fix for homepage)
2. **Second**: Add base URL helper and update API client (fixes data fetching)
3. **Third**: Add environment variable (ensures production compatibility)
4. **Fourth**: Test authentication flow (verify security)

### Backwards Compatibility

These changes are backwards compatible:
- Existing API routes remain unchanged
- Client-side fetching continues to work
- Only server-side rendering behavior is improved

### Performance Considerations

- Base URL calculation happens once per request
- No additional network overhead
- Caching strategy (ISR with 5-minute revalidation) remains intact

## Security Considerations

1. **Environment Variables**: Use `NEXT_PUBLIC_` prefix only for client-accessible values
2. **Authentication**: Middleware properly validates tokens before allowing admin access
3. **API Routes**: Continue to validate authentication in API route handlers
4. **CORS**: Not an issue since API and frontend are same origin

## Deployment Checklist

1. Set `NEXT_PUBLIC_API_URL` environment variable in production
2. Verify middleware configuration is deployed
3. Test authentication flow in production
4. Monitor for any fetch errors in logs
5. Verify homepage displays correctly
