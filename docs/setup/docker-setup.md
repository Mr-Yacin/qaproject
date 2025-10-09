# Docker Setup and Testing Guide

This guide covers Docker setup, configuration, and testing for the Q&A Article FAQ API.

## Prerequisites

- Docker installed
- Docker Compose installed
- `.env` file configured with all required variables

## Quick Start

### Build and Run

```bash
# Build the Docker image
docker-compose build

# Start the container
docker-compose up -d

# Check container status
docker ps

# View logs
docker logs qa-faq-app
```

The application will be available at `http://localhost:3000`

### Stop and Remove

```bash
# Stop container
docker-compose down

# Remove container and image
docker-compose down --rmi all

# Remove volumes (careful - deletes data!)
docker-compose down -v
```

## Docker Configuration

### Dockerfile

The project includes a multi-stage Dockerfile optimized for production:

**Stage 1: Dependencies**
- Installs Node.js dependencies
- Generates Prisma client

**Stage 2: Builder**
- Builds Next.js application
- Optimizes for production

**Stage 3: Runner**
- Minimal production image
- Runs the application

### docker-compose.yml

The Docker Compose file defines:
- Service configuration
- Port mappings (3000:3000)
- Environment variables
- Volume mounts
- Network settings

## Environment Variables for Docker

Create a `.env` file with Docker-specific configurations:

```env
# Database - Use host.docker.internal for local DB
DATABASE_URL="postgresql://user:password@host.docker.internal:5432/qa_article_faq?schema=public"

# API URL - Use localhost for external access
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

### Database Connection in Docker

When connecting to a local PostgreSQL database from Docker:

**Use `host.docker.internal` instead of `localhost`:**

```env
DATABASE_URL="postgresql://user:password@host.docker.internal:5432/qa_article_faq?schema=public"
```

**For cloud databases (Neon, Supabase):**

```env
DATABASE_URL="postgresql://user:password@host.region.provider.com/database?sslmode=require"
```

## Building the Image

### Standard Build

```bash
docker-compose build
```

### Build Without Cache

Force a fresh build:

```bash
docker-compose build --no-cache
```

### Build Specific Service

```bash
docker-compose build app
```

## Running the Container

### Start in Detached Mode

```bash
docker-compose up -d
```

### Start with Logs

```bash
docker-compose up
```

### Restart Container

```bash
docker-compose restart
```

## Testing Docker Deployment

### Automated Testing

Run the automated test script:

```bash
node scripts/test/test-cms-api-docker.js
```

This tests:
- ✅ Homepage display (not API message)
- ✅ API endpoints functionality
- ✅ Admin authentication
- ✅ Data fetching and loading

### Manual Testing

#### 1. Check Container Status

```bash
docker ps
```

Expected output:
```
CONTAINER ID   IMAGE          STATUS         PORTS
abc123...      qa-faq-app     Up 2 minutes   0.0.0.0:3000->3000/tcp
```

#### 2. View Container Logs

```bash
docker logs qa-faq-app
```

Expected output:
```
▲ Next.js 14.x.x
- Local:        http://0.0.0.0:3000
✓ Ready in Xms
```

#### 3. Test Homepage

Visit `http://localhost:3000` in your browser:

- ✅ Should see proper homepage with hero section
- ✅ Should see search bar
- ✅ Should see featured topics (if data exists)
- ❌ Should NOT see "Q&A Article FAQ API" message

#### 4. Test API Endpoints

Visit `http://localhost:3000/api/topics`:

- ✅ Should return JSON with topics array
- ✅ Should have `total` and `items` fields

#### 5. Test Admin Authentication

Visit `http://localhost:3000/admin`:

- ✅ Should redirect to `/admin/login`
- ✅ Login should work with credentials from `.env`
- ✅ Dashboard should show statistics

### Test Against Different Environments

```bash
# Test local
set TEST_URL=http://localhost:3000
node scripts/test/test-cms-api-docker.js

# Test staging
set TEST_URL=https://staging.yoursite.com
node scripts/test/test-cms-api-docker.js

# Test production
set TEST_URL=https://yoursite.com
node scripts/test/test-cms-api-docker.js
```

## Docker Commands

### Execute Commands in Container

```bash
# Open shell
docker exec -it qa-faq-app sh

# Run specific command
docker exec qa-faq-app npm run build

# Run tests inside container
docker exec qa-faq-app npm test
```

### View Container Information

