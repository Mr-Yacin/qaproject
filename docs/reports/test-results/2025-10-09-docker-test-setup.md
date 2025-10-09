# CMS Docker Test Setup - Complete ✓

## Summary

I've created a comprehensive testing suite to verify all CMS API functionality in Docker according to the spec requirements in `.kiro/specs/cms-fixes/requirements.md`.

## What Was Created

### 1. Main Test Script
**File:** `scripts/test/test-cms-api-docker.js`
- Automated test suite covering all 4 requirements
- Tests homepage, API endpoints, authentication, and data loading
- Provides detailed pass/fail results
- Exit code 0 for success, 1 for failure

### 2. Test Runner Script
**File:** `test-docker.cmd`
- Easy-to-use Windows batch script
- Checks Docker container status
- Runs tests automatically
- Shows container logs if tests fail

### 3. Comprehensive Guide
**File:** `DOCKER_CMS_TEST_GUIDE.md`
- Complete testing instructions
- Troubleshooting guide
- Manual testing steps
- Environment configuration help

### 4. Quick Reference
**File:** `test-results/cms-docker-test-checklist.md`
- Quick command reference
- Requirements checklist
- Common issues and fixes
- Success criteria

### 5. NPM Scripts
**Updated:** `package.json`
- `npm run test:cms` - Run CMS tests
- `npm run docker:test` - Start container and test
- `npm run docker:build` - Build Docker image
- `npm run docker:up` - Start container
- `npm run docker:down` - Stop container

## How to Use

### Quick Start (Easiest)

```cmd
test-docker.cmd
```

This will:
1. Check if Docker container is running
2. Start it if needed
3. Run all tests
4. Show results

### Using NPM Scripts

```cmd
REM Start container and run tests
npm run docker:test

REM Just run tests (container must be running)
npm run test:cms
```

### Manual Steps

```cmd
REM 1. Build Docker image
docker-compose build

REM 2. Start container
docker-compose up -d

REM 3. Wait for startup
timeout /t 10

REM 4. Run tests
node scripts/test/test-cms-api-docker.js
```

## What Gets Tested

### ✅ Requirement 1: Homepage Display
- Homepage loads successfully (not API message)
- Proper HTML structure
- Search functionality present
- Featured topics display

### ✅ Requirement 2: API Data Fetching
- API endpoints respond correctly
- Valid JSON responses
- Proper data structure
- Query parameters work
- Absolute URLs function in SSR

### ✅ Requirement 3: Admin Authentication
- Unauthenticated access blocked
- Login page accessible
- NextAuth endpoints working
- Proper redirects

### ✅ Requirement 4: Admin Data Loading
- Topics data fetches successfully
- Statistics calculable
- Error handling works

## Test Output Example

```
╔════════════════════════════════════════════════════════════╗
║     CMS API Comprehensive Test Suite - Docker Environment  ║
╚════════════════════════════════════════════════════════════╝

Testing against: http://localhost:3000

📋 Testing Requirement 1: Homepage Display

✓ PASS Homepage loads successfully
  Status: 200
✓ PASS Homepage does NOT display basic API message
  Correct homepage content
✓ PASS Homepage contains proper HTML structure
  HTML structure found
✓ PASS Homepage includes search functionality
  Search elements found

📋 Testing Requirement 2: API Data Fetching

✓ PASS API topics endpoint responds successfully
  Status: 200
✓ PASS API returns valid JSON response
  JSON parsed successfully
✓ PASS API response has proper data structure
  Found 5 topics, total: 5

[... more tests ...]

╔════════════════════════════════════════════════════════════╗
║                      TEST SUMMARY                           ║
╚════════════════════════════════════════════════════════════╝

Total Tests: 18
Passed: 18
Failed: 0
Success Rate: 100.00%
```

## Before Running Tests

### 1. Ensure .env File is Configured

```env
# Database
DATABASE_URL="postgresql://user:password@host.docker.internal:5432/qa_article_faq?schema=public"

# API
NEXT_PUBLIC_API_URL="http://localhost:3000"

# Security
INGEST_API_KEY="your-api-key-here"
INGEST_WEBHOOK_SECRET="your-webhook-secret-here"
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Admin
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="your-secure-admin-password"
```

### 2. Database Must Be Accessible

For local PostgreSQL:
- Use `host.docker.internal` instead of `localhost` in DATABASE_URL
- Ensure PostgreSQL is running
- Database should exist and be migrated

For cloud database (Neon, etc.):
- Use full connection string with SSL
- Ensure network access from Docker

### 3. Port 3000 Must Be Available

```cmd
REM Check if port is in use
netstat -ano | findstr :3000
```

## Testing Remote Servers

```cmd
REM Test staging
test-docker.cmd https://staging.yoursite.com

REM Test production
test-docker.cmd https://yoursite.com

REM Or set environment variable
set TEST_URL=https://your-server.com
npm run test:cms
```

## Troubleshooting

### Container Won't Start
```cmd
docker logs qa-faq-app
```
Check for database connection errors or missing environment variables.

### Tests Fail
1. Check container logs: `docker logs qa-faq-app`
2. Verify .env file has all variables
3. Ensure database is accessible
4. Check port 3000 is available
5. See `DOCKER_CMS_TEST_GUIDE.md` for detailed troubleshooting

### Homepage Shows API Message
The old `src/app/page.tsx` file still exists. Delete it:
```cmd
del src\app\page.tsx
docker-compose build
docker-compose up -d
```

## Success Criteria

All tests should pass:
- ✅ 18/18 tests passing
- ✅ Container running stably
- ✅ No errors in logs
- ✅ Homepage displays correctly
- ✅ API returns valid data
- ✅ Admin authentication works

## Next Steps

1. **Run the tests:**
   ```cmd
   test-docker.cmd
   ```

2. **If tests pass:**
   - Your CMS is working correctly per spec requirements
   - Ready for deployment
   - Can tag and push Docker image

3. **If tests fail:**
   - Check the output for specific failures
   - Review `DOCKER_CMS_TEST_GUIDE.md` for troubleshooting
   - Fix issues and re-run tests

4. **Deploy to server:**
   - Push Docker image to registry
   - Deploy to production
   - Run tests against production URL

## Files Reference

- **Test Script:** `scripts/test/test-cms-api-docker.js`
- **Runner:** `test-docker.cmd`
- **Guide:** `DOCKER_CMS_TEST_GUIDE.md`
- **Checklist:** `test-results/cms-docker-test-checklist.md`
- **Spec Requirements:** `.kiro/specs/cms-fixes/requirements.md`
- **Spec Design:** `.kiro/specs/cms-fixes/design.md`
- **Spec Tasks:** `.kiro/specs/cms-fixes/tasks.md`

## Quick Commands Reference

```cmd
REM Run all tests (easiest)
test-docker.cmd

REM Build and start
docker-compose build
docker-compose up -d

REM Run tests
npm run test:cms

REM Check status
docker ps
docker logs qa-faq-app

REM Stop
docker-compose down

REM Full rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
npm run test:cms
```

---

**Ready to test!** Run `test-docker.cmd` to verify all CMS functionality. 🚀
