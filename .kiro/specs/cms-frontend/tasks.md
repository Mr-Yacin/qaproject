  # Implementation Plan

- [x] 1. Project setup and dependencies





  - Install required dependencies: Tailwind CSS, shadcn/ui, NextAuth.js, Tiptap, React Hook Form, Zod
  - Configure Tailwind CSS with custom theme (colors, typography, breakpoints)
  - Set up shadcn/ui components library
  - Configure environment variables for admin authentication
  - _Requirements: All requirements depend on proper setup_

- [x] 2. Create shared UI components foundation




  - [x] 2.1 Install and configure shadcn/ui base components


    - Install button, input, card, dialog, accordion, dropdown-menu components
    - Create custom theme configuration in tailwind.config.js
    - _Requirements: 7.1, 7.2, 7.3, 8.1, 8.6_
  
  - [x] 2.2 Create typography and layout utilities


    - Create reusable typography classes (h1, h2, body, etc.)
    - Create container and spacing utility components
    - _Requirements: 8.1, 8.3_

- [x] 3. Implement API client layer






  - [x] 3.1 Create API client utilities

    - Create `lib/api/topics.ts` with getTopics() and getTopicBySlug() functions
    - Implement proper error handling with APIError class
    - Add TypeScript types for API responses
    - _Requirements: 1.2, 1.3_
  

  - [x] 3.2 Create admin API client functions

    - Create `lib/api/ingest.ts` with createOrUpdateTopic() function
    - Implement HMAC signature generation for authentication
    - Create revalidateCache() function for cache invalidation
    - _Requirements: 4.3, 4.5, 10.2_
  
  - [x] 3.3 Write unit tests for API client functions






    - Test successful API calls and error handling
    - Test signature generation
    - _Requirements: 3.1, 3.2_

- [x] 4. Build public layout and navigation






  - [x] 4.1 Create public layout component

    - Create `app/(public)/layout.tsx` with header and footer
    - Implement responsive container and max-width constraints
    - _Requirements: 1.1, 7.1, 7.2, 7.3_
  

  - [x] 4.2 Create Header component

    - Build responsive navigation with logo and menu
    - Implement hamburger menu for mobile (< 768px)
    - Add sticky header behavior on scroll
    - _Requirements: 1.4, 1.5, 1.6, 7.1, 8.4_
  

  - [x] 4.3 Create Footer component

    - Add footer with links and copyright
    - Make responsive for all screen sizes
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 5. Implement homepage




  - [x] 5.1 Create homepage with featured topics


    - Build `app/(public)/page.tsx` with hero section
    - Fetch and display featured topics using getTopics()
    - Add search bar component
    - _Requirements: 1.1, 9.1_
  
  - [x] 5.2 Create TopicCard component


    - Build card component with title, tags, and date
    - Implement hover effects and responsive grid layout
    - Make cards clickable linking to topic pages
    - _Requirements: 1.2, 7.1, 7.2, 7.3, 8.2, 8.3_

- [x] 6. Build topics listing page






  - [x] 6.1 Create topics listing page



    - Build `app/(public)/topics/page.tsx`
    - Fetch topics with getTopics() and display in grid
    - Implement pagination controls
    - _Requirements: 1.2, 7.1, 7.2, 7.3_
  
  - [x] 6.2 Add filtering functionality


    - Create TagFilter component for filtering by tags
    - Add locale filter dropdown
    - Implement URL query params for filters
    - _Requirements: 1.2, 9.5_

- [x] 7. Create individual topic page





  - [x] 7.1 Build topic detail page


    - Create `app/(public)/topics/[slug]/page.tsx`
    - Fetch topic data with getTopicBySlug()
    - Display topic title, main question, and article content
    - Implement responsive layout for mobile, tablet, desktop
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 7.1, 7.2, 7.3_
  
  - [x] 7.2 Create FAQAccordion component


    - Build accordion component for FAQ items
    - Implement expand/collapse functionality
    - Add smooth animations and keyboard navigation
    - Add ARIA attributes for accessibility
    - _Requirements: 1.3, 8.4_
  
  - [x] 7.3 Add "back to top" button


    - Create scroll-to-top button that appears on scroll
    - Make it mobile-friendly with proper touch target size
    - _Requirements: 1.8, 7.4_

