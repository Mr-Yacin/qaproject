# Authentication Edge Cases - Manual Test Checklist

This document provides a comprehensive manual testing checklist for authentication edge cases.

## Test Environment Setup

- [ ] Development server is running (`npm run dev`)
- [ ] Test user exists in database (admin@example.com / admin123)
- [ ] Browser developer tools are open for debugging
- [ ] Test in both desktop and mobile viewports

## Test Cases

### 1. Access /admin while logged out

**Objective:** Verify redirect to login when accessing admin dashboard without authentication

**Steps:**
1. [ ] Open browser in incognito/private mode
2. [ ] Navigate to `http://localhost:3000/admin`
3. [ ] Verify redirect to `/admin/login`
4. [ ] Check URL contains `callbackUrl=%2Fadmin`
5. [ ] Verify no sidebar is visible
6. [ ] Verify login form is displayed
7. [ ] Check browser console for auth logs

**Expected Results:**
- ✅ Redirected to login page
- ✅ CallbackUrl parameter preserved
- ✅ No admin sidebar visible
- ✅ Clean login interface displayed

### 2. Access /admin/login while logged in

**Objective:** Verify redirect to dashboard when accessing login page while authenticated

**Steps:**
1. [ ] Log in to admin dashboard first
2. [ ] Verify you're on `/admin` with sidebar visible
3. [ ] Navigate to `http://localhost:3000/admin/login`
4. [ ] Verify immediate redirect back to `/admin`
5. [ ] Verify sidebar remains visible
6. [ ] Verify no login form is shown

**Expected Results:**
- ✅ Redirected to admin dashboard
- ✅ Sidebar visible and functional
- ✅ No login form displayed
- ✅ User remains authenticated

### 3. Session expiration handling

**Objective:** Verify proper handling when session expires on an admin page

**Steps:**
1. [ ] Log in to admin dashboard
2. [ ] Navigate to `/admin/topics`
3. [ ] Verify page loads with sidebar
4. [ ] Open browser DevTools → Application → Storage
5. [ ] Clear all cookies and local storage
6. [ ] Navigate to `/admin/settings` (or refresh page)
7. [ ] Verify redirect to login page
8. [ ] Check callbackUrl parameter matches attempted page

**Expected Results:**
- ✅ Redirected to login after session cleared
- ✅ CallbackUrl preserves intended destination
- ✅ No sidebar visible on login page
- ✅ Clean error handling (no crashes)

### 4. CallbackUrl functionality

**Objective:** Verify user is redirected to intended page after login

**Steps:**
1. [ ] Ensure you're logged out (incognito mode)
2. [ ] Navigate directly to `http://localhost:3000/admin/topics`
3. [ ] Verify redirect to login with callbackUrl
4. [ ] Note the callbackUrl parameter value
5. [ ] Log in with valid credentials (admin@example.com / admin123)
6. [ ] Verify redirect to original `/admin/topics` page
7. [ ] Verify sidebar is visible and functional
8. [ ] Test with different deep URLs (e.g., `/admin/pages/new`)

**Expected Results:**
- ✅ CallbackUrl parameter correctly set
- ✅ Successful login redirects to intended page
- ✅ Deep URLs work correctly
- ✅ Admin layout renders properly after redirect

### 5. Logout from any page

**Objective:** Verify logout works correctly from any admin page

**Steps:**
1. [ ] Log in and navigate to `/admin/settings`
2. [ ] Verify you're on settings page with sidebar
3. [ ] Locate logout button (usually in user menu)
4. [ ] Click logout button
5. [ ] Verify redirect to `/admin/login`
6. [ ] Verify no sidebar is visible
7. [ ] Verify login form is displayed
8. [ ] Test logout from different pages (dashboard, topics, etc.)

**Expected Results:**
- ✅ Logout works from any admin page
- ✅ Redirected to clean login page
- ✅ No admin sidebar visible after logout
- ✅ Session completely cleared

### 6. Multiple rapid authentication attempts

**Objective:** Verify rate limiting and error handling for failed login attempts

**Steps:**
1. [ ] Navigate to login page
2. [ ] Attempt login with wrong credentials 3 times rapidly
3. [ ] Verify error messages are displayed
4. [ ] Wait for rate limit window (if applicable)
5. [ ] Attempt login with correct credentials
6. [ ] Verify successful login still works

**Expected Results:**
- ✅ Error messages displayed for failed attempts
- ✅ Rate limiting prevents abuse (if implemented)
- ✅ Valid credentials still work after failed attempts
- ✅ No system crashes or errors

### 7. Authentication persistence across refresh

**Objective:** Verify authentication state persists across browser refresh

**Steps:**
1. [ ] Log in to admin dashboard
2. [ ] Navigate to `/admin/topics`
3. [ ] Refresh the page (F5 or Ctrl+R)
4. [ ] Verify you remain authenticated
5. [ ] Verify sidebar is still visible
6. [ ] Verify you're still on the same page

**Expected Results:**
- ✅ Authentication persists across refresh
- ✅ User remains on same page
- ✅ Sidebar and layout remain intact
- ✅ No re-authentication required

### 8. Direct URL access to protected pages

**Objective:** Verify all admin pages are properly protected

**Test URLs:**
- [ ] `/admin` (dashboard)
- [ ] `/admin/topics`
- [ ] `/admin/topics/new`
- [ ] `/admin/settings`
- [ ] `/admin/pages`
- [ ] `/admin/pages/new`
- [ ] `/admin/media`
- [ ] `/admin/users`
- [ ] `/admin/menus`
- [ ] `/admin/footer`

**Steps for each URL:**
1. [ ] Ensure logged out (incognito mode)
2. [ ] Navigate directly to URL
3. [ ] Verify redirect to login
4. [ ] Verify callbackUrl parameter is correct
5. [ ] Log in and verify redirect to intended page

**Expected Results:**
- ✅ All admin pages require authentication
- ✅ Proper redirects to login page
- ✅ CallbackUrl preserves intended destination
- ✅ Successful login reaches intended page

## Browser Compatibility Testing

Test the above scenarios in:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (if on macOS)
- [ ] Edge

## Mobile Testing

- [ ] Test authentication flow on mobile viewport
- [ ] Verify mobile sidebar behavior after login
- [ ] Test touch interactions with login form

## Performance Considerations

- [ ] Check for console errors during auth flows
- [ ] Verify no memory leaks during session transitions
- [ ] Test with slow network conditions
- [ ] Verify loading states are appropriate

## Security Verification

- [ ] Verify no sensitive data in URL parameters
- [ ] Check that session tokens are httpOnly
- [ ] Verify CSRF protection is active
- [ ] Test that logout clears all session data

## Test Results Summary

**Date:** ___________  
**Tester:** ___________  
**Environment:** ___________

**Overall Results:**
- [ ] All authentication edge cases pass
- [ ] No duplicate sidebars observed
- [ ] CallbackUrl functionality works correctly
- [ ] Session handling is robust
- [ ] Logout works from all pages

**Issues Found:**
_List any issues discovered during testing_

**Notes:**
_Additional observations or recommendations_