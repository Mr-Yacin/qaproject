# Environment Variables Reference

Complete reference for all environment variables used in the Q&A Article FAQ API application.

## Quick Start

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Generate secure secrets:
   ```bash
   # Generate secrets (run this 3 times for different secrets)
   openssl rand -base64 32
   ```

3. Update `.env` with your values

4. Verify configuration:
   ```bash
   npm run verify:env
   ```

## Required Variables

### Database Configuration

#### `DATABASE_URL`

PostgreSQL connection string for the main database.

**Format:**
```
postgresql://[user]:[password]@[host]:[port]/[database]?schema=public
```

**Examples:**

Development (local):
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/qa_article_faq?schema=public"
```

Production (Neon):
```bash
DATABASE_URL="postgresql://user:password@ep-example-123456.us-east-2.aws.neon.tech/qa_article_faq?sslmode=require"
```

Production (Railway):
```bash
DATABASE_URL="postgresql://postgres:password@containers-us-west-123.railway.app:5432/railway"
```

**Notes:**
- Must start with `postgresql://`
- Include `?sslmode=require` for cloud databases
- Keep credentials secure and never commit to version control

---

### API Security

#### `INGEST_API_KEY`

Static API key for authenticating webhook requests.

**Format:** String (minimum 32 characters recommended)

**Example:**
```bash
INGEST_API_KEY="your-secure-api-key-here-min-32-chars"
```

**Generate:**
```bash
openssl rand -base64 32
```

**Usage:**
- Required in `x-api-key` header for `/api/ingest` and `/api/revalidate` endpoints
- Used for webhook authentication
- Should be different from `INGEST_WEBHOOK_SECRET`

**Security:**
- Minimum 32 characters
- Use cryptographically secure random generation
- Rotate periodically
- Never expose in client-side code

---

#### `INGEST_WEBHOOK_SECRET`

Secret key for HMAC-SHA256 signature verification of webhook payloads.

**Format:** String (minimum 32 characters recommended)

**Example:**
```bash
INGEST_WEBHOOK_SECRET="your-webhook-secret-here-min-32-chars"
```

**Generate:**
```bash
openssl rand -base64 32
```

**Usage:**
- Used to generate and verify HMAC signatures
- Ensures webhook payload integrity and authenticity
- Required for `/api/ingest` and `/api/revalidate` endpoints

**Security:**
- Minimum 32 characters
- Must be kept secret
- Different from `INGEST_API_KEY`
- Rotate if compromised

---

### NextAuth Configuration

#### `NEXTAUTH_SECRET`

Secret key for NextAuth.js session encryption and JWT signing.

**Format:** String (minimum 32 characters recommended)

**Example:**
```bash
NEXTAUTH_SECRET="your-nextauth-secret-here-min-32-chars"
```

**Generate:**
```bash
openssl rand -base64 32
```

**Usage:**
- Encrypts session cookies
- Signs JWT tokens
- Required for admin authentication

**Security:**
- Minimum 32 characters
- Must be unique per environment
- Rotate if compromised (will invalidate all sessions)
- Never expose publicly

---

#### `NEXTAUTH_URL`

The canonical URL of your application.

**Format:** Full URL including protocol

**Examples:**

Development:
```bash
NEXTAUTH_URL="http://localhost:3000"
```

Production:
```bash
NEXTAUTH_URL="https://your-domain.com"
```

**Usage:**
- Used for OAuth callbacks
- Required for NextAuth.js to function
- Must match your actual domain

**Notes:**
- Use `https://` in production
- No trailing slash
- Must be accessible from the internet for OAuth providers

---

### Admin Authentication

#### `ADMIN_EMAIL`

Default admin user email address.

**Format:** Valid email address

**Example:**
```bash
ADMIN_EMAIL="admin@example.com"
```

**Usage:**
- Creates default admin user during database seeding
- Used for initial admin login
- Can be changed after first login

**Security:**
- Use a real email address you control
- Change after initial setup if needed

---

#### `ADMIN_PASSWORD`

Default admin user password.

**Format:** String (minimum 8 characters)

**Example:**
```bash
ADMIN_PASSWORD="your-secure-admin-password"
```

**Usage:**
- Sets password for default admin user
- Used for initial admin login
- **MUST be changed after first login**

**Security:**
- Minimum 8 characters (longer is better)
- Use a strong, unique password
- **Change immediately after first login**
- Never use default password in production
- Password is hashed with bcrypt before storage

---

### Application Configuration