- [x] 8. Implement SEO optimization






  - [x] 8.1 Add meta tags and Open Graph

    - Create `lib/utils/seo.ts` with generateTopicMetadata() function
    - Add metadata to topic pages with title, description, OG tags
    - Implement Twitter card tags
    - Add canonical URLs
    - _Requirements: 2.1, 2.4, 2.5, 2.6_
  


  - [x] 8.2 Add structured data (JSON-LD)





    - Create generateArticleSchema() function for Article schema
    - Create generateFAQSchema() function for FAQ schema
    - Add JSON-LD scripts to topic pages


    - _Requirements: 2.3_

  
  - [x] 8.3 Generate sitemap and robots.txt

    - Create `app/sitemap.ts` to generate sitemap.xml
    - Create `app/robots.ts` for robots.txt
    - Include all published topics in sitemap
    - _Requirements: 2.7, 2.8_

- [x] 9. Implement search functionality





  - [x] 9.1 Create SearchBar component


    - Build search input with debounced onChange
    - Add clear button and loading state
    - Implement keyboard shortcut (Cmd+K) to focus search
    - _Requirements: 9.1, 9.2_
  
  - [x] 9.2 Create search results page


    - Build `app/(public)/search/page.tsx`
    - Filter topics by search query
    - Display results with highlighted keywords
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 10. Set up authentication with NextAuth.js




  - [x] 10.1 Configure NextAuth.js


    - Create `lib/auth.ts` with NextAuth configuration
    - Set up CredentialsProvider with email/password
    - Configure session callbacks
    - _Requirements: 3.2, 3.3_
  
  - [x] 10.2 Create API route for NextAuth


    - Create `app/api/auth/[...nextauth]/route.ts`
    - Export GET and POST handlers
    - _Requirements: 3.2_
  
  - [x] 10.3 Create middleware for route protection


    - Create `middleware.ts` to protect /admin routes
    - Redirect unauthenticated users to login page
    - _Requirements: 3.5, 3.4_
  
  - [x] 10.4 Create login page


    - Build `app/admin/login/page.tsx` with login form
    - Implement form validation with React Hook Form and Zod
    - Display error messages for invalid credentials
    - Redirect to dashboard on successful login
    - _Requirements: 3.1, 3.2, 3.3, 8.6, 8.7_

- [x] 11. Build admin dashboard layout





  - [x] 11.1 Create admin layout component


    - Create `app/admin/layout.tsx` with sidebar and main content area
    - Implement responsive layout (collapsible sidebar on mobile)
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 11.2 Create Sidebar component


    - Build navigation sidebar with links to dashboard sections
    - Add active state highlighting for current route
    - Add user profile section with logout button
    - Make collapsible on mobile and tablet
    - _Requirements: 3.6, 8.2, 8.3_
  
  - [x] 11.3 Create dashboard home page


    - Build `app/admin/page.tsx` with overview stats
    - Display total topics, drafts, published count
    - Add quick action buttons
    - _Requirements: 8.1, 8.3, 8.5_

- [x] 12. Implement topics management list




  - [x] 12.1 Create topics management page


    - Build `app/admin/topics/page.tsx`
    - Fetch and display all topics in a table/list
    - Add search and filter functionality
    - Add "Create New Topic" button
    - _Requirements: 4.1, 4.2_
  
  - [x] 12.2 Add delete functionality

    - Add delete button for each topic with confirmation dialog
    - Implement delete via API (may need to create delete endpoint or use ingest)
    - Show success/error messages
    - _Requirements: 4.6, 4.7, 8.7, 8.8_

- [x] 13. Create topic form for create/edit




  - [x] 13.1 Build topic form component


    - Create `components/admin/TopicForm.tsx`
    - Add form fields: slug, title, locale, tags
    - Implement auto-generate slug from title
    - Add form validation with React Hook Form and Zod
    - _Requirements: 4.3, 4.4, 4.5, 4.8, 8.6_
  
  - [x] 13.2 Create new topic page


    - Build `app/admin/topics/new/page.tsx`
    - Render TopicForm in create mode
    - Handle form submission with createOrUpdateTopic()
    - Show success message and redirect to topics list
    - _Requirements: 4.2, 4.3, 8.8_
  
  - [x] 13.3 Create edit topic page


    - Build `app/admin/topics/[slug]/edit/page.tsx`
    - Fetch existing topic data with getTopicBySlug()
    - Render TopicForm in edit mode with pre-filled data
    - Handle form submission with createOrUpdateTopic()
    - _Requirements: 4.4, 4.5, 8.8_

- [x] 14. Implement rich text editor for articles




  - [x] 14.1 Create RichTextEditor component


    - Install and configure Tiptap or React-Quill
    - Create `components/admin/RichTextEditor.tsx`
    - Add formatting toolbar (bold, italic, headings, lists, links)
    - Support markdown mode toggle
    - _Requirements: 5.1, 5.2, 5.7_
  
  - [x] 14.2 Integrate editor into TopicForm


    - Add article content field using RichTextEditor
    - Add article status dropdown (Draft/Published)
    - Add preview mode to show formatted content
    - _Requirements: 5.1, 5.4, 5.5, 5.6_
  
  - [x] 14.3 Add image upload support


    - Implement image upload functionality (may need to add upload endpoint)
    - Add image embedding in editor
    - _Requirements: 5.8_

