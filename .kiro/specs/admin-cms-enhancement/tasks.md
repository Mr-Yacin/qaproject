# Implementation Plan

- [x] 1. Database schema and infrastructure setup






- [x] 1.1 Create Prisma schema extensions for CMS models

  - Add SiteSettings, Page, MenuItem, FooterColumn, FooterLink, FooterSettings, Media, User, AuditLog models
  - Add UserRole and AuditAction enums
  - Add appropriate indexes for performance
  - _Requirements: 2.5, 3.8, 4.8, 5.8, 6.5, 7.6, 8.5_

- [x] 1.2 Create and run database migration


  - Generate Prisma migration with `npx prisma migrate dev`
  - Verify migration creates all tables correctly
  - Generate updated Prisma client
  - _Requirements: 2.5, 3.8, 4.8, 5.8, 6.5, 7.6, 8.5_

- [x] 1.3 Create seed script for default data


  - Add default SiteSettings record
  - Add default admin user with hashed password
  - Add default menu structure
  - Add default footer configuration
  - _Requirements: 2.8, 7.2_

- [x] 2. Authentication and authorization infrastructure





- [x] 2.1 Implement User model and authentication service


  - Create user repository with CRUD operations
  - Implement password hashing with bcrypt
  - Create user service with authentication logic
  - Update NextAuth configuration to use User model
  - _Requirements: 7.2, 7.6_

- [x] 2.2 Implement role-based access control middleware


  - Create requireRole middleware function
  - Create requireAuth middleware function
  - Add role checking utilities
  - _Requirements: 7.3, 7.4, 7.5, 7.7_

- [x] 2.3 Create audit logging service


  - Create audit repository with log creation and querying
  - Create audit service with logging methods
  - Implement audit log middleware for API routes
  - _Requirements: 8.2, 8.7_


- [x] 3. Admin layout and navigation





- [x] 3.1 Create admin sidebar navigation component


  - Build AdminSidebar component with navigation links
  - Add active link highlighting
  - Include role-based menu item visibility
  - Make responsive for mobile
  - _Requirements: 7.3, 7.4, 7.5_

- [x] 3.2 Create admin header component


  - Build AdminHeader with user menu
  - Add logout functionality
  - Display current user name and role
  - _Requirements: 7.6_

- [x] 3.3 Update admin layout with sidebar and header


  - Integrate AdminSidebar and AdminHeader into admin layout
  - Add breadcrumb navigation
  - Style with Tailwind CSS
  - _Requirements: 7.3, 7.4, 7.5_

- [x] 4. Site settings management




- [x] 4.1 Create settings repository and service


  - Implement settings repository with get and update methods
  - Create settings service with business logic
  - Add Zod validation schema for settings
  - _Requirements: 2.5, 2.8_



- [x] 4.2 Create settings API endpoints

  - Implement GET /api/admin/settings endpoint
  - Implement PUT /api/admin/settings endpoint
  - Implement POST /api/admin/settings/logo endpoint for file upload
  - Add role-based access control (ADMIN only)


  - _Requirements: 2.1, 2.2, 2.3, 2.6_

- [x] 4.3 Create settings management UI


  - Build SettingsForm component with all fields
  - Create LogoUploader component with preview
  - Build settings page at /admin/settings
  - Add form validation and error handling
  - _Requirements: 2.1, 2.2, 2.3, 2.8_

- [x] 5. Media library






- [x] 5.1 Create media repository and service

  - Implement media repository with CRUD operations
  - Create media service with upload, delete, and list methods
  - Add file validation (type, size)
  - Implement thumbnail generation with Sharp
  - _Requirements: 6.2, 6.3, 6.5, 6.7_


- [x] 5.2 Create media API endpoints

  - Implement GET /api/admin/media endpoint with pagination
  - Implement POST /api/admin/media/upload endpoint
  - Implement DELETE /api/admin/media/[id] endpoint
  - Add role-based access control (ADMIN, EDITOR)
  - _Requirements: 6.1, 6.2, 6.5_