#### `NEXT_PUBLIC_API_URL`

Base URL for API calls, used in server-side rendering and client-side code.

**Format:** Full URL including protocol

**Examples:**

Development:
```bash
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

Production:
```bash
NEXT_PUBLIC_API_URL="https://your-domain.com"
```

**Usage:**
- Used for constructing API URLs
- Accessible in client-side code (prefix: `NEXT_PUBLIC_`)
- Required for server-side rendering

**Notes:**
- Use `https://` in production
- No trailing slash
- Must match your actual domain

---

## Optional Variables

### Test Database

#### `TEST_DATABASE_URL`

Separate database connection string for running tests.

**Format:** Same as `DATABASE_URL`

**Example:**
```bash
TEST_DATABASE_URL="postgresql://postgres:password@localhost:5432/qa_article_faq_test?schema=public"
```

**Usage:**
- Used by test suite to avoid affecting production data
- Falls back to `DATABASE_URL` if not set
- Recommended for development

**Notes:**
- Should point to a separate database
- Database will be reset during tests
- Not required but highly recommended

---

## Environment-Specific Configuration

### Development Environment

Minimal configuration for local development:

```bash
# Database (local PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/qa_article_faq?schema=public"
TEST_DATABASE_URL="postgresql://postgres:password@localhost:5432/qa_article_faq_test?schema=public"

# API Security (generate with: openssl rand -base64 32)
INGEST_API_KEY="dev-api-key-replace-in-production"
INGEST_WEBHOOK_SECRET="dev-webhook-secret-replace-in-production"

# NextAuth (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="dev-nextauth-secret-replace-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Admin (change after first login)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"

# Application
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

**Notes:**
- Use simple passwords for development
- HTTP is acceptable for localhost
- Generate proper secrets even for development

---

### Production Environment

Secure configuration for production deployment:

```bash
# Database (cloud PostgreSQL with SSL)
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# API Security (32+ character secrets)
INGEST_API_KEY="<generated-with-openssl-rand-base64-32>"
INGEST_WEBHOOK_SECRET="<generated-with-openssl-rand-base64-32>"

# NextAuth (32+ character secret)
NEXTAUTH_SECRET="<generated-with-openssl-rand-base64-32>"
NEXTAUTH_URL="https://your-domain.com"

# Admin (strong password, change after first login)
ADMIN_EMAIL="admin@your-domain.com"
ADMIN_PASSWORD="<strong-unique-password>"

# Application
NEXT_PUBLIC_API_URL="https://your-domain.com"
```

**Security Checklist:**
- [ ] All secrets are 32+ characters
- [ ] All URLs use HTTPS
- [ ] Admin password is strong and unique
- [ ] Database uses SSL (`sslmode=require`)
- [ ] Secrets are different from development
- [ ] `.env` file is not committed to version control
- [ ] Admin password changed after first login

---

## Validation

### Automatic Validation

The application validates environment variables at startup:

```bash
# Validate environment
npm run verify:env
```

This checks:
- All required variables are present
- Variables have correct format
- Secrets meet minimum length requirements
- URLs are properly formatted
- Email addresses are valid

### Manual Validation

Check specific variables:

```bash
# Check if variable is set
echo $DATABASE_URL

# Test database connection
npx prisma db pull

# Test admin authentication
npm run verify:auth
```

---

## Security Best Practices

### Secret Generation

Always use cryptographically secure random generation:

```bash
# Generate a 32-character base64 secret
openssl rand -base64 32

# Generate a 64-character hex secret
openssl rand -hex 32

# Generate multiple secrets at once
for i in {1..3}; do openssl rand -base64 32; done
```

### Secret Management

1. **Never commit secrets to version control**
   - Add `.env` to `.gitignore`
   - Use `.env.example` as template (without real values)

2. **Use different secrets per environment**
   - Development secrets ≠ Production secrets
   - Rotate secrets periodically

3. **Store secrets securely**
   - Use environment variable management tools
   - Consider using secret management services (AWS Secrets Manager, HashiCorp Vault)

4. **Limit secret access**
   - Only give secrets to those who need them
   - Use role-based access control

### Password Requirements

For `ADMIN_PASSWORD`:
- Minimum 8 characters (12+ recommended)
- Mix of uppercase, lowercase, numbers, symbols
- Not a common password
- Unique to this application
- **Change immediately after first login**

### URL Security

In production:
- Always use HTTPS for `NEXTAUTH_URL` and `NEXT_PUBLIC_API_URL`
- Ensure SSL certificates are valid
- Enable HSTS headers
- Use secure cookies

---

## Troubleshooting

### Common Issues

#### "Missing required environment variable"

**Problem:** Required variable not set in `.env`

**Solution:**
1. Check `.env` file exists
2. Verify variable name is correct (case-sensitive)
3. Ensure no spaces around `=`
4. Restart application after changes

#### "Invalid DATABASE_URL"

**Problem:** Database connection string format is incorrect

**Solution:**
1. Verify format: `postgresql://user:password@host:port/database`
2. Check for special characters in password (URL encode if needed)
3. Test connection: `npx prisma db pull`

