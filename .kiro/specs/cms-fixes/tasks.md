# Implementation Plan

- [x] 1. Remove conflicting root page





  - Delete the `src/app/page.tsx` file that displays "Q&A Article FAQ API"
  - This allows the `src/app/(public)/page.tsx` to serve as the homepage
  - _Requirements: 1.1, 1.2_

- [x] 2. Add base URL helper function to API client





  - Add `getBaseUrl()` function to `src/lib/api/topics.ts` that detects environment (browser vs server)
  - Function should return empty string for browser, check environment variables for server
  - Handle NEXT_PUBLIC_API_URL, VERCEL_URL, and localhost fallback
  - _Requirements: 2.1, 2.2_

- [x] 3. Update getTopics function to use absolute URLs





  - Modify `getTopics()` in `src/lib/api/topics.ts` to call `getBaseUrl()` and prepend to API path
  - Update fetch URL construction to use `${baseUrl}/api/topics`
  - Ensure query parameters are still properly appended
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 4. Update getTopicBySlug function to use absolute URLs





  - Modify `getTopicBySlug()` in `src/lib/api/topics.ts` to call `getBaseUrl()` and prepend to API path
  - Update fetch URL construction to use `${baseUrl}/api/topics/${slug}`
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 5. Add environment variable configuration





  - Update `.env.example` to include `NEXT_PUBLIC_API_URL=http://localhost:3000`
  - Update `.env` file with the same variable for local development
  - _Requirements: 2.1, 2.2_

- [x] 6. Verify admin authentication middleware





  - Review `middleware.ts` configuration to ensure it's properly protecting admin routes
  - Confirm matcher pattern includes all admin paths
  - Ensure signIn page is correctly configured
  - _Requirements: 3.1, 3.2, 3.4_

- [x] 7. Test homepage display





  - Start development server and navigate to root URL
  - Verify proper homepage with hero section, search bar, and featured topics displays
  - Check browser console for any fetch errors
  - Verify topics load correctly if database has data
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.3, 2.4_

- [x] 8. Test admin authentication flow





  - Attempt to access `/admin` without authentication
  - Verify redirect to `/admin/login` occurs
  - Login with valid credentials
  - Verify successful redirect to admin dashboard
  - Check that dashboard statistics load without errors
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_