- [x] 5.3 Create media library UI


  - Build MediaLibrary component with grid view
  - Create MediaUploader component with drag-and-drop
  - Build MediaDetails modal with file info
  - Add search and filter functionality
  - Build media page at /admin/media
  - _Requirements: 6.1, 6.4, 6.6, 6.8_


- [x] 6. Custom page management






- [x] 6.1 Create page repository and service

  - Implement page repository with CRUD operations
  - Create page service with business logic
  - Add Zod validation schema for pages
  - Implement slug uniqueness validation
  - _Requirements: 3.2, 3.8, 3.9_


- [x] 6.2 Create page API endpoints

  - Implement GET /api/admin/pages endpoint with pagination
  - Implement GET /api/admin/pages/[slug] endpoint
  - Implement POST /api/admin/pages endpoint
  - Implement PUT /api/admin/pages/[slug] endpoint
  - Implement DELETE /api/admin/pages/[slug] endpoint
  - Add role-based access control (ADMIN, EDITOR)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.7_


- [x] 6.3 Create page management UI

  - Build PageList component with table view
  - Create PageForm component with rich text editor
  - Integrate TipTap editor for content editing
  - Add SEO metadata fields
  - Build pages list page at /admin/pages
  - Build create page at /admin/pages/new
  - Build edit page at /admin/pages/[slug]/edit
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.9_


- [x] 6.4 Create public page rendering

  - Build CustomPage component for rendering pages
  - Create dynamic route at /pages/[slug]
  - Implement HTML sanitization with DOMPurify
  - Add SEO metadata to page head
  - Respect DRAFT/PUBLISHED status
  - _Requirements: 3.3, 3.5, 3.6, 3.9_

- [x] 7. Navigation menu management




- [x] 7.1 Create menu repository and service


  - Implement menu repository with CRUD operations
  - Create menu service with hierarchical query logic
  - Add Zod validation schema for menu items
  - Implement reordering logic
  - _Requirements: 4.2, 4.3, 4.6_


- [x] 7.2 Create menu API endpoints

  - Implement GET /api/admin/menus endpoint
  - Implement POST /api/admin/menus endpoint
  - Implement PUT /api/admin/menus/[id] endpoint
  - Implement DELETE /api/admin/menus/[id] endpoint
  - Implement PUT /api/admin/menus/reorder endpoint
  - Add role-based access control (ADMIN, EDITOR)
  - _Requirements: 4.1, 4.2, 4.5, 4.6_


- [x] 7.3 Create menu management UI

  - Build MenuBuilder component with drag-and-drop
  - Create MenuItemForm component
  - Add nested menu support (parent-child)
  - Build menu page at /admin/menus
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6_


- [x] 7.4 Create dynamic navigation component

  - Build Navigation component that reads from database
  - Support nested menus (dropdowns)
  - Handle internal and external links
  - Update Header component to use dynamic navigation
  - _Requirements: 4.1, 4.4, 4.7, 4.8_


- [x] 8. Footer management




- [x] 8.1 Create footer repository and service


  - Implement footer repository with CRUD operations for columns and links
  - Create footer service with business logic
  - Add Zod validation schemas for footer entities
  - _Requirements: 5.2, 5.3, 5.6, 5.7_

- [x] 8.2 Create footer API endpoints



  - Implement GET /api/admin/footer endpoint
  - Implement PUT /api/admin/footer/settings endpoint
  - Implement POST /api/admin/footer/columns endpoint
  - Implement PUT /api/admin/footer/columns/[id] endpoint
  - Implement DELETE /api/admin/footer/columns/[id] endpoint
  - Implement POST /api/admin/footer/links endpoint
  - Implement PUT /api/admin/footer/links/[id] endpoint
  - Implement DELETE /api/admin/footer/links/[id] endpoint
  - Add role-based access control (ADMIN, EDITOR)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7, 5.8_

- [x] 8.3 Create footer management UI




  - Build FooterBuilder component
  - Create FooterColumnForm component
  - Create FooterLinkForm component
  - Add reordering functionality
  - Build footer page at /admin/footer
  - _Requirements: 5.1, 5.2, 5.3, 5.6, 5.7_

- [x] 8.4 Create dynamic footer component




  - Build Footer component that reads from database
  - Support multiple columns
  - Display social media icons
  - Update public layout to use dynamic footer
  - _Requirements: 5.1, 5.4, 5.5, 5.7_

