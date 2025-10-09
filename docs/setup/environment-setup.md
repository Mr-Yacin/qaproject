# Environment Configuration

This guide explains all environment variables required for the Q&A Article FAQ API.

## Environment File Setup

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Then configure the following variables:

## Required Variables

### DATABASE_URL

PostgreSQL connection string for the main database.

**Format**: 
```
postgresql://[user]:[password]@[host]:[port]/[database]?schema=public
```

**Local Database Example**:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/qa_article_faq?schema=public"
```

**Hosted Database Example** (Neon, Supabase):
```env
DATABASE_URL="postgresql://user:password@host.region.provider.com/database?sslmode=require"
```

**Docker Environment**:
When running in Docker and connecting to a local database, use `host.docker.internal`:
```env
DATABASE_URL="postgresql://user:password@host.docker.internal:5432/qa_article_faq?schema=public"
```

### INGEST_API_KEY

Static API key for authenticating webhook requests to `/api/ingest` and `/api/revalidate`.

**Generate a secure key**:
```bash
openssl rand -base64 32
```

**Example**:
```env
INGEST_API_KEY="dGhpc2lzYXNlY3VyZWFwaWtleWV4YW1wbGU="
```

**Security Notes**:
- Keep this key confidential
- Use a strong, randomly generated value
- Rotate periodically for security
- Never commit to version control

### INGEST_WEBHOOK_SECRET

Secret key used for HMAC-SHA256 signature verification. This ensures webhook payloads haven't been tampered with.

**Generate a secure secret**:
```bash
openssl rand -base64 32
```

**Example**:
```env
INGEST_WEBHOOK_SECRET="dGhpc2lzYXNlY3VyZXdlYmhvb2tzZWNyZXQ="
```

**Security Notes**:
- This is used to verify request signatures
- Must match the secret used by the webhook sender
- Keep confidential and secure
- Different from `INGEST_API_KEY`

### NEXTAUTH_SECRET

Secret key for NextAuth.js session encryption.

**Generate a secure secret**:
```bash
openssl rand -base64 32
```

**Example**:
```env
NEXTAUTH_SECRET="your-nextauth-secret-here"
```

**Important**:
- Required for authentication to work
- Must be at least 32 characters
- Keep confidential

### NEXTAUTH_URL

The canonical URL of your application.

**Development**:
```env
NEXTAUTH_URL="http://localhost:3000"
```

**Production**:
```env
NEXTAUTH_URL="https://yourdomain.com"
```

**Docker**:
```env
NEXTAUTH_URL="http://localhost:3000"
```

### ADMIN_EMAIL

Email address for the admin user.

**Example**:
```env
ADMIN_EMAIL="admin@example.com"
```

### ADMIN_PASSWORD

Password for the admin user.

**Example**:
```env
ADMIN_PASSWORD="your-secure-admin-password"
```

**Security Notes**:
- Use a strong password
- Consider using a password manager
- Change default password immediately

## Optional Variables

### TEST_DATABASE_URL

Separate database for running tests. If not provided, tests will use `DATABASE_URL`.

**Example**:
```env
TEST_DATABASE_URL="postgresql://user:password@localhost:5432/qa_article_faq_test?schema=public"
```

**Benefits**:
- Keeps test data separate from development data
- Prevents accidental data loss
- Allows parallel test execution

### NEXT_PUBLIC_API_URL

Public API URL for client-side requests.

**Development**:
```env
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

**Docker**:
```env
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

**Production**:
```env
NEXT_PUBLIC_API_URL="https://yourdomain.com"
```

**Note**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## Complete Example

Here's a complete `.env` file example:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/qa_article_faq?schema=public"
TEST_DATABASE_URL="postgresql://user:password@localhost:5432/qa_article_faq_test?schema=public"

# API Security
INGEST_API_KEY="dGhpc2lzYXNlY3VyZWFwaWtleWV4YW1wbGU="
INGEST_WEBHOOK_SECRET="dGhpc2lzYXNlY3VyZXdlYmhvb2tzZWNyZXQ="

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Admin Credentials
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="your-secure-admin-password"

# Public API URL (optional)
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

## Environment-Specific Configurations

### Development

```env
DATABASE_URL="postgresql://localhost:5432/qa_article_faq"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### Docker

```env
DATABASE_URL="postgresql://host.docker.internal:5432/qa_article_faq"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### Production

```env
DATABASE_URL="postgresql://production-host/database?sslmode=require"
NEXTAUTH_URL="https://yourdomain.com"
NEXT_PUBLIC_API_URL="https://yourdomain.com"
```

## Validation

After setting up your environment variables, verify they're loaded correctly:

```bash
# Check if Prisma can connect
npx prisma db pull

# Test the application
npm run dev
```

## Security Best Practices

1. **Never commit `.env` to version control**
   - Add `.env` to `.gitignore`
   - Use `.env.example` as a template

2. **Use strong, random values**
   - Generate secrets with `openssl rand -base64 32`
   - Don't use predictable values

3. **Rotate secrets regularly**
   - Change API keys periodically
   - Update secrets after team member changes

4. **Use different values per environment**
   - Development, staging, and production should have different secrets
   - Never use production secrets in development

5. **Limit access**
   - Only share secrets with team members who need them
   - Use secret management tools in production

## Troubleshooting

### Environment Variables Not Loading

Ensure your `.env` file is in the project root and restart the development server:

```bash
npm run dev
```

### Database Connection Issues

Check your `DATABASE_URL` format and ensure PostgreSQL is running:

```bash
# Test connection
npx prisma db pull
```

### Authentication Not Working

Verify `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are set correctly and restart the server.

## Related Documentation

- [Getting Started Guide](./getting-started.md)
- [Database Setup](./database-setup.md)
- [Docker Setup](./docker-setup.md)
