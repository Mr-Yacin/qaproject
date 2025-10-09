# Database Setup

This guide covers database setup and management for the Q&A Article FAQ API using Prisma and PostgreSQL.

## Prerequisites

- PostgreSQL 12+ installed (local or hosted)
- `DATABASE_URL` configured in `.env` file

## Quick Setup

### 1. Run Migrations

Apply database migrations to create the schema:

```bash
npx prisma migrate dev
```

This command will:
- Create the database if it doesn't exist
- Apply all pending migrations
- Generate the Prisma client
- Seed the database (if configured)

### 2. Verify Setup

Open Prisma Studio to view your database:

```bash
npx prisma studio
```

This opens a web interface at `http://localhost:5555` where you can view and edit data.

## Database Schema

The application uses the following data models:

### Topic
- Unique slug identifier
- Title, locale, tags
- One-to-many relationships with Questions, Articles, and FAQ Items

### Question
- Belongs to a Topic
- `isPrimary` flag for the main question

### Article
- One-to-one relationship with Topic
- Content and status (DRAFT/PUBLISHED)

### FAQItem
- Belongs to a Topic
- Question, answer, and display order

### IngestJob
- Audit log for ingestion operations
- Stores payload and status (processing/completed/failed)

## Prisma Commands

### Generate Prisma Client

The Prisma client is automatically generated during `npm install`, but you can regenerate it manually:

```bash
npx prisma generate
```

Run this command after:
- Modifying `prisma/schema.prisma`
- Pulling schema changes from the database
- Switching branches with schema changes

### View Database

Open Prisma Studio to browse and edit data:

```bash
npx prisma studio
```

Features:
- Visual database browser
- Edit records directly
- Filter and search data
- View relationships

### Create Migration

After modifying the schema, create a new migration:

```bash
npx prisma migrate dev --name description-of-changes
```

Example:
```bash
npx prisma migrate dev --name add-user-table
```

### Apply Migrations

Apply pending migrations to the database:

```bash
npx prisma migrate deploy
```

Use this in production environments.

### Reset Database

**Warning**: This deletes all data!

```bash
npx prisma migrate reset
```

This will:
- Drop the database
- Create a new database
- Apply all migrations
- Run seed scripts (if configured)

### Pull Schema from Database

If the database schema was modified outside Prisma:

```bash
npx prisma db pull
```

This updates `schema.prisma` to match the database.

### Push Schema to Database

Push schema changes without creating a migration (useful for prototyping):

```bash
npx prisma db push
```

**Note**: Use migrations for production environments.

## Database Connection Strings

### Local PostgreSQL

```env
DATABASE_URL="postgresql://user:password@localhost:5432/qa_article_faq?schema=public"
```

### Hosted PostgreSQL (Neon, Supabase, etc.)

```env
DATABASE_URL="postgresql://user:password@host.region.provider.com/database?sslmode=require"
```

### Docker Environment

When running in Docker and connecting to a local database:

```env
DATABASE_URL="postgresql://user:password@host.docker.internal:5432/qa_article_faq?schema=public"
```

## Test Database Setup

For running tests with a separate database:

### 1. Create Test Database

```bash
createdb qa_article_faq_test
```

Or using psql:
```sql
CREATE DATABASE qa_article_faq_test;
```

### 2. Configure Test Database URL

Add to `.env`:

```env
TEST_DATABASE_URL="postgresql://user:password@localhost:5432/qa_article_faq_test?schema=public"
```

### 3. Run Migrations on Test Database

```bash
DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate deploy
```

## Database Maintenance

### Backup Database

Using pg_dump:

```bash
pg_dump -U user -d qa_article_faq > backup.sql
```

### Restore Database

```bash
psql -U user -d qa_article_faq < backup.sql
```

### Check Database Size

```sql
SELECT pg_size_pretty(pg_database_size('qa_article_faq'));
```

### Vacuum Database

Optimize database performance:

```sql
VACUUM ANALYZE;
```

## Troubleshooting

### Connection Refused

**Issue**: Cannot connect to PostgreSQL

**Solutions**:
1. Ensure PostgreSQL is running:
   ```bash
   # Linux/Mac
   sudo systemctl status postgresql
   
   # Mac with Homebrew
   brew services list
   ```

2. Check connection string format
3. Verify credentials
4. Check firewall settings

### Migration Failed

**Issue**: Migration fails to apply

**Solutions**:
1. Check database logs for errors
2. Verify schema changes are valid
3. Ensure no conflicting migrations
4. Try resetting the database (development only):
   ```bash
   npx prisma migrate reset
   ```

### Prisma Client Out of Sync

**Issue**: "Prisma Client is not up to date"

**Solution**:
```bash
npx prisma generate
```

### Database Already Exists

**Issue**: Cannot create database, already exists

**Solution**:
```bash
# Drop and recreate (development only)
dropdb qa_article_faq
createdb qa_article_faq
npx prisma migrate dev
```

### SSL Connection Issues

**Issue**: SSL connection errors with hosted databases

**Solution**:
Add `sslmode=require` to connection string:
```env
DATABASE_URL="postgresql://...?sslmode=require"
```

## Production Considerations

### Use Connection Pooling

For production, use connection pooling:

```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public&connection_limit=10&pool_timeout=20"
```

### Enable SSL

Always use SSL in production:

```env
DATABASE_URL="postgresql://...?sslmode=require"
```

### Regular Backups

Set up automated backups:
- Daily full backups
- Point-in-time recovery
- Test restore procedures regularly

### Monitor Performance

- Track query performance
- Monitor connection pool usage
- Set up alerts for slow queries
- Use database monitoring tools

### Migration Strategy

1. Test migrations in staging first
2. Back up before applying migrations
3. Use `prisma migrate deploy` in production
4. Have a rollback plan ready

## Related Documentation

- [Getting Started Guide](./getting-started.md)
- [Environment Setup](./environment-setup.md)
- [Prisma Documentation](https://www.prisma.io/docs)
