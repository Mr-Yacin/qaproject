# Design Document

## Overview

This design addresses critical layout and authentication issues in the admin dashboard where duplicate sidebars are rendered and the sidebar appears on the login page. The root cause is a mix of two different patterns for handling authentication and layout:

1. **Pattern A (Problematic)**: Pages using `ClientAuthCheck` component which renders its own complete admin layout including sidebar
2. **Pattern B (Correct)**: Pages using server-side authentication with `getServerSession` that rely on the parent `AdminLayoutClient` for layout

The solution consolidates all layout rendering into the `AdminLayoutClient` component and removes layout duplication from `ClientAuthCheck`, converting it to a pure authentication guard.

## Architecture

### Current State Problems

```
┌─────────────────────────────────────────┐
│ AdminLayoutClient (layout.tsx)          │
│ ├── Sidebar (First Instance)            │
│ └── Children                             │
│     └── ClientAuthCheck (in page.tsx)   │
│         ├── Sidebar (Second Instance) ❌ │
│         └── Page Content                 │
└─────────────────────────────────────────┘
```

**Issues:**
- Two sidebars render simultaneously
- Sidebar renders on login page despite no authentication
- ClientAuthCheck duplicates layout functionality
- Inconsistent patterns across admin pages

### Proposed Architecture

```
┌─────────────────────────────────────────┐
│ /admin/login                             │
│ └── LoginLayout (bypasses AdminLayout)  │
│     └── Login Page (no sidebar) ✅       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ /admin/* (all other routes)              │
│ └── AdminLayoutClient                    │
│     ├── Auth Check (server-side)         │
│     ├── Conditional Sidebar Rendering    │
│     │   └── Sidebar (single instance) ✅ │
│     └── Children (page content)          │
└─────────────────────────────────────────┘
```

## Components and Interfaces

### 1. AdminLayoutClient Component (Modified)

**Location:** `src/components/admin/AdminLayoutClient.tsx`

**Responsibilities:**
- Check authentication state from session prop
- Conditionally render sidebar based on route and auth state
- Provide layout wrapper for all authenticated admin pages
- Handle mobile sidebar toggle state
- Persist across navigation (Next.js layout behavior)

**Interface:**
```typescript
interface AdminLayoutClientProps {
  children: React.ReactNode;
  session: Session | null;
}
```

**Key Changes:**
- Add route detection to skip sidebar on `/admin/login`
- Only render sidebar when session exists AND route is not login
- Maintain existing mobile sidebar toggle functionality
- Keep SessionProvider wrapper for client components

**Logic Flow:**
```typescript
function AdminLayoutClient({ children, session }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';
  const shouldShowSidebar = session && !isLoginPage;

  return (
    <SessionProvider session={session}>
      {shouldShowSidebar ? (
        // Full admin layout with sidebar
        <AdminLayoutWithSidebar>{children}</AdminLayoutWithSidebar>
      ) : (
        // Minimal layout without sidebar (for login)
        <>{children}</>
      )}
    </SessionProvider>
  );
}
```

### 2. ClientAuthCheck Component (Refactored)

**Location:** `src/components/admin/ClientAuthCheck.tsx`

**New Responsibilities:**
- Pure authentication guard (no layout rendering)
- Redirect unauthenticated users to login
- Show loading state during auth check
- Provide auth context to child components

**Interface:**
```typescript
interface ClientAuthCheckProps {
  children: React.ReactNode;
  requiredRole?: UserRole; // Optional role-based access control
}
```

**Key Changes:**
- **Remove all layout rendering** (sidebar, header, breadcrumbs)
- Keep only authentication logic
- Return children directly when authenticated
- Optionally support role-based access control

**Simplified Logic:**
```typescript
export function ClientAuthCheck({ children, requiredRole }: ClientAuthCheckProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/admin/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  // Optional: Check role-based access
  if (requiredRole && session?.user?.role !== requiredRole) {
    return <AccessDenied />;
  }

  // Just return children - layout is handled by AdminLayoutClient
  return <>{children}</>;
}
```

### 3. Admin Layout (Server Component)

**Location:** `src/app/admin/layout.tsx`

**Current Implementation (Keep):**
```typescript
export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions);
  return <AdminLayoutClient session={session}>{children}</AdminLayoutClient>;
}
```

**Why Keep This:**
- Server-side session fetching is more efficient
- Provides session to client component via props
- Maintains Next.js App Router best practices

### 4. Login Layout (Server Component)

**Location:** `src/app/admin/login/layout.tsx`