- [x] 9. User management




- [x] 9.1 Create user management API endpoints


  - Implement GET /api/admin/users endpoint
  - Implement POST /api/admin/users endpoint
  - Implement PUT /api/admin/users/[id] endpoint
  - Implement DELETE /api/admin/users/[id] endpoint
  - Add role-based access control (ADMIN only)
  - _Requirements: 7.1, 7.2, 7.6, 7.8_

- [x] 9.2 Create user management UI


  - Build UserList component with table view
  - Create UserForm component with role selector
  - Add password strength indicator
  - Build users page at /admin/users
  - _Requirements: 7.1, 7.2, 7.8_

- [x] 10. Audit log viewer







- [x] 10.1 Create audit log API endpoints

  - Implement GET /api/admin/audit-log endpoint with filters
  - Implement GET /api/admin/audit-log/export endpoint
  - Add pagination support
  - Add role-based access control (ADMIN only)
  - _Requirements: 8.1, 8.3, 8.6_


- [x] 10.2 Create audit log UI

  - Build AuditLogTable component
  - Create AuditFilters component with date range, user, action filters
  - Build AuditDetails modal for viewing log entries
  - Add export to CSV functionality
  - Build audit log page at /admin/audit-log
  - _Requirements: 8.1, 8.3, 8.4, 8.6, 8.8_


- [x] 11. Cache management interface






- [x] 11.1 Create cache management API endpoints

  - Implement GET /api/admin/cache/stats endpoint
  - Implement POST /api/admin/cache/clear endpoint
  - Add support for clearing specific tags
  - Add role-based access control (ADMIN only)
  - _Requirements: 9.1, 9.2, 9.3, 9.7_


- [x] 11.2 Create cache management UI

  - Build CacheStats component showing cache statistics
  - Create CacheControls component with clear buttons
  - Add tag-specific clearing options
  - Build cache page at /admin/cache
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.8_

- [x] 12. Bulk operations for topics





- [x] 12.1 Create bulk operations API endpoints


  - Implement POST /api/admin/topics/bulk-delete endpoint
  - Implement POST /api/admin/topics/bulk-update endpoint
  - Implement POST /api/admin/topics/export endpoint
  - Implement POST /api/admin/topics/import endpoint
  - Add validation for bulk operations
  - Add role-based access control (ADMIN, EDITOR)
  - _Requirements: 10.2, 10.3, 10.4, 10.7, 10.8_

- [x] 12.2 Create bulk operations UI


  - Build BulkSelector component with checkboxes
  - Create BulkActions dropdown component
  - Build BulkProgress component for operation status
  - Add bulk selection to topics list page
  - Add confirmation dialogs for destructive operations
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 13. Enhanced topic CRUD operations




- [x] 13.1 Improve topic deletion


  - Update delete endpoint to properly cascade delete all related records
  - Add confirmation dialog with impact summary
  - Implement proper error handling
  - Add audit logging for deletions
  - _Requirements: 1.5, 1.6, 1.7_


- [x] 13.2 Enhance topic creation and editing

  - Improve form validation with better error messages
  - Add auto-save draft functionality
  - Add preview mode before publishing
  - Improve rich text editor toolbar
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.8_

- [ ] 14. Integration and cache revalidation
- [ ] 14.1 Implement cache revalidation for all CMS features
  - Add revalidateTag calls after settings updates
  - Add revalidateTag calls after page changes
  - Add revalidateTag calls after menu changes
  - Add revalidateTag calls after footer changes
  - _Requirements: 2.6, 3.4, 4.6, 5.7_

- [ ] 14.2 Update public site to use CMS data
  - Update Header to fetch menu from database
  - Update Footer to fetch footer from database
  - Add settings context provider for site-wide settings
  - Update SEO metadata to use settings
  - _Requirements: 2.3, 2.4, 4.8, 5.8_


- [ ] 15. Error handling and validation
- [ ] 15.1 Create custom error classes
  - Implement CMSError base class
  - Create ValidationError, NotFoundError, UnauthorizedError, ForbiddenError, DuplicateError classes
  - Create handleAPIError utility function
  - _Requirements: 1.7, 3.8, 6.7_

