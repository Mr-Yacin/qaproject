# Deployment Checklist

Complete checklist for deploying the Q&A Article FAQ API with Admin CMS Enhancement to production.

## Pre-Deployment Checklist

### 1. Code Quality

- [ ] All tests pass: `npm test`
- [ ] TypeScript compiles without errors: `npx tsc --noEmit`
- [ ] Linting passes: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] No console errors or warnings in development
- [ ] Code review completed (if applicable)
- [ ] All TODO comments addressed or documented

### 2. Environment Configuration

- [ ] Production `.env` file created
- [ ] All required environment variables set
- [ ] Environment variables validated: `npm run verify:env`
- [ ] Secrets are 32+ characters
- [ ] All URLs use HTTPS
- [ ] Database connection string uses SSL
- [ ] Admin password is strong and unique
- [ ] Secrets are different from development/staging
- [ ] `.env` file is NOT committed to version control

### 3. Database

- [ ] Production database created
- [ ] Database backups configured
- [ ] Migrations tested on staging
- [ ] Migration scripts ready: `npx prisma migrate deploy`
- [ ] Seed script ready: `npm run seed:append`
- [ ] Database connection tested
- [ ] Database indexes verified
- [ ] Connection pooling configured

### 4. Security

- [ ] All secrets rotated from development
- [ ] HTTPS enabled and certificates valid
- [ ] CORS configured correctly
- [ ] Rate limiting configured (if applicable)
- [ ] Security headers configured
- [ ] File upload limits set
- [ ] Admin password policy enforced
- [ ] Audit logging enabled
- [ ] Error messages don't expose sensitive info

### 5. Performance

- [ ] Image optimization configured
- [ ] Caching strategy verified: `npm run verify:caching`
- [ ] Code splitting verified: `npm run verify:code-splitting`
- [ ] Database queries optimized
- [ ] CDN configured (if applicable)
- [ ] Compression enabled
- [ ] Static assets optimized

### 6. Monitoring & Logging

- [ ] Error tracking configured (Sentry, etc.)
- [ ] Application logging configured
- [ ] Performance monitoring set up
- [ ] Uptime monitoring configured
- [ ] Database monitoring enabled
- [ ] Alert thresholds configured
- [ ] Log rotation configured

### 7. Documentation

- [ ] README updated with production info
- [ ] API documentation current
- [ ] Admin user guide available
- [ ] Migration guide reviewed
- [ ] Environment variables documented
- [ ] Deployment procedures documented
- [ ] Rollback procedures documented

### 8. Testing

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] E2E tests pass (if applicable)
- [ ] Manual testing completed
- [ ] Admin features tested
- [ ] Public API tested
- [ ] Webhook ingestion tested
- [ ] Cache revalidation tested

### 9. Staging Verification

- [ ] Deployed to staging environment
- [ ] Staging tests passed
- [ ] Performance acceptable on staging
- [ ] No errors in staging logs
- [ ] User acceptance testing completed
- [ ] Load testing completed (if applicable)

### 10. Backup & Recovery

- [ ] Database backup created
- [ ] Backup restoration tested
- [ ] Rollback plan documented
- [ ] Recovery procedures tested
- [ ] Backup retention policy defined

---

## Deployment Steps

### Step 1: Pre-Deployment Verification

Run all verification scripts:

```bash
# Verify all features
npm run verify:all

# Run full test suite
npm test

# Build application
npm run build

# TypeScript check
npx tsc --noEmit

# Lint check
npm run lint
```

All checks should pass before proceeding.

### Step 2: Backup Production Database

**Critical: Always backup before deployment!**

```bash
# Create timestamped backup
pg_dump -U username -d database_name > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup file
ls -lh backup_*.sql
```

Store backup in secure location.

### Step 3: Deploy Code

Deploy your code to production server:

```bash
# Example: Git deployment
git push production main

# Example: Manual deployment
scp -r ./* user@server:/path/to/app/

# Example: Docker deployment
docker build -t qa-article-faq .
docker push registry/qa-article-faq:latest
```

### Step 4: Install Dependencies

On production server:

```bash
# Navigate to application directory
cd /path/to/app

# Install production dependencies
npm ci --production

# Or with all dependencies for build
npm ci
```

