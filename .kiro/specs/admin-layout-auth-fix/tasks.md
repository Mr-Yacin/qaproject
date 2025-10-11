# Implementation Plan

- [x] 1. Refactor ClientAuthCheck to remove layout rendering





  - Remove all layout components (Sidebar, SkipLink, Toaster, header) from ClientAuthCheck
  - Keep only authentication logic (session check, redirect, loading state)
  - Return children directly when authenticated without wrapping in layout
  - Add optional requiredRole prop for role-based access control
  - Create AccessDenied component for role check failures
  - _Requirements: 1.3, 1.5, 4.1, 5.1, 5.2, 5.3_

- [x] 2. Update AdminLayoutClient to conditionally render sidebar





  - Add usePathname hook to detect current route
  - Check if current route is /admin/login
  - Only render sidebar when session exists AND route is not login page
  - Render minimal layout (just children) when on login page or no session
  - Maintain existing mobile sidebar toggle functionality
  - Keep SessionProvider wrapper for all cases
  - _Requirements: 2.1, 2.2, 2.3, 2.6, 3.1, 3.2, 3.3_

- [x] 3. Update pages using ClientAuthCheck pattern








- [x] 3.1 Update dashboard page (src/app/admin/page.tsx)


  - Keep ClientAuthCheck wrapper (now layout-free)
  - Remove any duplicate layout code
  - Verify single sidebar renders
  - _Requirements: 1.1, 1.4, 1.6_

- [x] 3.2 Update topics list page (src/app/admin/topics/page.tsx)


  - Keep ClientAuthCheck wrapper
  - Verify no layout duplication
  - Test navigation to/from this page
  - _Requirements: 1.1, 1.4, 4.3_

- [x] 3.3 Update create topic page (src/app/admin/topics/new/page.tsx)


  - Keep ClientAuthCheck wrapper
  - Verify form works with new layout
  - _Requirements: 1.1, 1.4_

- [x] 3.4 Update settings page (src/app/admin/settings/page.tsx)


  - Keep ClientAuthCheck wrapper
  - Verify settings form renders correctly
  - _Requirements: 1.1, 1.4_

- [x] 3.5 Update pages list page (src/app/admin/pages/page.tsx)


  - Keep ClientAuthCheck wrapper
  - Verify page list displays correctly
  - _Requirements: 1.1, 1.4_

- [x] 3.6 Update create page (src/app/admin/pages/new/page.tsx)


  - Keep ClientAuthCheck wrapper
  - Verify page form works correctly
  - _Requirements: 1.1, 1.4_

- [x] 3.7 Update edit page (src/app/admin/pages/[slug]/edit/page.tsx)


  - Keep ClientAuthCheck wrapper
  - Verify edit form loads and saves correctly
  - _Requirements: 1.1, 1.4_

- [x] 4. Verify pages already using correct pattern





- [x] 4.1 Audit media page (src/app/admin/media/page.tsx)
  - Verify it uses server-side auth only
  - Confirm single sidebar renders
  - Test that it doesn't need ClientAuthCheck
  - _Requirements: 1.7, 1.8_

- [x] 4.2 Audit menus page (src/app/admin/menus/page.tsx)
  - Verify server-side auth pattern
  - Confirm no duplicate sidebar
  - _Requirements: 1.7, 1.8_


- [x] 4.3 Audit users page (src/app/admin/users/page.tsx)

  - Verify server-side auth with role check
  - Confirm single sidebar
  - _Requirements: 1.7, 1.8_

- [x] 4.4 Audit audit-log page (src/app/admin/audit-log/page.tsx)


  - Verify server-side auth with role check
  - Confirm no layout issues
  - _Requirements: 1.7, 1.8_

- [x] 4.5 Audit cache page (src/app/admin/cache/page.tsx)


  - Verify server-side auth with role check
  - Confirm single sidebar
  - _Requirements: 1.7, 1.8_

- [x] 4.6 Audit footer page (src/app/admin/footer/page.tsx)



  - Verify server-side auth pattern
  - Confirm no duplicate sidebar
  - _Requirements: 1.7, 1.8_

- [x] 5. Test login page sidebar visibility












  - Navigate to /admin/login while logged out
  - Verify no sidebar is visible
  - Verify only login form is displayed
  - Test login form submission
  - Verify redirect to /admin after successful login
  - Verify sidebar appears after login
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 6. Test sidebar persistence during navigation





  - Login to admin dashboard
  - Navigate from Dashboard to Topics
  - Verify sidebar doesn't flicker or reload
  - Navigate to Settings
  - Verify sidebar remains stable
  - Navigate to Pages, Media, Menus
  - Confirm sidebar persists throughout
  - Check that active menu item updates correctly
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 7. Test mobile sidebar functionality





  - Open admin on mobile viewport
  - Verify mobile menu button appears
  - Toggle mobile sidebar open
  - Navigate to different page
  - Verify mobile sidebar state is maintained
  - Close mobile sidebar
  - Verify it stays closed during navigation
  - _Requirements: 4.5, 4.6_

- [x] 8. Test authentication edge cases





  - Access /admin while logged out - verify redirect to login
  - Access /admin/login while logged in - verify redirect to dashboard
  - Let session expire on a page - verify redirect to login
  - Login and verify callbackUrl works correctly
  - Logout from any page - verify redirect to login without sidebar
  - _Requirements: 3.4, 3.7, 3.8_

- [ ] 9. Verify no duplicate sidebars on all pages
  - Open browser DevTools
  - Navigate to each admin page
  - Inspect DOM for sidebar elements
  - Confirm exactly one sidebar element exists on each page
  - Document any pages with issues
  - _Requirements: 1.1, 1.6, 1.7, 1.8_

- [ ] 10. Update documentation
  - Add comments to AdminLayoutClient explaining conditional rendering
  - Add comments to ClientAuthCheck explaining pure auth guard pattern
  - Update admin-patterns.md steering file with layout best practices
  - Document when to use server-side auth vs ClientAuthCheck
  - Add examples of correct patterns
  - _Requirements: 5.6, 5.8, 5.9, 5.10_