- [ ] 15.2 Add comprehensive error handling to all API routes
  - Wrap all route handlers with try-catch
  - Return appropriate HTTP status codes
  - Log errors for debugging
  - _Requirements: 1.7, 2.7, 3.8, 6.7_

- [ ] 15.3 Add client-side error handling
  - Display user-friendly error messages with toast notifications
  - Add form validation error display
  - Handle network errors gracefully
  - _Requirements: 1.7, 2.7, 3.8_

- [ ] 16. Security hardening
- [ ] 16.1 Implement HTML sanitization
  - Add DOMPurify for sanitizing rich text content
  - Sanitize all user-generated HTML before rendering
  - Add CSP headers for XSS protection
  - _Requirements: 3.9_

- [ ] 16.2 Implement file upload security
  - Validate file MIME types on server
  - Rename uploaded files to prevent path traversal
  - Generate unique filenames
  - Add file size limits
  - _Requirements: 6.2, 6.7_

- [ ] 16.3 Add rate limiting to API endpoints
  - Implement rate limiting middleware
  - Apply to authentication endpoints
  - Apply to file upload endpoints
  - _Requirements: 7.2_

- [ ]* 17. Testing
- [ ]* 17.1 Write unit tests for services
  - Test settings service
  - Test page service
  - Test menu service
  - Test footer service
  - Test media service
  - Test user service
  - Test audit service
  - _Requirements: All requirements_

- [ ]* 17.2 Write integration tests for API endpoints
  - Test settings endpoints
  - Test page endpoints
  - Test menu endpoints
  - Test footer endpoints
  - Test media endpoints
  - Test user endpoints
  - Test audit log endpoints
  - Test cache endpoints
  - Test bulk operations endpoints
  - _Requirements: All requirements_

- [ ]* 17.3 Write E2E tests for critical workflows
  - Test admin login flow
  - Test page creation and publishing workflow
  - Test menu management workflow
  - Test media upload and deletion workflow
  - Test user management workflow
  - _Requirements: All requirements_


- [ ] 18. Documentation and polish
- [ ] 18.1 Update documentation
  - Document new database schema
  - Document API endpoints
  - Create admin user guide
  - Update README with new features
  - _Requirements: All requirements_

- [ ] 18.2 Add loading states and skeletons
  - Add loading skeletons to all list views
  - Add loading indicators to forms
  - Add progress indicators for bulk operations
  - _Requirements: All requirements_

- [ ] 18.3 Improve responsive design
  - Ensure all admin pages work on mobile
  - Make sidebar collapsible on mobile
  - Optimize tables for small screens
  - _Requirements: All requirements_

- [ ] 18.4 Add success feedback
  - Add toast notifications for all successful operations
  - Add confirmation messages
  - Add visual feedback for state changes
  - _Requirements: All requirements_

- [ ] 19. Performance optimization
- [ ] 19.1 Optimize database queries
  - Add missing indexes
  - Implement cursor-based pagination
  - Use Prisma select to fetch only needed fields
  - Implement eager loading to avoid N+1 queries
  - _Requirements: All requirements_

- [ ] 19.2 Optimize frontend performance
  - Implement code splitting for admin routes
  - Add debouncing to search inputs
  - Implement virtual scrolling for large lists
  - Optimize image loading
  - _Requirements: All requirements_

- [ ] 19.3 Optimize file uploads
  - Implement image compression on upload
  - Generate optimized thumbnails
  - Add progress indicators for uploads
  - _Requirements: 6.2, 6.3_

- [ ] 20. Final integration and deployment preparation
- [ ] 20.1 Create migration guide
  - Document migration steps
  - Create backup procedures
  - Test migration on staging environment
  - _Requirements: All requirements_

- [ ] 20.2 Update environment variables
  - Document new environment variables
  - Update .env.example
  - Add validation for required variables
  - _Requirements: All requirements_

- [ ] 20.3 Final testing and verification
  - Run all tests
  - Verify all features work end-to-end
  - Check for security vulnerabilities
  - Verify performance benchmarks
  - _Requirements: All requirements_