- [ ] 15. Build FAQ manager component
  - [ ] 15.1 Create FAQManager component
    - Create `components/admin/FAQManager.tsx`
    - Display list of FAQ items with add/edit/delete buttons
    - Implement inline editing for question and answer fields
    - Add confirmation dialog for delete
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6_
  
  - [ ] 15.2 Add drag-and-drop reordering
    - Install and configure drag-and-drop library (dnd-kit or react-beautiful-dnd)
    - Implement drag-and-drop to reorder FAQ items
    - Update order field on drop
    - _Requirements: 6.4_
  
  - [ ] 15.3 Integrate FAQManager into TopicForm
    - Add FAQ section to TopicForm
    - Handle FAQ items in form submission
    - _Requirements: 6.7_

- [ ] 16. Implement cache revalidation
  - [ ] 16.1 Add revalidation after content updates
    - Call revalidateCache() after successful topic create/update
    - Revalidate 'topics' tag and specific 'topic:[slug]' tag
    - Show loading state during revalidation
    - _Requirements: 10.2_

- [ ] 17. Add responsive design polish
  - [ ] 17.1 Test and refine mobile layout
    - Test all pages on mobile devices (< 768px)
    - Ensure hamburger menu works properly
    - Verify touch targets are at least 44x44 pixels
    - Test form inputs on mobile
    - _Requirements: 1.4, 7.1, 7.4, 7.5, 7.8_
  
  - [ ] 17.2 Test and refine tablet layout
    - Test all pages on tablet (768px - 1024px)
    - Verify adaptive navigation and layouts
    - Test device rotation
    - _Requirements: 1.5, 7.2, 7.6, 7.7_
  
  - [ ] 17.3 Test and refine desktop layout
    - Test all pages on desktop (> 1024px)
    - Verify full navigation and sidebar layouts
    - Test hover effects and transitions
    - _Requirements: 1.6, 7.3, 8.2, 8.4_

- [ ] 18. Performance optimization
  - [ ] 18.1 Optimize images
    - Replace <img> tags with Next.js <Image> component
    - Configure image domains in next.config.js
    - Add lazy loading for below-the-fold images
    - _Requirements: 10.1, 10.5_
  
  - [ ] 18.2 Implement code splitting
    - Use dynamic imports for heavy components (RichTextEditor, FAQManager)
    - Verify route-based code splitting is working
    - _Requirements: 10.3, 10.4, 10.6_
  
  - [ ] 18.3 Configure caching strategy
    - Set up ISR for topic pages with revalidation
    - Configure fetch cache tags for topics
    - Test cache revalidation flow
    - _Requirements: 10.1, 10.2, 10.7_

- [ ] 19. Accessibility improvements
  - [ ] 19.1 Add ARIA labels and semantic HTML
    - Review all components for semantic HTML usage
    - Add ARIA labels to interactive elements
    - Ensure proper heading hierarchy
    - _Requirements: All requirements benefit from accessibility_
  
  - [ ] 19.2 Implement keyboard navigation
    - Test tab navigation through all interactive elements
    - Add focus styles to all focusable elements
    - Implement keyboard shortcuts where appropriate
    - _Requirements: All requirements benefit from accessibility_
  
  - [ ] 19.3 Test with screen readers
    - Test public pages with screen reader
    - Test admin dashboard with screen reader
    - Fix any accessibility issues found
    - _Requirements: All requirements benefit from accessibility_

- [ ] 20. Final integration and testing
  - [ ] 20.1 End-to-end testing of public pages
    - Test homepage, topics listing, and topic detail pages
    - Verify SEO meta tags and structured data
    - Test search functionality
    - Test on multiple devices and browsers
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 9.1, 9.2_
  
  - [ ] 20.2 End-to-end testing of admin dashboard
    - Test login flow
    - Test creating a new topic with article and FAQs
    - Test editing an existing topic
    - Test deleting a topic
    - Verify cache revalidation works
    - _Requirements: 3.1, 3.2, 4.3, 4.5, 4.7, 6.7, 10.2_
  
  - [ ] 20.3 Performance testing
    - Run Lighthouse audit on public pages
    - Verify performance score is at least 90
    - Test page load times on 3G connection
    - _Requirements: 10.3, 10.7_
