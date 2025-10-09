# Project Structure & Conventions

## Directory Organization

### `/src` - Application Source Code

#### `/src/app` - Next.js App Router
- **File-based routing**: Each folder with `route.ts` is an endpoint
- **Route groups**: `(public)` for public pages, `admin` for protected pages
- **API routes**: `/src/app/api/[endpoint]/route.ts`
- **Layouts**: `layout.tsx` for shared layouts
- **Metadata**: `robots.ts`, `sitemap.ts` for SEO

#### `/src/lib` - Shared Libraries (Organized by Concern)
- `security/` - HMAC verification, timing-safe comparison
- `validation/` - Zod schemas for request/response validation
- `services/` - Business logic layer (e.g., `content.service.ts`)
- `repositories/` - Data access layer (e.g., `content.repository.ts`)
- `api/` - API client utilities
- `utils/` - General utilities
- `tiptap/` - Rich text editor configuration
- `db.ts` - Prisma client singleton
- `auth.ts` - NextAuth configuration

#### `/src/components` - React Components
- `ui/` - Reusable UI components (shadcn/ui pattern)
- `admin/` - Admin-specific components
- `public/` - Public-facing components

#### `/src/types` - TypeScript Definitions
- `api.ts` - API request/response types
- `next-auth.d.ts` - NextAuth type extensions

#### `/src/hooks` - React Hooks
- Custom hooks like `use-toast.ts`

### `/prisma` - Database
- `schema.prisma` - Database schema definition
- `migrations/` - Database migration files

### `/tests` - Test Code (Organized by Type)
- `unit/` - Pure unit tests (mocked dependencies)
  - `unit/api/` - API logic unit tests
  - `unit/lib/` - Library unit tests
- `integration/` - Integration tests (real database)
- `e2e/` - End-to-end tests (full workflows)
- `utils/` - Test utilities and helpers
- `setup.ts` - Vitest setup file

### `/scripts` - Utility Scripts (Organized by Function)
- `test/` - Test execution scripts (prefix: `test-`)
- `verify/` - Configuration verification scripts (prefix: `verify-`)
- `performance/` - Performance testing scripts
- `README.md` - Script documentation

### `/docs` - Documentation (Organized by Purpose)
- `setup/` - Installation and configuration guides
- `architecture/` - System design and architecture docs
- `testing/` - Testing guides and procedures
- `reports/` - Test reports and audit results
- Each subdirectory has a `README.md` index

### `/test-requests` - API Testing Examples
- Example JSON payloads
- Postman collections
- Test scripts for manual API testing

### `/public` - Static Assets
- `uploads/` - User-uploaded files

## Naming Conventions

### Files
- **Components**: PascalCase (e.g., `TopicList.tsx`)
- **Utilities**: kebab-case (e.g., `content.service.ts`)
- **Tests**: `*.test.ts` or `*.spec.ts`
- **API Routes**: `route.ts` (Next.js convention)
- **Documentation**: kebab-case (e.g., `getting-started.md`)

### Code
- **Variables/Functions**: camelCase
- **Types/Interfaces**: PascalCase
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Database Models**: PascalCase (Prisma convention)

## Architecture Patterns

### Layered Architecture
1. **Route Handlers** (`src/app/api/*/route.ts`) - HTTP layer
2. **Services** (`src/lib/services/`) - Business logic
3. **Repositories** (`src/lib/repositories/`) - Data access
4. **Prisma Client** (`src/lib/db.ts`) - Database

### Key Principles
- **Separation of concerns**: Each layer has a single responsibility
- **Dependency injection**: Pass dependencies explicitly
- **Type safety**: Use TypeScript and Zod for validation
- **Security first**: Validate all inputs, use HMAC for webhooks
- **Caching**: Use Next.js cache tags for efficient invalidation

## Code Style

### TypeScript
- Strict mode enabled
- Avoid `any` type - use proper typing
- Define interfaces for all data structures
- Use Zod for runtime validation

### ESLint Rules
- `@typescript-eslint/no-explicit-any`: warn
- `@typescript-eslint/no-unused-vars`: warn
- `react-hooks/exhaustive-deps`: warn
- `react/no-unescaped-entities`: off

### Imports
- Use path alias: `@/` for `src/`
- Group imports: external, internal, types
- Prefer named exports over default exports

## Environment Variables

Required variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `INGEST_API_KEY` - Static API key for protected endpoints
- `INGEST_WEBHOOK_SECRET` - Secret for HMAC signature verification
- `NEXTAUTH_SECRET` - NextAuth session secret
- `NEXTAUTH_URL` - Application URL

## Common Patterns

### API Route Structure
```typescript
export async function POST(request: Request) {
  // 1. Validate authentication
  // 2. Parse and validate request body with Zod
  // 3. Call service layer
  // 4. Return JSON response with proper status code
}
```

### Service Layer
```typescript
// Business logic, no HTTP concerns
export async function createTopic(data: TopicInput) {
  // Validate business rules
  // Call repository layer
  // Return domain objects
}
```

### Repository Layer
```typescript
// Data access only, uses Prisma
export async function findTopicBySlug(slug: string) {
  return prisma.topic.findUnique({ where: { slug } });
}
```

## Testing Strategy

- **Unit tests**: Test individual functions with mocked dependencies
- **Integration tests**: Test API endpoints with real database
- **E2E tests**: Test complete user workflows
- Test timeout: 10 seconds (for database operations)
- Use `describe` blocks to group related tests
- Test naming: `should [expected behavior] when [condition]`
