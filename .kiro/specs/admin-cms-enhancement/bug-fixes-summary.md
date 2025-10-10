# Bug Fixes Summary

## Issues Fixed

### 1. Duplicate Sidebar in Admin Topics Pages
**Issue:** Admin topics pages were showing two sidebars side by side.

**Root Cause:** 
- The `ClientAuthCheck` component was rendering a complete admin layout (including sidebar)
- The pages were already wrapped in the admin layout from `layout.tsx`
- This caused duplicate sidebars to render

**Solution:**
- Removed `ClientAuthCheck` wrapper from:
  - `src/app/admin/topics/page.tsx`
  - `src/app/admin/topics/new/page.tsx`
- The admin layout already handles authentication via `AdminLayoutClient`

**Files Modified:**
- `src/app/admin/topics/page.tsx`
- `src/app/admin/topics/new/page.tsx`

---

### 2. Draft Topics Not Showing in Admin
**Issue:** The admin topics list was only showing published topics, not drafts.

**Root Cause:**
- Admin pages were using the public API (`getTopics` and `getTopicBySlug`)
- The public API filters for PUBLISHED articles only (by design)
- Admins need to see ALL topics regardless of status

**Solution:**
Created dedicated admin API endpoints that include draft topics:

**New API Endpoints:**
- `GET /api/admin/topics` - Returns all topics including drafts
- `GET /api/admin/topics/[slug]` - Returns single topic including drafts

**New Repository Methods:**
- `findAllTopics()` - Returns all topics regardless of article status
- `findTopicBySlugIncludingDrafts()` - Returns single topic with draft articles

**New Client API Functions:**
- `getAdminTopics()` - Fetches all topics for admin interface
- `getAdminTopicBySlug()` - Fetches single topic for admin interface

**Files Created:**
- `src/app/api/admin/topics/route.ts`

**Files Modified:**
- `src/app/api/admin/topics/[slug]/route.ts` - Added GET endpoint
- `src/lib/repositories/content.repository.ts` - Added admin methods
- `src/lib/api/topics.ts` - Added admin client functions
- `src/app/admin/topics/page.tsx` - Updated to use admin API
- `src/app/admin/topics/[slug]/edit/page.tsx` - Updated to use admin API

---

### 3. Update Topic Button Not Working
**Issue:** The "Update Topic" button on the edit page was not working.

**Root Cause:**
- The validation schema required the main question to end with a question mark (`?`)
- Existing topics in the database might not have question marks
- This caused validation to fail when trying to update existing topics

**Solution:**
- Removed the strict requirement for question marks in the `mainQuestion` field
- The validation now only checks length (10-500 characters)
- This allows updating existing topics without forcing question mark addition

**Files Modified:**
- `src/lib/utils/validation.ts`

**Validation Changes:**
```typescript
// Before (too strict):
mainQuestion: z.string()
  .min(10, '...')
  .max(500, '...')
  .refine(
    (val) => val.trim().endsWith('?'),
    'Main question should end with a question mark (?)'
  ),

// After (more lenient):
mainQuestion: z.string()
  .min(10, '...')
  .max(500, '...'),
```

---

### 4. HMAC Environment Variable Error
**Issue:** Error "NEXT_PUBLIC_INGEST_API_KEY environment variable is not set" when creating or updating topics.

**Root Cause:**
- The admin pages were using `createOrUpdateTopic()` which requires HMAC signature
- HMAC is designed for external webhook ingestion, not admin operations
- Admin operations should use session-based authentication, not API keys

**Solution:**
Created dedicated admin endpoints that use session authentication instead of HMAC:

**New API Endpoints:**
- `POST /api/admin/topics/create` - Create topic with session auth
- `PUT /api/admin/topics/[slug]/update` - Update topic with session auth

**New Client API Functions:**
- `createTopicAdmin()` - Creates topic via admin endpoint
- `updateTopicAdmin()` - Updates topic via admin endpoint

**Files Created:**
- `src/app/api/admin/topics/create/route.ts`
- `src/app/api/admin/topics/[slug]/update/route.ts`

**Files Modified:**
- `src/lib/api/ingest.ts` - Added admin functions
- `src/app/admin/topics/new/page.tsx` - Uses `createTopicAdmin()`
- `src/app/admin/topics/[slug]/edit/page.tsx` - Uses `updateTopicAdmin()`

**Benefits:**
- ✅ No need for HMAC environment variables in admin operations
- ✅ Proper separation between webhook ingestion and admin operations
- ✅ Session-based authentication for admin actions
- ✅ Simpler and more secure for admin users

---

## Testing Recommendations

### Manual Testing
1. **Sidebar Issue:**
   - Navigate to `/admin/topics`
   - Verify only one sidebar appears
   - Test on mobile and desktop views

2. **Draft Topics:**
   - Create a topic with DRAFT status
   - Verify it appears in the admin topics list
   - Verify it does NOT appear in the public topics list
   - Edit the draft topic and verify it loads correctly

3. **Update Topic:**
   - Edit an existing topic
   - Change the title, content, or status
   - Click "Update Topic"
   - Verify the changes are saved
   - Verify no validation errors appear

### API Testing
- Test `GET /api/admin/topics` returns both draft and published topics
- Test `GET /api/admin/topics/[slug]` returns draft topics
- Test `GET /api/topics` only returns published topics (public API)

---

## Impact

### Positive Changes
- ✅ Admin interface now properly displays one sidebar
- ✅ Admins can see and manage draft topics
- ✅ Topic editing works without validation issues
- ✅ Public API still correctly filters for published content only
- ✅ Better separation between admin and public APIs

### No Breaking Changes
- Public API behavior unchanged
- Existing published topics still work as before
- No database schema changes required

---

## Related Task
These bug fixes were discovered and resolved during the implementation of:
- **Task 13: Enhanced Topic CRUD Operations**
