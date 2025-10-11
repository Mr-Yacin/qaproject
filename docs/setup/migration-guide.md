# Migration Guide

This guide provides step-by-step instructions for migrating an existing Q&A Article FAQ API installation to include the new Admin CMS Enhancement features.

## Overview

The Admin CMS Enhancement adds comprehensive content management capabilities including:
- Site settings management
- Custom page creation
- Navigation menu builder
- Footer configuration
- Media library
- User management with roles
- Audit logging
- Cache management
- Bulk operations

## Prerequisites

Before starting the migration:

1. **Backup your database** (see [Backup Procedures](#backup-procedures))
2. **Review the changelog** to understand what's changing
3. **Ensure you have Node.js 18+** and npm installed
4. **Stop your application** to prevent data inconsistencies
5. **Have database access** to run migrations

## Migration Steps

### Step 1: Backup Your Data

**Critical: Always backup before migrating!**

```bash
# PostgreSQL backup
pg_dump -U your_username -d qa_article_faq > backup_$(date +%Y%m%d_%H%M%S).sql

# Or if using Docker
docker-compose exec db pg_dump -U your_username qa_article_faq > backup_$(date +%Y%m%d_%H%M%S).sql
```

Store the backup file in a safe location outside your project directory.

### Step 2: Update Code

Pull the latest code from your repository:

```bash
git pull origin main
```

Or if you're applying a specific release:

```bash
git fetch --tags
git checkout v2.0.0  # Replace with actual version
```

### Step 3: Install Dependencies

Install new dependencies required for CMS features:

```bash
npm install
```

New dependencies include:
- `@tiptap/react` - Rich text editor
- `@tiptap/starter-kit` - TipTap extensions
- `@dnd-kit/core` - Drag and drop functionality
- `sharp` - Image processing
- `bcrypt` - Password hashing
- `isomorphic-dompurify` - HTML sanitization

### Step 4: Update Environment Variables

Add new required environment variables to your `.env` file:

```bash
# Admin Authentication (if not already present)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="your-secure-admin-password"

# NextAuth Configuration (if not already present)
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

Generate secure secrets:

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

**Important**: Change the default admin password immediately after first login!

See [Environment Variables](#environment-variables-reference) for complete list.

### Step 5: Run Database Migrations

Apply the new database schema:

```bash
# Generate Prisma client with new models
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

This will add the following new tables:
- `SiteSettings` - Global site configuration
- `Page` - Custom pages
- `MenuItem` - Navigation menu items
- `FooterColumn` - Footer columns
- `FooterLink` - Footer links
- `FooterSettings` - Footer configuration
- `Media` - Media library files
- `User` - Admin users
- `AuditLog` - Activity audit trail

### Step 6: Seed Default Data

Create default CMS data:

```bash
npm run seed:append
```

This creates:
- Default site settings record
- Default admin user (from environment variables)
- Default navigation menu structure
- Default footer configuration

**Note**: Use `seed:append` instead of `seed` to preserve existing topic data.

### Step 7: Verify Migration

Run verification scripts to ensure everything is working:

```bash
# Verify admin authentication
npm run verify:auth

# Verify seed data
npm run verify:seed

# Verify caching strategy
npm run verify:caching
```

All verification scripts should pass without errors.

### Step 8: Test the Application

Start the application and test key features:

```bash
npm run dev
```

**Test Checklist:**

1. **Public API** - Verify existing topics still work
   - Visit `http://localhost:3000/api/topics`
   - Test a specific topic: `http://localhost:3000/api/topics/[slug]`

2. **Admin Login** - Access the admin panel
   - Visit `http://localhost:3000/admin`
   - Log in with your admin credentials
   - Verify dashboard loads correctly

3. **Admin Features** - Test each CMS feature
   - Site Settings: Update site name and logo
   - Pages: Create a test page
   - Menus: Add a menu item
   - Footer: Update footer content
   - Media: Upload a test image
   - Users: View user list
   - Audit Log: Check for logged actions
   - Cache: View cache stats

4. **Existing Features** - Ensure backward compatibility
   - Topic management still works
   - Webhook ingestion still works (if applicable)
   - Cache revalidation still works

### Step 9: Update Admin Password

**Security Critical**: Change the default admin password immediately!

1. Log in to admin panel at `/admin`
2. Navigate to Users section
3. Edit your admin user
4. Set a strong, unique password
5. Save changes

### Step 10: Deploy to Production

Once testing is complete in staging/development:

1. **Schedule maintenance window** - Inform users of downtime
2. **Backup production database** - Critical safety step
3. **Deploy code** - Push to production environment
4. **Run migrations** - Apply database changes
5. **Seed default data** - Create CMS defaults
6. **Verify deployment** - Run smoke tests
7. **Monitor logs** - Watch for errors

```bash
# Production deployment example
git push production main

# SSH into production server
ssh your-server

# Navigate to app directory
cd /path/to/app

# Install dependencies
npm ci --production

# Run migrations
npx prisma migrate deploy

# Seed CMS data (preserves existing data)
npm run seed:append

# Restart application
pm2 restart qa-article-faq
```

## Backup Procedures

### Manual Backup

Create a complete database backup:

```bash
# PostgreSQL
pg_dump -U username -d database_name -F c -f backup.dump

# With compression
pg_dump -U username -d database_name | gzip > backup.sql.gz
```

### Automated Backup Script

Create a backup script for regular backups:

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/path/to/backups"
DB_NAME="qa_article_faq"
DB_USER="your_username"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

# Create backup
pg_dump -U $DB_USER -d $DB_NAME | gzip > $BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup created: $BACKUP_FILE"
```

Make it executable and schedule with cron:

```bash
chmod +x backup.sh

# Add to crontab (daily at 2 AM)
0 2 * * * /path/to/backup.sh
```

### Restore from Backup

If you need to restore from a backup:

```bash
# From .sql file
psql -U username -d database_name < backup.sql

# From compressed file
gunzip -c backup.sql.gz | psql -U username -d database_name

# From .dump file
pg_restore -U username -d database_name backup.dump
```

## Rollback Procedure

If migration fails and you need to rollback:

### Step 1: Stop the Application

```bash
# Development
# Press Ctrl+C to stop dev server

# Production (example with PM2)
pm2 stop qa-article-faq
```

### Step 2: Restore Database

```bash
# Drop current database
dropdb -U username qa_article_faq

# Create fresh database
createdb -U username qa_article_faq

# Restore from backup
psql -U username -d qa_article_faq < backup.sql
```

### Step 3: Revert Code

```bash
# Revert to previous version
git checkout previous-version-tag

# Reinstall dependencies
npm ci

# Regenerate Prisma client
npx prisma generate
```

### Step 4: Restart Application

```bash
# Development
npm run dev

# Production
pm2 start qa-article-faq
```

## Testing Migration on Staging

**Highly Recommended**: Test the migration on a staging environment first!

### Create Staging Environment

1. **Clone production database** to staging:

```bash
# Backup production
pg_dump -U prod_user -h prod_host -d qa_article_faq > prod_backup.sql

# Restore to staging
psql -U staging_user -h staging_host -d qa_article_faq_staging < prod_backup.sql
```

2. **Deploy code** to staging server

3. **Update environment variables** for staging

4. **Run migration** following steps above

5. **Test thoroughly** before production deployment

### Staging Test Checklist

- [ ] All existing topics are accessible
- [ ] Webhook ingestion works correctly
- [ ] Admin login works
- [ ] All CMS features are functional
- [ ] No console errors in browser
- [ ] No errors in server logs
- [ ] Performance is acceptable
- [ ] Cache revalidation works
- [ ] Audit logging is working

## Environment Variables Reference

### Required New Variables

```bash
# Admin Authentication
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="your-secure-password"

# NextAuth Configuration
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://your-domain.com"
```

### Existing Variables (No Changes)

```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# API Security
INGEST_API_KEY="your-api-key"
INGEST_WEBHOOK_SECRET="your-webhook-secret"

# Application
NEXT_PUBLIC_API_URL="https://your-domain.com"
```

### Optional Variables

```bash
# Test Database (for running tests)
TEST_DATABASE_URL="postgresql://user:password@host:port/test_database"
```

## Common Migration Issues

### Issue: Migration Fails with Foreign Key Constraint

**Symptom**: Error about foreign key constraints during migration

**Solution**: Ensure you're using `prisma migrate deploy` not `prisma migrate dev` in production. If issue persists, check for orphaned records:

```sql
-- Find topics without articles
SELECT t.id, t.slug FROM "Topic" t
LEFT JOIN "Article" a ON t.id = a."topicId"
WHERE a.id IS NULL;
```

### Issue: Admin Login Fails

**Symptom**: Cannot log in to admin panel

**Solution**: 
1. Verify `NEXTAUTH_SECRET` is set
2. Verify `NEXTAUTH_URL` matches your domain
3. Check admin user was created: `npx prisma studio`
4. Verify password is hashed correctly
5. Clear browser cookies and try again

### Issue: Media Upload Fails

**Symptom**: Cannot upload images to media library

**Solution**:
1. Ensure `public/uploads` directory exists and is writable
2. Check file size limits in your server configuration
3. Verify Sharp is installed correctly: `npm list sharp`

### Issue: Rich Text Editor Not Loading

**Symptom**: TipTap editor shows blank or errors

**Solution**:
1. Clear Next.js cache: `rm -rf .next`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check browser console for JavaScript errors

### Issue: Audit Log Not Recording

**Symptom**: No entries in audit log

**Solution**:
1. Verify audit middleware is applied to routes
2. Check user session is valid
3. Verify AuditLog table exists: `npx prisma studio`

## Performance Considerations

After migration, monitor these metrics:

### Database Performance

- **Query Performance**: New tables add indexes, but monitor slow queries
- **Database Size**: Media library will increase storage needs
- **Connection Pool**: May need to adjust Prisma connection pool size

### Application Performance

- **Memory Usage**: Rich text editor and image processing increase memory
- **Response Times**: Monitor API response times
- **Cache Hit Rate**: Verify caching is working effectively

### Optimization Tips

1. **Enable Database Indexes**: Already included in migration
2. **Configure Image Optimization**: Sharp handles this automatically
3. **Set Up CDN**: Consider CDN for media files in production
4. **Monitor Audit Log Size**: Archive old logs periodically

## Post-Migration Tasks

### Immediate Tasks (Day 1)

- [ ] Change default admin password
- [ ] Configure site settings (logo, site name, SEO)
- [ ] Create initial custom pages (About, Contact, Privacy)
- [ ] Set up navigation menu
- [ ] Configure footer
- [ ] Create additional admin users if needed
- [ ] Test all features thoroughly

### Short-Term Tasks (Week 1)

- [ ] Train team on new CMS features
- [ ] Document custom workflows
- [ ] Set up regular database backups
- [ ] Configure monitoring and alerts
- [ ] Review audit logs for issues
- [ ] Optimize performance if needed

### Ongoing Tasks

- [ ] Regular database backups (automated)
- [ ] Monitor audit logs for security
- [ ] Review and archive old audit logs
- [ ] Update documentation as needed
- [ ] Train new team members
- [ ] Keep dependencies updated

## Support and Troubleshooting

### Getting Help

1. **Check Documentation**: Review docs in `/docs` directory
2. **Check Logs**: Application logs often reveal issues
3. **Prisma Studio**: Use `npx prisma studio` to inspect database
4. **Verification Scripts**: Run `npm run verify:*` scripts

### Useful Commands

```bash
# View database schema
npx prisma db pull

# Reset database (CAUTION: Deletes all data!)
npx prisma migrate reset

# View Prisma client
npx prisma generate --watch

# Check for pending migrations
npx prisma migrate status

# View application logs
npm run dev  # Development
pm2 logs qa-article-faq  # Production with PM2
```

### Debug Mode

Enable debug logging:

```bash
# Development
DEBUG=* npm run dev

# Prisma query logging
DATABASE_URL="postgresql://...?connection_limit=5&pool_timeout=20&log=query"
```

## Migration Checklist

Use this checklist to track your migration progress:

### Pre-Migration
- [ ] Read complete migration guide
- [ ] Backup production database
- [ ] Test migration on staging environment
- [ ] Schedule maintenance window
- [ ] Notify users of downtime
- [ ] Prepare rollback plan

### Migration
- [ ] Stop application
- [ ] Update code
- [ ] Install dependencies
- [ ] Update environment variables
- [ ] Run database migrations
- [ ] Seed default data
- [ ] Run verification scripts
- [ ] Test all features

### Post-Migration
- [ ] Change admin password
- [ ] Configure site settings
- [ ] Create initial content
- [ ] Train team members
- [ ] Monitor for issues
- [ ] Update documentation
- [ ] Set up automated backups

## Conclusion

This migration adds powerful CMS capabilities while maintaining backward compatibility with existing features. Follow this guide carefully, test thoroughly, and always maintain backups.

For additional help, refer to:
- [Admin User Guide](../admin/admin-user-guide.md)
- [Database Schema](../architecture/database-schema.md)
- [Testing Guide](../testing/README.md)

**Remember**: When in doubt, test on staging first!
