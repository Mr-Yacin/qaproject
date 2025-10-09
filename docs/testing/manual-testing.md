# Manual Testing Guide

## Overview

This guide provides step-by-step instructions for manually testing the CMS functionality. Use this guide to verify features work correctly before deployment or after making changes.

## Quick Start Testing

### Prerequisites

1. Development server running: `npm run dev`
2. Database populated with test data
3. Environment variables configured

### Quick Test Command

```cmd
test-docker.cmd
```

This automated script will:
1. ✅ Check if Docker container is running
2. ✅ Start it if needed
3. ✅ Run all CMS tests from spec requirements
4. ✅ Show you the results

### Expected Output

```
╔════════════════════════════════════════════════════════════╗
║          CMS API Docker Test Runner                        ║
╚════════════════════════════════════════════════════════════╝

Testing against: http://localhost:3000 (default)

[1/4] Checking Docker container status...
✓ Container is running

[2/4] Checking container health...
✓ Container is ready

[3/4] Running CMS API tests...

📋 Testing Requirement 1: Homepage Display
✓ PASS Homepage loads successfully
✓ PASS Homepage does NOT display basic API message
✓ PASS Homepage contains proper HTML structure
✓ PASS Homepage includes search functionality

📋 Testing Requirement 2: API Data Fetching
✓ PASS API topics endpoint responds successfully
✓ PASS API returns valid JSON response
✓ PASS API response has proper data structure

📋 Testing Requirement 3: Admin Authentication
✓ PASS Unauthenticated admin access is blocked
✓ PASS Admin login page is accessible
✓ PASS NextAuth API endpoint is accessible

📋 Testing Requirement 4: Admin Data Loading
✓ PASS Admin can fetch topics data
✓ PASS Topic statistics are available

[4/4] All tests passed! ✓

════════════════════════════════════════════════════════════
✓ CMS API is working correctly according to spec requirements
════════════════════════════════════════════════════════════
```

## Homepage Testing

### Test Checklist

Visit: `http://localhost:3000`

#### Visual Elements
- [ ] Hero section displays with "Welcome to Q&A CMS" heading
- [ ] Search bar is visible with "Search for topics..." placeholder
- [ ] Featured topics section is present
- [ ] Layout is responsive (test on different screen sizes)
- [ ] No "Q&A Article FAQ API" message appears

#### Functionality
- [ ] Search bar accepts input
- [ ] Featured topics load (if data exists)
- [ ] Empty state message shows when no topics exist
- [ ] Links to topic pages work
- [ ] Navigation menu functions correctly

#### Browser Console
- [ ] No JavaScript errors
- [ ] No 404 errors for resources
- [ ] No fetch errors

### Automated Test Script

```bash
node scripts/test/test-homepage.js
```

Expected output:
```
🧪 Testing Homepage Display
==================================================

✓ Test 1: Homepage loads at root URL
  ✓ Status: 200

✓ Test 2: Verify homepage content
  ✓ Hero section present
  ✓ Search bar present
  ✓ Featured topics section present

✓ Test 3: API endpoint responds
  ✓ API Status: 200
  ✓ Topics found: X
  ✓ Total topics: X

✓ Test 4: Verify old API message is not displayed
  ✓ Old API message not present

==================================================
✅ All tests passed!
```

## Topics Listing Testing

### Test Checklist

Visit: `http://localhost:3000/topics`

#### Display
- [ ] All published topics are listed
- [ ] Topic cards show title and description
- [ ] Tags are displayed for each topic
- [ ] Locale indicator is visible

#### Filtering
- [ ] Tag filter works correctly
- [ ] Locale filter functions properly
- [ ] Multiple filters can be combined
- [ ] Clear filters button works

#### Pagination
- [ ] Topics are paginated if many exist
- [ ] Page navigation works
- [ ] Correct number of topics per page

## Topic Detail Page Testing

### Test Checklist

Visit: `http://localhost:3000/topics/[slug]`

#### Content Display
- [ ] Topic title displays correctly
- [ ] Main question is shown
- [ ] Article content renders properly
- [ ] FAQ items are listed
- [ ] Tags are displayed
- [ ] Locale is indicated

#### SEO Elements
- [ ] Page title is correct
- [ ] Meta description is present
- [ ] Open Graph tags exist
- [ ] Twitter Card tags exist
- [ ] Canonical URL is set
- [ ] Structured data (JSON-LD) is present

#### Functionality
- [ ] FAQ items are expandable/collapsible
- [ ] Links within content work
- [ ] Back navigation functions
- [ ] Related topics show (if implemented)

## Search Functionality Testing

### Test Checklist

Visit: `http://localhost:3000/search`

#### Search Input
- [ ] Search bar accepts input
- [ ] Search triggers on submit
- [ ] Search works with Enter key
- [ ] Clear search button works

#### Results Display
- [ ] Results show for valid queries
- [ ] No results message appears when appropriate
- [ ] Results are relevant to query
- [ ] Result cards link to correct topics

#### Edge Cases
- [ ] Empty search handled gracefully
- [ ] Special characters don't break search
- [ ] Very long queries are handled
- [ ] Search with no results shows helpful message

## Admin Dashboard Testing

### Login Testing

Visit: `http://localhost:3000/admin`

