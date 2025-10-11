# Project Structure & Organization

## Root Level Organization

### Configuration Files
- `package.json` - Dependencies and npm scripts
- `tsconfig.json` - TypeScript configuration with strict mode
- `next.config.js` - Next.js configuration with performance optimizations
- `tailwind.config.ts` - Tailwind CSS configuration with custom design system
- `vitest.config.ts` - Testing configuration
- `.eslintrc.json` - ESLint rules for Next.js and TypeScript
- `docker-compose.yml` - Docker development environment
- `Dockerfile` - Production container configuration

### Core Directories

#### `/src` - Application Source Code
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API route handlers
│   │   ├── ingest/        # POST /api/ingest - Webhook ingestion
│   │   ├── topics/        # GET /api/topics - Public API
│   │   ├── revalidate/    # POST /api/revalidate - Cache management
│   │   └── admin/         # Admin API endpoints
│   ├── admin/             # Admin interface pages
│   └── (public)/          # Public-facing pages
├── components/            # React components
│   ├── ui/               # Reusable UI components (Radix-based)
│   ├── admin/            # Admin-specific components
│   └── forms/            # Form components with validation
├── lib/                  # Utility libraries and services
│   ├── security/         # HMAC verification, timing-safe comparison
│   ├── validation/       # Zod schemas
│   ├── services/         # Business logic layer
│   ├── repositories/     # Data access layer
│   └── db.ts            # Prisma client singleton
├── hooks/                # Custom React hooks
├── contexts/             # React context providers
└── types/                # TypeScript type definitions
```

#### `/prisma` - Database Schema & Migrations
- `schema.prisma` - Complete database schema with indexes
- `migrations/` - Database migration files
- `seed.ts` - Database seeding script

#### `/docs` - Comprehensive Documentation
```
docs/
├── setup/                # Installation and configuration guides
├── architecture/         # System design documentation
├── api/                  # API reference documentation
├── admin/                # Admin interface guides
├── testing/              # Testing procedures and guidelines
└── reports/              # Test reports and audit results
```

#### `/tests` - Test Suite Organization
```
tests/
├── unit/                 # Unit tests
│   ├── api/             # API logic tests
│   └── lib/             # Library function tests
├── integration/          # Integration tests
├── e2e/                 # End-to-end tests
├── utils/               # Test utilities and helpers
└── setup.ts             # Test environment setup
```

#### `/scripts` - Utility Scripts
```
scripts/
├── test/                # Test execution scripts
├── verify/              # Feature verification scripts
└── performance/         # Performance testing scripts
```

#### `/test-requests` - API Testing Examples
- Postman collections
- cURL examples
- Security test scripts
- Sample request/response data

## File Naming Conventions

### Components
- **UI Components**: PascalCase (e.g., `Button.tsx`, `DataTable.tsx`)
- **Page Components**: PascalCase matching route structure
- **Hook Files**: camelCase with `use` prefix (e.g., `useAuth.ts`)

### API Routes
- **Route Handlers**: `route.ts` in App Router structure
- **Dynamic Routes**: `[slug]/route.ts` for parameterized endpoints
- **Nested Routes**: Follow directory structure matching URL paths

### Database & Types
- **Prisma Schema**: `schema.prisma` with clear model definitions
- **Type Files**: `*.types.ts` or within `/types` directory
- **Validation Schemas**: `schemas.ts` with Zod definitions

## Code Organization Patterns

### Layered Architecture
1. **API Layer**: Route handlers in `/app/api`
2. **Service Layer**: Business logic in `/lib/services`
3. **Repository Layer**: Data access in `/lib/repositories`
4. **Validation Layer**: Zod schemas in `/lib/validation`

### Component Structure
- **Atomic Design**: UI components follow atomic design principles
- **Feature-Based**: Admin components grouped by functionality
- **Shared Components**: Reusable components in `/components/ui`

### Import Conventions
- **Absolute Imports**: Use `@/` alias for src directory imports
- **Relative Imports**: Only for closely related files
- **Barrel Exports**: Use index files for clean imports

## Environment & Configuration

### Environment Files
- `.env.example` - Template with all required variables
- `.env` - Local development environment (gitignored)
- Environment variables follow `SCREAMING_SNAKE_CASE`

### Configuration Hierarchy
1. **Next.js Config**: Performance and build optimizations
2. **Tailwind Config**: Design system and responsive breakpoints
3. **TypeScript Config**: Strict typing with path aliases
4. **ESLint Config**: Code quality and consistency rules

## Deployment Structure

### Docker Configuration
- **Multi-stage Dockerfile**: Optimized for production
- **docker-compose.yml**: Development environment setup
- **Standalone Output**: Next.js standalone mode for containers

### Build Artifacts
- `.next/` - Next.js build output (gitignored)
- `node_modules/` - Dependencies (gitignored)
- `prisma/migrations/` - Database migrations (tracked)

## Documentation Standards

### Code Documentation
- **JSDoc Comments**: For complex functions and APIs
- **README Files**: In each major directory explaining purpose
- **Type Annotations**: Comprehensive TypeScript typing

### API Documentation
- **OpenAPI/Swagger**: API specifications
- **Example Requests**: In `/test-requests` directory
- **Response Schemas**: Documented with Zod schemas