### Step 5: Configure Environment

Set up production environment variables:

```bash
# Copy and edit environment file
cp .env.example .env
nano .env

# Or set environment variables in hosting platform
# (Vercel, Railway, Heroku, etc.)
```

Verify configuration:

```bash
npm run verify:env
```

### Step 6: Run Database Migrations

Apply database schema changes:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Verify migration
npx prisma migrate status
```

### Step 7: Seed Default Data

Create default CMS data:

```bash
# Seed CMS defaults (preserves existing data)
npm run seed:append

# Verify seed data
npm run verify:seed
```

### Step 8: Build Application

Build for production:

```bash
# Build Next.js application
npm run build

# Verify build output
ls -la .next/
```

### Step 9: Start Application

Start the production server:

```bash
# Using npm
npm start

# Using PM2
pm2 start npm --name "qa-article-faq" -- start

# Using Docker
docker-compose up -d

# Using systemd
systemctl start qa-article-faq
```

### Step 10: Verify Deployment

Test the deployed application:

```bash
# Check application is running
curl https://your-domain.com/api/topics

# Check admin panel
curl https://your-domain.com/admin

# Run verification scripts
npm run verify:all
```

### Step 11: Post-Deployment Tasks

Complete these tasks immediately after deployment:

1. **Change Admin Password**
   - Log in to admin panel
   - Navigate to Users
   - Update admin password

2. **Configure Site Settings**
   - Upload logo
   - Set site name
   - Configure SEO metadata

3. **Monitor Logs**
   - Check application logs for errors
   - Monitor error tracking service
   - Watch performance metrics

4. **Test Critical Features**
   - Admin login
   - Content creation
   - API endpoints
   - Cache revalidation

### Step 12: Enable Monitoring

Ensure monitoring is active:

```bash
# Check application status
pm2 status  # if using PM2

# Check logs
pm2 logs qa-article-faq  # if using PM2
tail -f /var/log/app.log  # if using systemd

# Check database connections
npx prisma studio
```

---

## Post-Deployment Checklist

### Immediate (Within 1 Hour)

- [ ] Application is accessible
- [ ] Admin panel login works
- [ ] Public API returns data
- [ ] No errors in logs
- [ ] SSL certificate valid
- [ ] Admin password changed
- [ ] Monitoring alerts working
- [ ] Database connections stable

### Short-Term (Within 24 Hours)

- [ ] All features tested in production
- [ ] Performance metrics reviewed
- [ ] Error rates acceptable
- [ ] Cache hit rates good
- [ ] Database performance acceptable
- [ ] User feedback collected (if applicable)
- [ ] Documentation updated
- [ ] Team notified of deployment

### Ongoing

- [ ] Monitor error rates daily
- [ ] Review performance metrics weekly
- [ ] Check audit logs regularly
- [ ] Update dependencies monthly
- [ ] Rotate secrets quarterly
- [ ] Review and archive old audit logs
- [ ] Test backup restoration quarterly

---

## Rollback Procedure

If deployment fails or critical issues arise:

### Step 1: Assess Situation

Determine if rollback is necessary:
- Critical functionality broken?
- Data integrity compromised?
- Security vulnerability exposed?
- Performance severely degraded?

### Step 2: Stop Application

```bash
# Using PM2
pm2 stop qa-article-faq

# Using systemd
systemctl stop qa-article-faq

# Using Docker
docker-compose down
```

### Step 3: Restore Database

```bash
# Drop current database
dropdb -U username database_name

# Create fresh database
createdb -U username database_name

# Restore from backup
psql -U username -d database_name < backup.sql
```

### Step 4: Revert Code

```bash
# Revert to previous version
git revert HEAD
git push production main

# Or checkout previous tag
git checkout v1.0.0
git push production main --force
```

### Step 5: Reinstall Dependencies

```bash
npm ci --production
npx prisma generate
```

### Step 6: Restart Application

```bash
# Using PM2
pm2 start qa-article-faq

# Using systemd
systemctl start qa-article-faq

# Using Docker
docker-compose up -d
```

### Step 7: Verify Rollback

```bash
# Test application
curl https://your-domain.com/api/topics

