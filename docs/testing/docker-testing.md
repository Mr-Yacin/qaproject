# Docker Testing Guide

This guide helps you test all CMS functionality in Docker according to the spec requirements.

## Prerequisites

1. Docker and Docker Compose installed
2. `.env` file configured with all required variables
3. Database accessible from Docker container

## Quick Start

### Option 1: Test Running Docker Container

If your Docker container is already running:

```cmd
node scripts/test/test-cms-api-docker.js
```

### Option 2: Build and Test Fresh Container

```cmd
docker-compose build
docker-compose up -d
timeout /t 10
node scripts/test/test-cms-api-docker.js
```

### Option 3: Test Against Remote Server

```cmd
set TEST_URL=https://your-server.com
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

## Manual Testing Steps

### 1. Build Docker Image

```cmd
docker-compose build
```

This will:
- Install dependencies
- Generate Prisma client
- Build Next.js application
- Create production image

### 2. Start Container

```cmd
docker-compose up -d
```

Wait 10-15 seconds for the container to fully start.

### 3. Check Container Status

```cmd
docker ps
docker logs qa-faq-app
```

You should see:
```
▲ Next.js 14.x.x
- Local:        http://0.0.0.0:3000
✓ Ready in Xms
```

### 4. Run Automated Tests

```cmd
node scripts/test/test-cms-api-docker.js
```

### 5. Manual Browser Testing

Open your browser and test:

#### Homepage Test
- Visit: `http://localhost:3000`
- ✅ Should see proper homepage with hero section
- ✅ Should see search bar
- ✅ Should see featured topics (if data exists)
- ❌ Should NOT see "Q&A Article FAQ API" message

#### API Test
- Visit: `http://localhost:3000/api/topics`
- ✅ Should return JSON with topics array
- ✅ Should have `total` and `topics` fields

#### Admin Authentication Test
- Visit: `http://localhost:3000/admin`
- ✅ Should redirect to `/admin/login`
- Login with credentials from `.env`
- ✅ Should redirect to admin dashboard
- ✅ Dashboard should show statistics

## Troubleshooting

### Container Won't Start

```cmd
docker logs qa-faq-app
```

Common issues:
- **Database connection failed**: Check `DATABASE_URL` in `.env`
- **Port already in use**: Stop other services on port 3000
- **Build errors**: Check Dockerfile and dependencies

### Tests Fail with Connection Error

```cmd
REM Check if container is running
docker ps

REM Check container logs
docker logs qa-faq-app

REM Restart container
docker-compose restart
```

### Homepage Shows API Message

This means the old `src/app/page.tsx` still exists:
```cmd
REM Verify file is deleted
dir src\app\page.tsx
```

If it exists, delete it and rebuild:
```cmd
del src\app\page.tsx
docker-compose build
docker-compose up -d
```

### API Calls Fail During Build

Check that `NEXT_PUBLIC_API_URL` is set in `.env`:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

For Docker, you might need:
```
NEXT_PUBLIC_API_URL=http://app:3000
```

### Database Connection Issues

Verify your `DATABASE_URL`:
- For local database: Use `host.docker.internal` instead of `localhost`
- For cloud database (Neon, etc.): Use full connection string with SSL

Example:
```
DATABASE_URL="postgresql://user:pass@host.docker.internal:5432/db?schema=public"
```

## Environment Variables for Docker

Create a `.env` file with:

```env
# Database - Use host.docker.internal for local DB
DATABASE_URL="postgresql://user:password@host.docker.internal:5432/qa_article_faq?schema=public"

# API URL - Use container name for internal calls
NEXT_PUBLIC_API_URL="http://localhost:3000"

# Security
INGEST_API_KEY="your-api-key-here"
INGEST_WEBHOOK_SECRET="your-webhook-secret-here"
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Admin Credentials
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="your-secure-admin-password"
```

## Advanced Testing

### Test with Different Environments

```cmd
REM Test local
set TEST_URL=http://localhost:3000
node scripts/test/test-cms-api-docker.js

REM Test staging
set TEST_URL=https://staging.yoursite.com
node scripts/test/test-cms-api-docker.js

REM Test production
set TEST_URL=https://yoursite.com
node scripts/test/test-cms-api-docker.js
```

### Run Tests Inside Container

```cmd
docker exec -it qa-faq-app sh
cd /app
node scripts/test/test-cms-api-docker.js
```

### Check Build Output

```cmd
docker-compose build --no-cache
```

Look for:
- ✅ Prisma client generated
- ✅ Next.js build successful
- ✅ No fetch errors during build
- ✅ All pages compiled

## Performance Testing

### Check Response Times

```cmd
REM Homepage
curl -w "@curl-format.txt" -o NUL -s http://localhost:3000

REM API
curl -w "@curl-format.txt" -o NUL -s http://localhost:3000/api/topics
```

Create `curl-format.txt`:
```
time_total: %{time_total}s
```

### Load Testing

Use Apache Bench (if installed):
```cmd
ab -n 100 -c 10 http://localhost:3000/
ab -n 100 -c 10 http://localhost:3000/api/topics
```

## Cleanup

```cmd
REM Stop container
docker-compose down

REM Remove container and image
docker-compose down --rmi all

REM Remove volumes (careful - deletes data!)
docker-compose down -v
```

## Success Criteria

All tests should pass:
- ✅ Homepage displays correctly
- ✅ API endpoints return valid data
- ✅ Admin authentication works
- ✅ No console errors
- ✅ Build completes without errors
- ✅ Container runs stably

## Next Steps

After all tests pass:
1. Tag the Docker image for deployment
2. Push to container registry
3. Deploy to production
4. Run tests against production URL
5. Monitor logs for any issues

## Related Documentation

- [Unit Testing Guide](./unit-testing.md)
- [E2E Testing Guide](./e2e-testing.md)
- [Manual Testing Guide](./manual-testing.md)