#### "NEXTAUTH_SECRET must be provided"

**Problem:** NextAuth secret not set or too short

**Solution:**
1. Generate secret: `openssl rand -base64 32`
2. Add to `.env`: `NEXTAUTH_SECRET="generated-secret"`
3. Restart application

#### "Admin login fails"

**Problem:** Admin credentials incorrect or not seeded

**Solution:**
1. Verify `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`
2. Run seed script: `npm run seed:append`
3. Check user exists: `npx prisma studio`
4. Try password reset if available

### Debug Mode

Enable debug logging for environment issues:

```bash
# Show all environment variables (be careful with secrets!)
node -e "console.log(process.env)"

# Check specific variable
node -e "console.log(process.env.DATABASE_URL)"

# Validate environment
npm run verify:env
```

---

## Migration from Previous Versions

If upgrading from a version without CMS features:

### New Required Variables

Add these to your existing `.env`:

```bash
# NextAuth (new)
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"
NEXTAUTH_URL="http://localhost:3000"  # or your domain

# Admin (new)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"  # change after first login
```

### Existing Variables

These remain unchanged:
- `DATABASE_URL`
- `INGEST_API_KEY`
- `INGEST_WEBHOOK_SECRET`
- `NEXT_PUBLIC_API_URL`

### Migration Steps

1. Add new variables to `.env`
2. Generate secure secrets
3. Run migrations: `npx prisma migrate deploy`
4. Seed CMS data: `npm run seed:append`
5. Verify: `npm run verify:env`

See [Migration Guide](migration-guide.md) for complete instructions.

---

## Reference

### All Variables Summary

| Variable | Required | Type | Default | Description |
|----------|----------|------|---------|-------------|
| `DATABASE_URL` | Yes | String | - | PostgreSQL connection string |
| `TEST_DATABASE_URL` | No | String | `DATABASE_URL` | Test database connection |
| `INGEST_API_KEY` | Yes | String | - | Webhook API key (32+ chars) |
| `INGEST_WEBHOOK_SECRET` | Yes | String | - | HMAC secret (32+ chars) |
| `NEXTAUTH_SECRET` | Yes | String | - | Session secret (32+ chars) |
| `NEXTAUTH_URL` | Yes | URL | - | Application URL |
| `ADMIN_EMAIL` | Yes | Email | - | Default admin email |
| `ADMIN_PASSWORD` | Yes | String | - | Default admin password (8+ chars) |
| `NEXT_PUBLIC_API_URL` | Yes | URL | - | Public API base URL |

### Validation Rules

- **DATABASE_URL**: Must start with `postgresql://`
- **INGEST_API_KEY**: Minimum 32 characters
- **INGEST_WEBHOOK_SECRET**: Minimum 32 characters
- **NEXTAUTH_SECRET**: Minimum 32 characters
- **NEXTAUTH_URL**: Must be valid URL (http:// or https://)
- **ADMIN_EMAIL**: Must be valid email format
- **ADMIN_PASSWORD**: Minimum 8 characters
- **NEXT_PUBLIC_API_URL**: Must be valid URL (http:// or https://)

### Production Warnings

The validation script will warn about:
- Default admin password (`admin123`)
- HTTP URLs in production (should use HTTPS)
- Secrets shorter than 32 characters
- Missing optional but recommended variables

---

## Additional Resources

- [Getting Started Guide](getting-started.md)
- [Migration Guide](migration-guide.md)
- [Database Setup](database-setup.md)
- [Docker Setup](docker-setup.md)
- [Security Best Practices](../architecture/security.md)

---

## Support

If you encounter issues with environment configuration:

1. Run validation: `npm run verify:env`
2. Check logs for specific errors
3. Review this documentation
4. Check `.env.example` for reference format
5. Ensure `.env` file is in project root
6. Restart application after changes

For security concerns, never share your `.env` file or secrets publicly!