**Current Implementation (Keep):**
```typescript
export default async function LoginLayout({ children }) {
  const session = await getServerSession(authOptions);
  
  if (session) {
    redirect('/admin');
  }

  return <>{children}</>;
}
```

**Why Keep This:**
- Redirects authenticated users away from login
- Bypasses AdminLayoutClient completely
- Provides clean login experience

## Data Models

No database schema changes required. This is purely a frontend refactoring.

## Error Handling

### Authentication Errors

**Scenario:** Session validation fails
```typescript
// In ClientAuthCheck
if (status === 'unauthenticated') {
  console.log('[ClientAuthCheck] No session, redirecting to login');
  router.push(`/admin/login?callbackUrl=${encodeURIComponent(pathname)}`);
  return null;
}
```

**Scenario:** Session loading takes too long
```typescript
// Show loading state with timeout
if (status === 'loading') {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
```

### Role-Based Access Errors

**Scenario:** User lacks required role
```typescript
if (requiredRole && session?.user?.role !== requiredRole) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p>You don't have permission to access this page.</p>
        <Button onClick={() => router.push('/admin')} className="mt-4">
          Return to Dashboard
        </Button>
      </Card>
    </div>
  );
}
```

### Layout Rendering Errors

**Scenario:** Sidebar fails to render
```typescript
// Add error boundary around sidebar
<ErrorBoundary fallback={<SidebarFallback />}>
  <Sidebar isMobileOpen={isMobileSidebarOpen} onMobileToggle={toggleMobileSidebar} />
</ErrorBoundary>
```

## Testing Strategy

### Unit Tests

**Test File:** `src/components/admin/AdminLayoutClient.test.tsx`

```typescript
describe('AdminLayoutClient', () => {
  it('should render sidebar when session exists and not on login page', () => {
    // Test with session and /admin route
  });

  it('should not render sidebar on login page', () => {
    // Test with /admin/login route
  });

  it('should not render sidebar when session is null', () => {
    // Test with null session
  });

  it('should maintain sidebar state during navigation', () => {
    // Test that sidebar doesn't remount on route change
  });
});
```

**Test File:** `src/components/admin/ClientAuthCheck.test.tsx`

```typescript
describe('ClientAuthCheck', () => {
  it('should render children when authenticated', () => {
    // Test with valid session
  });

  it('should redirect to login when unauthenticated', () => {
    // Test redirect behavior
  });

  it('should show loading state during auth check', () => {
    // Test loading state
  });

  it('should not render layout components', () => {
    // Ensure no sidebar/header in output
  });

  it('should enforce role-based access when requiredRole is provided', () => {
    // Test role checking
  });
});
```

### Integration Tests

**Test File:** `tests/integration/admin-layout.test.ts`

```typescript
describe('Admin Layout Integration', () => {
  it('should show single sidebar on dashboard', async () => {
    // Navigate to /admin
    // Count sidebar elements in DOM
    // Assert exactly 1 sidebar exists
  });

  it('should not show sidebar on login page', async () => {
    // Navigate to /admin/login
    // Assert no sidebar in DOM
  });

  it('should persist sidebar during navigation', async () => {
    // Navigate to /admin
    // Get sidebar element reference
    // Navigate to /admin/topics
    // Assert same sidebar element still exists (not remounted)
  });

  it('should show sidebar on all authenticated admin pages', async () => {
    // Test each admin route
    // Assert sidebar exists on each
  });
});
```

### Manual Testing Checklist

1. **Login Flow**
   - [ ] Navigate to `/admin/login` - no sidebar visible
   - [ ] Login with valid credentials
   - [ ] Redirected to `/admin` - sidebar appears
   - [ ] Only one sidebar visible

2. **Navigation Persistence**
   - [ ] Navigate from Dashboard to Topics
   - [ ] Sidebar doesn't flicker or reload
   - [ ] Active menu item updates smoothly
   - [ ] Mobile sidebar state persists

3. **All Admin Pages**
   - [ ] Dashboard (`/admin`) - single sidebar
   - [ ] Topics (`/admin/topics`) - single sidebar
   - [ ] Create Topic (`/admin/topics/new`) - single sidebar
   - [ ] Settings (`/admin/settings`) - single sidebar
   - [ ] Pages (`/admin/pages`) - single sidebar
   - [ ] Media (`/admin/media`) - single sidebar
   - [ ] Menus (`/admin/menus`) - single sidebar
   - [ ] Footer (`/admin/footer`) - single sidebar
   - [ ] Users (`/admin/users`) - single sidebar
   - [ ] Audit Log (`/admin/audit-log`) - single sidebar
   - [ ] Cache (`/admin/cache`) - single sidebar

