# Deployment Guide

Quick reference for deploying the Q&A Article FAQ API with Admin CMS Enhancement.

## Quick Start

```bash
# 1. Verify environment
npm run verify:env

# 2. Run all verifications
npm run verify:all

# 3. Build application
npm run build

# 4. Run migrations
npx prisma migrate deploy

# 5. Seed default data
npm run seed:append

# 6. Start application
npm start
```

## Pre-Deployment Checklist

- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Environment validated: `npm run verify:env`
- [ ] All features verified: `npm run verify:all`
- [ ] Database backup created
- [ ] Staging tested successfully
- [ ] Documentation reviewed

## Required Environment Variables

```bash
DATABASE_URL="postgresql://..."
INGEST_API_KEY="..."
INGEST_WEBHOOK_SECRET="..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://your-domain.com"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="..."
NEXT_PUBLIC_API_URL="https://your-domain.com"
```

Generate secrets:
```bash
openssl rand -base64 32
```

## Deployment Steps

### 1. Backup Database

```bash
pg_dump -U username -d database > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Deploy Code

```bash
git push production main
# or
npm run docker:build && npm run docker:up
```

### 3. Install Dependencies

```bash
npm ci --production
```

### 4. Run Migrations

```bash
npx prisma generate
npx prisma migrate deploy
```

### 5. Seed Data

```bash
npm run seed:append
```

### 6. Build & Start

```bash
npm run build
npm start
```

### 7. Verify Deployment

```bash
npm run verify:all
```

### 8. Post-Deployment

- [ ] Change admin password
- [ ] Configure site settings
- [ ] Test all features
- [ ] Monitor logs

## Rollback Procedure

If deployment fails:

```bash
# 1. Stop application
pm2 stop qa-article-faq

# 2. Restore database
psql -U username -d database < backup.sql

# 3. Revert code
git revert HEAD
git push production main

# 4. Restart
pm2 start qa-article-faq
```

## Verification Commands

```bash
npm run verify:env          # Environment variables
npm run verify:auth         # Admin authentication
npm run verify:caching      # Caching strategy
npm run verify:seed         # Seed data
npm run verify:all          # All verifications
```

## Common Issues

### Database Connection Fails
- Check `DATABASE_URL` format
- Verify database is running
- Check network connectivity

### Admin Login Fails
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches domain
- Run `npm run seed:append` to create admin user

### Build Fails
- Run `npm ci` to reinstall dependencies
- Check TypeScript errors: `npx tsc --noEmit`
- Verify all environment variables are set

## Documentation

- [Complete Migration Guide](docs/setup/migration-guide.md)
- [Deployment Checklist](docs/setup/deployment-checklist.md)
- [Environment Variables](docs/setup/environment-variables.md)
- [Final Verification Report](docs/reports/final-verification-report.md)

## Support

For detailed instructions, see the complete documentation in the `docs/` directory.

**Status:** Ready for Production Deployment ✅
