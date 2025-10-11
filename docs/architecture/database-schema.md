# Database Schema Documentation

Complete documentation of the PostgreSQL database schema using Prisma ORM.

## Table of Contents

- [Overview](#overview)
- [Core Content Models](#core-content-models)
- [CMS Models](#cms-models)
- [Enums](#enums)
- [Indexes](#indexes)
- [Relationships](#relationships)
- [Migrations](#migrations)

## Overview

The database uses PostgreSQL with Prisma ORM for type-safe database access. The schema is divided into two main sections:

1. **Core Content Models**: Topic, Question, Article, FAQItem, IngestJob
2. **CMS Models**: SiteSettings, Page, MenuItem, FooterColumn, FooterLink, FooterSettings, Media, User, AuditLog

## Core Content Models

### Topic

Represents a Q&A topic with associated content.

**Table:** `Topic`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PRIMARY KEY, CUID | Unique identifier |
| slug | String | UNIQUE, INDEXED | URL-friendly identifier |
| title | String | NOT NULL | Topic title |
| locale | String | NOT NULL, INDEXED | Language code (e.g., "en") |
| tags | String[] | INDEXED | Categorization tags |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last update timestamp |

**Relationships:**
- One-to-many with Question
- One-to-many with Article
- One-to-many with FAQItem

**Indexes:**
- `slug` (unique)
- `locale`
- `tags` (GIN index for array)

### Question

Questions associated with a topic.

**Table:** `Question`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PRIMARY KEY, CUID | Unique identifier |
| topicId | String | FOREIGN KEY, INDEXED | Reference to Topic |
| text | String | NOT NULL | Question text |
| isPrimary | Boolean | DEFAULT false, INDEXED | Main question flag |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last update timestamp |

**Relationships:**
- Many-to-one with Topic (CASCADE delete)

**Indexes:**
- `topicId`
- `topicId, isPrimary` (composite)

### Article

Article content for a topic.

**Table:** `Article`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PRIMARY KEY, CUID | Unique identifier |
| topicId | String | UNIQUE, FOREIGN KEY | Reference to Topic |
| content | Text | NOT NULL | Article content (HTML/Markdown) |
| status | ContentStatus | DEFAULT DRAFT, INDEXED | Publication status |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last update timestamp |

**Relationships:**
- One-to-one with Topic (CASCADE delete)

**Indexes:**
- `topicId, status` (composite)

### FAQItem

FAQ items associated with a topic.

**Table:** `FAQItem`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PRIMARY KEY, CUID | Unique identifier |
| topicId | String | FOREIGN KEY, INDEXED | Reference to Topic |
| question | String | NOT NULL | FAQ question |
| answer | Text | NOT NULL | FAQ answer |
| order | Int | NOT NULL, INDEXED | Display order |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last update timestamp |

**Relationships:**
- Many-to-one with Topic (CASCADE delete)

**Indexes:**
- `topicId`
- `topicId, order` (composite)

### IngestJob

Audit log for webhook ingestion operations.

**Table:** `IngestJob`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PRIMARY KEY, CUID | Unique identifier |
| topicSlug | String | INDEXED | Topic slug being ingested |
| status | String | INDEXED | Job status (processing/completed/failed) |
| payload | Json | NOT NULL | Original request payload |
| error | Text | NULLABLE | Error message if failed |
| createdAt | DateTime | DEFAULT now(), INDEXED | Job start time |
| completedAt | DateTime | NULLABLE | Job completion time |

**Indexes:**
- `topicSlug`
- `status`
- `createdAt`

## CMS Models

### SiteSettings

Global site configuration.

**Table:** `SiteSettings`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PRIMARY KEY, CUID | Unique identifier |
| siteName | String | DEFAULT "Q&A Article FAQ" | Site name |
| logoUrl | String | NULLABLE | Logo file URL |
| faviconUrl | String | NULLABLE | Favicon file URL |
| seoTitle | String | NULLABLE | Default SEO title |
| seoDescription | String | NULLABLE | Default SEO description |
| seoKeywords | String[] | | SEO keywords |
| socialLinks | Json | NULLABLE | Social media links object |
| customCss | Text | NULLABLE | Custom CSS code |
| customJs | Text | NULLABLE | Custom JavaScript code |
| updatedAt | DateTime | AUTO UPDATE | Last update timestamp |
| updatedBy | String | NULLABLE | User ID who updated |

**Note:** Typically only one record exists in this table.

### Page

Custom pages (About, Contact, etc.).

**Table:** `Page`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PRIMARY KEY, CUID | Unique identifier |
| slug | String | UNIQUE, INDEXED | URL-friendly identifier |
| title | String | NOT NULL | Page title |
| content | Text | NOT NULL | Page content (HTML) |
| status | ContentStatus | DEFAULT DRAFT, INDEXED | Publication status |
| seoTitle | String | NULLABLE | SEO title override |
| seoDescription | String | NULLABLE | SEO description |
| seoKeywords | String[] | | SEO keywords |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last update timestamp |
| createdBy | String | NULLABLE | User ID who created |
| updatedBy | String | NULLABLE | User ID who updated |

**Indexes:**
- `slug` (unique)
- `status`

### MenuItem

Navigation menu items with hierarchical structure.

**Table:** `MenuItem`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PRIMARY KEY, CUID | Unique identifier |
| label | String | NOT NULL | Display text |
| url | String | NOT NULL | Link destination |
| order | Int | NOT NULL, INDEXED | Display order |
| parentId | String | NULLABLE, FOREIGN KEY, INDEXED | Parent menu item |
| isExternal | Boolean | DEFAULT false | External link flag |
| openNewTab | Boolean | DEFAULT false | Open in new tab flag |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last update timestamp |

**Relationships:**
- Self-referential: parent/children (CASCADE delete)

**Indexes:**
- `order`
- `parentId`

### FooterColumn

Footer column containers.

**Table:** `FooterColumn`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PRIMARY KEY, CUID | Unique identifier |
| title | String | NOT NULL | Column title |
| order | Int | NOT NULL, INDEXED | Display order |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last update timestamp |

**Relationships:**
- One-to-many with FooterLink

**Indexes:**
- `order`

### FooterLink

Links within footer columns.

**Table:** `FooterLink`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PRIMARY KEY, CUID | Unique identifier |
| columnId | String | FOREIGN KEY, INDEXED | Reference to FooterColumn |
| label | String | NOT NULL | Link text |
| url | String | NOT NULL | Link destination |
| order | Int | NOT NULL, INDEXED | Display order within column |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last update timestamp |

**Relationships:**
- Many-to-one with FooterColumn (CASCADE delete)

**Indexes:**
- `columnId, order` (composite)

### FooterSettings

Footer global settings.

**Table:** `FooterSettings`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PRIMARY KEY, CUID | Unique identifier |
| copyrightText | String | NOT NULL | Copyright text |
| socialLinks | Json | NULLABLE | Social media links object |
| updatedAt | DateTime | AUTO UPDATE | Last update timestamp |

**Note:** Typically only one record exists in this table.

### Media

Media library files.

**Table:** `Media`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PRIMARY KEY, CUID | Unique identifier |
| filename | String | NOT NULL | Stored filename |
| originalName | String | NOT NULL | Original upload filename |
| mimeType | String | NOT NULL, INDEXED | File MIME type |
| size | Int | NOT NULL | File size in bytes |
| url | String | NOT NULL | Public file URL |
| thumbnailUrl | String | NULLABLE | Thumbnail URL (images only) |
| uploadedBy | String | NULLABLE | User ID who uploaded |
| createdAt | DateTime | DEFAULT now(), INDEXED | Upload timestamp |

**Indexes:**
- `mimeType`
- `createdAt`

### User

Admin users with role-based access.

**Table:** `User`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PRIMARY KEY, CUID | Unique identifier |
| email | String | UNIQUE, INDEXED | User email (login) |
| password | String | NOT NULL | Hashed password (bcrypt) |
| name | String | NOT NULL | User full name |
| role | UserRole | DEFAULT VIEWER, INDEXED | User role |
| isActive | Boolean | DEFAULT true | Account active flag |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last update timestamp |

**Relationships:**
- One-to-many with AuditLog

**Indexes:**
- `email` (unique)
- `role`

**Security:**
- Passwords are hashed using bcrypt with 10 rounds
- Never store plain text passwords

### AuditLog

Audit trail for all admin actions.

**Table:** `AuditLog`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PRIMARY KEY, CUID | Unique identifier |
| userId | String | FOREIGN KEY, INDEXED | Reference to User |
| action | AuditAction | NOT NULL | Action type |
| entityType | String | NOT NULL, INDEXED | Entity type (Topic, Page, etc.) |
| entityId | String | NULLABLE | Entity identifier |
| details | Json | NULLABLE | Action details (before/after) |
| ipAddress | String | NULLABLE | Client IP address |
| userAgent | String | NULLABLE | Client user agent |
| createdAt | DateTime | DEFAULT now(), INDEXED | Action timestamp |

**Relationships:**
- Many-to-one with User (CASCADE delete)

**Indexes:**
- `userId`
- `entityType`
- `createdAt`

## Enums

### ContentStatus

Publication status for content.

**Values:**
- `DRAFT`: Content is not published
- `PUBLISHED`: Content is publicly visible

**Used by:**
- Article.status
- Page.status

### UserRole

User permission levels.

**Values:**
- `ADMIN`: Full access to all features
- `EDITOR`: Content management access
- `VIEWER`: Read-only access

**Used by:**
- User.role

### AuditAction

Types of auditable actions.

**Values:**
- `CREATE`: Entity creation
- `UPDATE`: Entity modification
- `DELETE`: Entity deletion
- `LOGIN`: User login
- `LOGOUT`: User logout

**Used by:**
- AuditLog.action

## Indexes

### Performance Indexes

Indexes are strategically placed to optimize common queries:

1. **Unique Constraints:**
   - Topic.slug
   - Page.slug
   - User.email
   - Article.topicId

2. **Single Column Indexes:**
   - Topic.locale (filtering by language)
   - Topic.tags (GIN index for array search)
   - Question.topicId (join optimization)
   - FAQItem.topicId (join optimization)
   - MenuItem.order (sorting)
   - MenuItem.parentId (hierarchical queries)
   - FooterColumn.order (sorting)
   - Media.mimeType (filtering by type)
   - Media.createdAt (sorting by date)
   - User.role (filtering by role)
   - AuditLog.userId (filtering by user)
   - AuditLog.entityType (filtering by entity)
   - AuditLog.createdAt (sorting by date)

3. **Composite Indexes:**
   - Question(topicId, isPrimary) - Find primary question for topic
   - Article(topicId, status) - Find published articles
   - FAQItem(topicId, order) - Ordered FAQ items for topic
   - FooterLink(columnId, order) - Ordered links within column

## Relationships

### One-to-Many

- Topic → Question (CASCADE delete)
- Topic → Article (CASCADE delete)
- Topic → FAQItem (CASCADE delete)
- FooterColumn → FooterLink (CASCADE delete)
- User → AuditLog (CASCADE delete)

### One-to-One

- Topic ↔ Article (CASCADE delete)

### Self-Referential

- MenuItem → MenuItem (parent/children, CASCADE delete)

### Cascade Delete Behavior

When a parent record is deleted, all related child records are automatically deleted:

- Deleting a Topic deletes all its Questions, Articles, and FAQItems
- Deleting a FooterColumn deletes all its FooterLinks
- Deleting a MenuItem deletes all its child MenuItems
- Deleting a User deletes all their AuditLog entries

## Migrations

### Creating Migrations

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Migration History

Migrations are stored in `prisma/migrations/` directory. Each migration includes:
- SQL file with schema changes
- Migration metadata

### Seed Data

Default data can be seeded using `prisma/seed.ts`:

```bash
npx prisma db seed
```

Default seed data includes:
- Default SiteSettings record
- Default admin user
- Default menu structure
- Default footer configuration

## Data Types

### CUID

All primary keys use CUID (Collision-resistant Unique Identifier):
- Globally unique
- URL-safe
- Sortable by creation time
- Example: `clx1234567890abcdef`

### DateTime

All timestamps use ISO 8601 format:
- Stored in UTC
- Example: `2024-01-15T10:30:00.000Z`

### Json

JSON columns store structured data:
- SiteSettings.socialLinks: `{ "twitter": "url", "facebook": "url" }`
- FooterSettings.socialLinks: Same structure
- AuditLog.details: `{ "before": {...}, "after": {...} }`
- IngestJob.payload: Original request body

### Text

Text columns support unlimited length:
- Article.content
- Page.content
- FAQItem.answer
- SiteSettings.customCss
- SiteSettings.customJs
- IngestJob.error

## Query Examples

### Find Published Topics

```typescript
const topics = await prisma.topic.findMany({
  where: {
    articles: {
      some: {
        status: 'PUBLISHED'
      }
    }
  },
  include: {
    articles: {
      where: { status: 'PUBLISHED' }
    }
  }
});
```

### Get Menu Hierarchy

```typescript
const menuItems = await prisma.menuItem.findMany({
  where: { parentId: null },
  include: {
    children: {
      orderBy: { order: 'asc' }
    }
  },
  orderBy: { order: 'asc' }
});
```

### Get Footer Configuration

```typescript
const footer = await prisma.footerColumn.findMany({
  include: {
    links: {
      orderBy: { order: 'asc' }
    }
  },
  orderBy: { order: 'asc' }
});
```

### Audit Log with User Info

```typescript
const logs = await prisma.auditLog.findMany({
  include: {
    user: {
      select: {
        name: true,
        email: true
      }
    }
  },
  orderBy: { createdAt: 'desc' },
  take: 50
});
```

## Best Practices

1. **Always use transactions** for operations that modify multiple tables
2. **Use select** to fetch only needed fields
3. **Use include** carefully to avoid N+1 queries
4. **Add indexes** for frequently queried fields
5. **Use CASCADE delete** to maintain referential integrity
6. **Hash passwords** before storing (never plain text)
7. **Validate data** before database operations
8. **Use connection pooling** in production
9. **Monitor query performance** with Prisma logging
10. **Keep migrations** in version control

## Connection Configuration

### Development

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"
```

### Production

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public&connection_limit=10&pool_timeout=20"
```

### Connection Pool Settings

- `connection_limit`: Maximum number of connections (default: 10)
- `pool_timeout`: Connection timeout in seconds (default: 20)
- `connect_timeout`: Initial connection timeout (default: 5)

## Backup and Restore

### Backup

```bash
pg_dump -h localhost -U user -d dbname > backup.sql
```

### Restore

```bash
psql -h localhost -U user -d dbname < backup.sql
```

### Automated Backups

Consider setting up automated backups:
- Daily full backups
- Hourly incremental backups
- Off-site backup storage
- Regular restore testing

## Performance Monitoring

### Enable Query Logging

```typescript
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

### Analyze Slow Queries

```sql
-- Enable slow query logging in PostgreSQL
ALTER DATABASE dbname SET log_min_duration_statement = 1000;

-- View slow queries
SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;
```

### Index Usage

```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

## Security Considerations

1. **Never expose database credentials** in client-side code
2. **Use environment variables** for connection strings
3. **Implement row-level security** if needed
4. **Regularly update** Prisma and PostgreSQL
5. **Monitor for SQL injection** attempts
6. **Use prepared statements** (Prisma does this automatically)
7. **Limit database user permissions** to minimum required
8. **Enable SSL** for database connections in production
9. **Audit database access** regularly
10. **Backup encryption keys** securely