4. **Authentication Edge Cases**
   - [ ] Logout from any page - redirected to login without sidebar
   - [ ] Session expires - redirected to login
   - [ ] Direct URL access while unauthenticated - redirected to login
   - [ ] Access login while authenticated - redirected to dashboard

## Implementation Phases

### Phase 1: Refactor ClientAuthCheck (Remove Layout)
- Remove all layout rendering from ClientAuthCheck
- Keep only authentication logic
- Add optional role-based access control
- Update component tests

### Phase 2: Update AdminLayoutClient (Conditional Sidebar)
- Add pathname detection
- Implement conditional sidebar rendering
- Ensure session-based rendering
- Test layout persistence

### Phase 3: Update All Pages Using ClientAuthCheck
- Remove ClientAuthCheck from pages that don't need client-side auth
- Update remaining pages to use refactored ClientAuthCheck
- Verify no duplicate sidebars
- Test each page individually

### Phase 4: Testing and Validation
- Run unit tests
- Run integration tests
- Perform manual testing on all admin pages
- Verify sidebar persistence during navigation
- Check mobile responsiveness

## Migration Path

### Pages to Update

**Remove ClientAuthCheck (use server-side auth instead):**
- `src/app/admin/media/page.tsx` - Already using server-side pattern ✅
- `src/app/admin/menus/page.tsx` - Already using server-side pattern ✅
- `src/app/admin/users/page.tsx` - Already using server-side pattern ✅
- `src/app/admin/audit-log/page.tsx` - Already using server-side pattern ✅
- `src/app/admin/cache/page.tsx` - Already using server-side pattern ✅
- `src/app/admin/footer/page.tsx` - Already using server-side pattern ✅

**Update to use refactored ClientAuthCheck:**
- `src/app/admin/page.tsx` (Dashboard)
- `src/app/admin/topics/page.tsx`
- `src/app/admin/topics/new/page.tsx`
- `src/app/admin/settings/page.tsx`
- `src/app/admin/pages/page.tsx`
- `src/app/admin/pages/new/page.tsx`
- `src/app/admin/pages/[slug]/edit/page.tsx`

### Backward Compatibility

- All existing pages will continue to work during migration
- Changes are non-breaking to the API
- Session handling remains unchanged
- Middleware authentication is unaffected

## Performance Considerations

### Sidebar Persistence

**Current Problem:** Sidebar re-renders on every navigation
**Solution:** Next.js App Router layouts persist by default
**Benefit:** Sidebar component doesn't unmount/remount during navigation

### Server-Side Session Fetching

**Current:** Session fetched server-side in layout
**Keep:** This is optimal for performance
**Benefit:** No client-side session fetch on initial load

### Code Splitting

**Impact:** Removing layout from ClientAuthCheck reduces bundle size
**Benefit:** Smaller JavaScript payload for pages using ClientAuthCheck

## Security Considerations

### Authentication Layers

1. **Middleware** (`middleware.ts`) - First line of defense
   - Validates JWT token
   - Redirects unauthenticated requests
   - Runs on edge

2. **Server Components** - Second layer
   - `getServerSession` in layouts and pages
   - Server-side role checking
   - No client-side exposure

3. **Client Components** - Third layer
   - `ClientAuthCheck` for client-side protection
   - Handles session state changes
   - Provides UX feedback

### No Security Regressions

- All existing authentication checks remain in place
- Middleware protection unchanged
- Server-side session validation unchanged
- Only layout rendering logic changes

## Accessibility Considerations

### Sidebar Navigation

- Maintain ARIA labels and roles
- Ensure keyboard navigation works
- Keep skip links functional
- Preserve focus management

### Loading States

- Provide screen reader announcements
- Use semantic loading indicators
- Maintain focus during auth checks

### Error States

- Clear error messages
- Accessible error UI
- Keyboard-accessible actions

## Documentation Updates

### Code Comments

Update comments in:
- `AdminLayoutClient.tsx` - Document conditional rendering logic
- `ClientAuthCheck.tsx` - Document new pure auth guard pattern
- `layout.tsx` - Document layout hierarchy

### Developer Guide

Create guide in `.kiro/steering/admin-layout-patterns.md`:
- When to use server-side auth vs ClientAuthCheck
- How layout persistence works
- Common pitfalls to avoid
- Examples of correct patterns