#### Authentication
- [ ] Redirects to login page when not authenticated
- [ ] Login form displays correctly
- [ ] Email and password fields work
- [ ] Invalid credentials show error message
- [ ] Valid credentials log in successfully
- [ ] Redirects to dashboard after login

### Dashboard Testing

Visit: `http://localhost:3000/admin/dashboard`

#### Display
- [ ] Statistics cards show correct numbers
- [ ] Recent topics list displays
- [ ] Charts/graphs render (if implemented)
- [ ] Navigation sidebar is present

#### Navigation
- [ ] All menu items are clickable
- [ ] Active page is highlighted
- [ ] Logout button works

### Topic Management Testing

Visit: `http://localhost:3000/admin/topics`

#### List View
- [ ] All topics are listed
- [ ] Search/filter works
- [ ] Sort options function
- [ ] Pagination works

#### Create Topic
- [ ] Create button opens form
- [ ] All fields are present
- [ ] Validation works on required fields
- [ ] Slug auto-generates from title
- [ ] Submit creates new topic
- [ ] Success message appears

#### Edit Topic
- [ ] Edit button opens form with existing data
- [ ] All fields are editable
- [ ] Changes save correctly
- [ ] Success message appears

#### Delete Topic
- [ ] Delete button shows confirmation dialog
- [ ] Cancel keeps topic
- [ ] Confirm deletes topic
- [ ] Related data is deleted (cascade)
- [ ] Success message appears

### FAQ Management Testing

#### Create FAQ
- [ ] Add FAQ button works
- [ ] Question and answer fields present
- [ ] Order can be set
- [ ] Submit creates FAQ item

#### Edit FAQ
- [ ] Edit button opens form
- [ ] Changes save correctly
- [ ] Order can be changed

#### Delete FAQ
- [ ] Delete button shows confirmation
- [ ] Confirm deletes FAQ item

#### Reorder FAQ
- [ ] Drag and drop works (if implemented)
- [ ] Order numbers can be edited
- [ ] Order persists after save

## API Testing

### Topics API

```bash
# Get all topics
curl http://localhost:3000/api/topics

# Get topics with filters
curl "http://localhost:3000/api/topics?locale=en&tag=test"

# Get single topic
curl http://localhost:3000/api/topics/[slug]
```

#### Checklist
- [ ] Returns valid JSON
- [ ] Has correct structure (total, topics)
- [ ] Filters work correctly
- [ ] Pagination works
- [ ] Error handling for invalid requests

### Ingest API

```bash
# Test with authentication
node scripts/test/test-cms-api-docker.js
```

#### Checklist
- [ ] Requires authentication
- [ ] Rejects invalid signatures
- [ ] Accepts valid payloads
- [ ] Creates/updates topics correctly
- [ ] Returns appropriate status codes

### Revalidate API

```bash
# Test cache revalidation
node scripts/test/test-cache-revalidation.js
```

#### Checklist
- [ ] Requires authentication
- [ ] Revalidates specific paths
- [ ] Revalidates all paths when requested
- [ ] Returns success status

## Performance Testing

### Lighthouse Test

```bash
node scripts/performance/lighthouse-performance-test.js
```

#### Metrics to Check
- [ ] Performance score > 90
- [ ] First Contentful Paint < 1.8s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3.8s
- [ ] Cumulative Layout Shift < 0.1

### Load Testing

```bash
node scripts/performance/simple-performance-test.js
```

#### Metrics to Check
- [ ] Average response time < 200ms
- [ ] 95th percentile < 500ms
- [ ] No errors under load
- [ ] Memory usage stable

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab key navigates through interactive elements
- [ ] Enter/Space activates buttons and links
- [ ] Escape closes modals/dialogs
- [ ] Arrow keys work in lists/menus
- [ ] Focus indicators are visible

### Screen Reader Testing
- [ ] Page structure is logical
- [ ] Headings are hierarchical
- [ ] Images have alt text
- [ ] Forms have labels
- [ ] ARIA labels are present where needed

### Visual Testing
- [ ] Color contrast meets WCAG AA standards
- [ ] Text is readable at 200% zoom
- [ ] No information conveyed by color alone
- [ ] Focus indicators are visible

## Responsive Design Testing

### Breakpoints to Test
- [ ] Mobile (320px - 767px)
- [ ] Tablet (768px - 1023px)
- [ ] Desktop (1024px+)

### Elements to Check
- [ ] Navigation adapts to screen size
- [ ] Images scale appropriately
- [ ] Text remains readable
- [ ] Buttons are touch-friendly on mobile
- [ ] No horizontal scrolling

## Browser Compatibility Testing

### Browsers to Test
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Test Remote Server

```cmd
test-docker.cmd https://your-server.com
```

Or manually:
```cmd
set TEST_URL=https://your-server.com
node scripts/test/test-cms-api-docker.js
```

## Troubleshooting

### Development Server Issues

If tests fail, check:
1. Server is running: `npm run dev`
2. Database is accessible
3. Environment variables are set
4. No port conflicts

### Cache Issues

If changes don't appear:
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Clear Next.js cache: Delete `.next` folder
4. Restart development server

### Database Issues

If data doesn't persist:
1. Check database connection
2. Verify migrations are applied
3. Check Prisma schema
4. Review database logs

## Related Documentation

- [Unit Testing Guide](./unit-testing.md)
- [E2E Testing Guide](./e2e-testing.md)
- [Docker Testing Guide](./docker-testing.md)
