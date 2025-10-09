# CMS Docker Test Checklist

Quick reference for testing CMS API in Docker according to spec requirements.

## Pre-Test Setup

- [ ] Docker and Docker Compose installed
- [ ] `.env` file configured with all variables
- [ ] Database accessible (local or cloud)
- [ ] Port 3000 available

## Quick Test Commands

```cmd
REM Easy way - automated script
test-docker.cmd

REM Manual way
docker-compose up -d
timeout /t 10
node scripts/test/test-cms-api-docker.js

REM Test remote server
test-docker.cmd https://your-server.com
```

## Requirements Coverage

### ✅ Requirement 1: Homepage Display
**What to verify:**
- [ ] Homepage loads at `/` (not API message)
- [ ] HTML structure present
- [ ] Search bar visible
- [ ] Featured topics display (if data exists)

**Test command:**
```cmd
curl http://localhost:3000
```

**Expected:** HTML page with proper homepage content

---

### ✅ Requirement 2: API Data Fetching
**What to verify:**
- [ ] `/api/topics` returns 200
- [ ] Response is valid JSON
- [ ] Has `topics` array and `total` field
- [ ] Query parameters work (`?limit=5`, `?published=true`)

**Test commands:**
```cmd
curl http://localhost:3000/api/topics
curl http://localhost:3000/api/topics?limit=5
curl http://localhost:3000/api/topics?published=true
```

**Expected:** JSON with topics data

---

### ✅ Requirement 3: Admin Authentication
**What to verify:**
- [ ] `/admin` redirects when not authenticated
- [ ] `/admin/login` is accessible
- [ ] Login works with credentials
- [ ] Authenticated users can access dashboard

**Test commands:**
```cmd
REM Should redirect or return 401/302
curl -I http://localhost:3000/admin

REM Should return 200
curl -I http://localhost:3000/admin/login
```

**Expected:** Proper authentication flow

---

### ✅ Requirement 4: Admin Data Loading
**What to verify:**
- [ ] Dashboard fetches topics successfully
- [ ] Statistics are calculable (total, published, draft)
- [ ] Error handling works
- [ ] No crashes on data fetch

**Test:** Login to admin and check dashboard loads

---

## Manual Browser Tests

### Test 1: Homepage
1. Open: `http://localhost:3000`
2. Verify: Proper homepage (not "Q&A Article FAQ API")
3. Check: Search bar present
4. Check: Featured topics visible

### Test 2: API Endpoint
1. Open: `http://localhost:3000/api/topics`
2. Verify: JSON response
3. Check: Has `topics` and `total` fields

### Test 3: Admin Access
1. Open: `http://localhost:3000/admin`
2. Verify: Redirects to login
3. Login with credentials from `.env`
4. Verify: Dashboard loads with statistics

## Docker Commands Reference

```cmd
REM Build image
docker-compose build

REM Start container
docker-compose up -d

REM Check status
docker ps
docker logs qa-faq-app

REM Stop container
docker-compose down

REM Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d

REM View logs
docker logs -f qa-faq-app

REM Execute command in container
docker exec -it qa-faq-app sh
```

## Common Issues & Fixes

### Issue: Container won't start
```cmd
docker logs qa-faq-app
```
**Fix:** Check DATABASE_URL and environment variables

### Issue: Homepage shows API message
**Fix:** Delete `src/app/page.tsx` and rebuild
```cmd
del src\app\page.tsx
docker-compose build
docker-compose up -d
```

### Issue: API calls fail
**Fix:** Check NEXT_PUBLIC_API_URL in `.env`
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Issue: Database connection fails
**Fix:** Use `host.docker.internal` for local DB
```env
DATABASE_URL="postgresql://user:pass@host.docker.internal:5432/db"
```

### Issue: Tests timeout
**Fix:** Wait longer for container to start
```cmd
docker-compose up -d
timeout /t 20
node scripts/test/test-cms-api-docker.js
```

## Success Criteria

All these should be ✅:
- [ ] Container builds without errors
- [ ] Container starts and stays running
- [ ] Homepage displays correctly
- [ ] API returns valid data
- [ ] Admin authentication works
- [ ] No errors in container logs
- [ ] All automated tests pass

## Test Results Location

Results are saved to:
- Console output (immediate)
- Container logs: `docker logs qa-faq-app`
- Test script exit code (0 = pass, 1 = fail)

## Next Steps After Tests Pass

1. [ ] Tag Docker image
2. [ ] Push to registry
3. [ ] Deploy to server
4. [ ] Run tests against production
5. [ ] Monitor for issues

## Quick Verification

Run this one-liner to verify everything:
```cmd
test-docker.cmd && echo ✓ All CMS requirements verified!
```

## Spec Reference

Full requirements: `.kiro/specs/cms-fixes/requirements.md`
Design document: `.kiro/specs/cms-fixes/design.md`
Task list: `.kiro/specs/cms-fixes/tasks.md`