```bash
# Inspect container
docker inspect qa-faq-app

# View resource usage
docker stats qa-faq-app

# View container processes
docker top qa-faq-app
```

### Manage Logs

```bash
# View logs
docker logs qa-faq-app

# Follow logs
docker logs -f qa-faq-app

# View last 100 lines
docker logs --tail 100 qa-faq-app

# View logs with timestamps
docker logs -t qa-faq-app
```

## Troubleshooting

### Container Won't Start

**Check logs:**
```bash
docker logs qa-faq-app
```

**Common issues:**
- Database connection failed: Check `DATABASE_URL` in `.env`
- Port already in use: Stop other services on port 3000
- Build errors: Check Dockerfile and dependencies

**Solution:**
```bash
# Rebuild without cache
docker-compose build --no-cache
docker-compose up -d
```

### Database Connection Issues

**Issue**: Cannot connect to database

**Solutions:**

1. For local database, use `host.docker.internal`:
   ```env
   DATABASE_URL="postgresql://user:pass@host.docker.internal:5432/db"
   ```

2. For cloud database, ensure SSL is enabled:
   ```env
   DATABASE_URL="postgresql://...?sslmode=require"
   ```

3. Check database is accessible:
   ```bash
   docker exec qa-faq-app npx prisma db pull
   ```

### Homepage Shows API Message

**Issue**: Old `src/app/page.tsx` still exists

**Solution:**
```bash
# Verify file is deleted
ls src/app/page.tsx

# If it exists, delete and rebuild
rm src/app/page.tsx
docker-compose build
docker-compose up -d
```

### Build Fails During Prisma Generation

**Issue**: Prisma client generation fails

**Solution:**
```bash
# Ensure DATABASE_URL is set in .env
# Rebuild with verbose output
docker-compose build --progress=plain
```

### Port Conflict

**Issue**: Port 3000 already in use

**Solution:**

1. Stop conflicting service
2. Or change port in `docker-compose.yml`:
   ```yaml
   ports:
     - "3001:3000"
   ```

### Container Exits Immediately

**Check exit code:**
```bash
docker ps -a
```

**View logs:**
```bash
docker logs qa-faq-app
```

**Common causes:**
- Missing environment variables
- Database connection failure
- Build errors

## Performance Optimization

### Check Response Times

Using curl:

```bash
# Homepage
curl -w "Time: %{time_total}s\n" -o /dev/null -s http://localhost:3000

# API
curl -w "Time: %{time_total}s\n" -o /dev/null -s http://localhost:3000/api/topics
```

### Monitor Resource Usage

```bash
docker stats qa-faq-app
```

Shows:
- CPU usage
- Memory usage
- Network I/O
- Block I/O

### Optimize Image Size

Current optimizations:
- Multi-stage build
- Minimal base image (Alpine)
- Only production dependencies
- Standalone Next.js output

Check image size:
```bash
docker images | grep qa-faq-app
```

## Production Deployment

### Build for Production

```bash
# Build production image
docker build -t qa-faq-app:latest .

# Tag for registry
docker tag qa-faq-app:latest registry.example.com/qa-faq-app:latest

# Push to registry
docker push registry.example.com/qa-faq-app:latest
```

### Production Environment Variables

```env
# Use production database
DATABASE_URL="postgresql://prod-host/database?sslmode=require"

# Use production URL
NEXTAUTH_URL="https://yourdomain.com"
NEXT_PUBLIC_API_URL="https://yourdomain.com"

# Use strong secrets
NEXTAUTH_SECRET="production-secret-here"
INGEST_API_KEY="production-api-key"
INGEST_WEBHOOK_SECRET="production-webhook-secret"
```

### Health Checks

Add health check to `docker-compose.yml`:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/topics"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Security Best Practices

1. **Use non-root user** (already configured in Dockerfile)
2. **Scan for vulnerabilities:**
   ```bash
   docker scan qa-faq-app
   ```
3. **Keep base image updated**
4. **Use secrets management** for sensitive data
5. **Enable SSL/TLS** in production

## Success Criteria

All tests should pass:
- ✅ Container builds successfully
- ✅ Container starts without errors
- ✅ Homepage displays correctly
- ✅ API endpoints return valid data
- ✅ Admin authentication works
- ✅ No console errors
- ✅ Database connection stable

## Related Documentation

- [Getting Started Guide](./getting-started.md)
- [Environment Setup](./environment-setup.md)
- [Database Setup](./database-setup.md)
- [Testing Guide](../testing/docker-testing.md)
