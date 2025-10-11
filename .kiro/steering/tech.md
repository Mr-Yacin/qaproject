# Technology Stack

## Core Framework & Runtime
- **Next.js 14+**: App Router with standalone output for production
- **TypeScript**: Strict mode enabled for type safety
- **Node.js**: Runtime environment
- **React 18**: UI framework with hooks and modern patterns

## Database & ORM
- **PostgreSQL**: Primary database
- **Prisma ORM**: Database toolkit with type-safe client
- **Database Features**: Comprehensive indexing, cascading deletes, enum types

## Authentication & Security
- **NextAuth.js**: Session-based authentication for admin
- **HMAC-SHA256**: Webhook signature verification
- **bcrypt**: Password hashing
- **Role-based Access Control**: Admin, Editor, Viewer roles

## UI & Styling
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **TipTap**: Rich text editor for content management
- **DND Kit**: Drag and drop functionality

## Validation & Type Safety
- **Zod**: Runtime type validation and schema parsing
- **TypeScript**: Compile-time type checking
- **React Hook Form**: Form validation with Zod resolvers

## Testing
- **Vitest**: Unit and integration testing framework
- **Puppeteer**: End-to-end testing and performance testing
- **Test Coverage**: Comprehensive test suite with setup files

## Development Tools
- **ESLint**: Code linting with Next.js and TypeScript rules
- **Prettier**: Code formatting (implied by project structure)
- **Docker**: Containerization with docker-compose for development

## Performance & Optimization
- **Next.js Image Optimization**: WebP/AVIF support, responsive images
- **Code Splitting**: Custom webpack configuration for vendor/admin/UI chunks
- **Caching Strategy**: Next.js cache with revalidation tags
- **Bundle Optimization**: Package import optimization for Lucide and Radix

## Common Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database
```bash
npx prisma migrate dev    # Run database migrations
npm run seed             # Seed database with sample data
npm run seed:large       # Seed with larger dataset (50 items)
npm run seed:append      # Append to existing data
```

### Testing
```bash
npm test                 # Run unit tests with Vitest
npm run test:cms         # Test CMS API via Docker
npm run test:homepage    # Test homepage functionality
npm run test:admin-auth  # Test admin authentication
npm run test:cache       # Test cache revalidation
```

### Verification Scripts
```bash
npm run verify:all       # Verify all features
npm run verify:auth      # Verify admin authentication
npm run verify:caching   # Verify caching strategy
npm run verify:env       # Verify environment setup
npm run verify:seed      # Verify seed data
```

### Performance Testing
```bash
npm run perf:lighthouse  # Run Lighthouse performance tests
npm run perf:simple      # Run simple performance tests
```

### Docker Operations
```bash
npm run docker:build     # Build Docker image
npm run docker:up        # Start containers
npm run docker:down      # Stop containers
npm run docker:migrate   # Run migrations in container
npm run docker:test      # Full Docker test suite
```

## Architecture Patterns
- **Repository Pattern**: Data access abstraction
- **Service Layer**: Business logic separation
- **API Route Handlers**: Next.js App Router API endpoints
- **Middleware**: Request processing and authentication
- **Component Composition**: Reusable UI components with proper separation