# Check logs
pm2 logs qa-article-faq

# Verify database
npx prisma studio
```

### Step 8: Post-Rollback

- [ ] Notify team of rollback
- [ ] Document what went wrong
- [ ] Create issue for fix
- [ ] Plan next deployment
- [ ] Review deployment process

---

## Common Deployment Issues

### Issue: Database Migration Fails

**Symptoms:**
- Migration errors during deployment
- Application can't connect to database
- Schema mismatch errors

**Solutions:**
1. Check database connection string
2. Verify database user has proper permissions
3. Check for conflicting migrations
4. Review migration logs
5. Restore from backup if needed

### Issue: Build Fails

**Symptoms:**
- `npm run build` fails
- TypeScript errors
- Missing dependencies

**Solutions:**
1. Run `npm ci` to reinstall dependencies
2. Check TypeScript errors: `npx tsc --noEmit`
3. Verify all environment variables are set
4. Check for syntax errors
5. Review build logs

### Issue: Application Won't Start

**Symptoms:**
- Server crashes on startup
- Port already in use
- Environment variable errors

**Solutions:**
1. Check logs for specific error
2. Verify environment variables: `npm run verify:env`
3. Check port availability
4. Verify database connection
5. Check file permissions

### Issue: Admin Login Fails

**Symptoms:**
- Cannot log in to admin panel
- Authentication errors
- Session errors

**Solutions:**
1. Verify `NEXTAUTH_SECRET` is set
2. Check `NEXTAUTH_URL` matches domain
3. Verify admin user exists in database
4. Check session cookie settings
5. Clear browser cookies and try again

### Issue: Performance Degradation

**Symptoms:**
- Slow response times
- High CPU/memory usage
- Database connection issues

**Solutions:**
1. Check database query performance
2. Verify caching is working
3. Review connection pool settings
4. Check for memory leaks
5. Scale resources if needed

---

## Platform-Specific Guides

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
# ... add all required variables
```

### Railway Deployment

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up

# Set environment variables in Railway dashboard
```

### Docker Deployment

```bash
# Build image
docker build -t qa-article-faq .

# Run container
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --name qa-article-faq \
  qa-article-faq

# Or use docker-compose
docker-compose up -d
```

### VPS Deployment (Ubuntu)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone repository
git clone your-repo.git
cd your-repo

# Install dependencies
npm ci --production

# Set up environment
cp .env.example .env
nano .env

# Run migrations
npx prisma migrate deploy

# Seed data
npm run seed:append

# Build
npm run build

# Start with PM2
pm2 start npm --name "qa-article-faq" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

---

## Security Checklist

### Before Deployment

- [ ] All secrets rotated
- [ ] Strong admin password set
- [ ] HTTPS configured
- [ ] Security headers enabled
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Input validation in place
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] CSRF protection enabled

### After Deployment

- [ ] Admin password changed
- [ ] Security scan completed
- [ ] Vulnerability scan run
- [ ] Penetration testing (if applicable)
- [ ] Security headers verified
- [ ] SSL certificate valid
- [ ] Audit logging working
- [ ] Access logs reviewed

---

## Performance Checklist

### Before Deployment

- [ ] Database indexes optimized
- [ ] Caching strategy verified
- [ ] Image optimization enabled
- [ ] Code splitting configured
- [ ] Static assets optimized
- [ ] Compression enabled
- [ ] CDN configured (if applicable)

### After Deployment

- [ ] Response times acceptable
- [ ] Cache hit rate good
- [ ] Database performance good
- [ ] Memory usage normal
- [ ] CPU usage normal
- [ ] No memory leaks
- [ ] Load testing passed (if applicable)

---

## Support & Resources

- [Migration Guide](migration-guide.md)
- [Environment Variables](environment-variables.md)
- [Database Setup](database-setup.md)
- [Docker Setup](docker-setup.md)
- [Admin User Guide](../admin/admin-user-guide.md)
- [Testing Guide](../testing/README.md)

---

## Final Notes

- **Always test on staging first**
- **Always backup before deployment**
- **Always have a rollback plan**
- **Monitor closely after deployment**
- **Document any issues encountered**
- **Update this checklist based on experience**

Good luck with your deployment! 🚀
