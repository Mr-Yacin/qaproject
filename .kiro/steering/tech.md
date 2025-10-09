# Tech Stack

## Framework & Runtime

- **Next.js 14+** with App Router (file-based routing)
- **React 18** for UI components
- **TypeScript 5** (strict mode enabled)
- **Node.js** runtime

## Database & ORM

- **PostgreSQL** database
- **Prisma ORM** for data access
- Database schema: `prisma/schema.prisma`
- Migrations: `prisma/migrations/`

## Validation & Security

- **Zod** for schema validation and runtime type checking
- **HMAC-SHA256** for webhook signature verification
- **NextAuth.js** for admin authentication
- Timing-safe comparison for security-sensitive operations

## UI & Styling

- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **shadcn/ui** component patterns
- **Lucide React** for icons
- **TipTap** for rich text editing

## Testing

- **Vitest** as test runner
- Test types: unit, integration, e2e
- Path alias: `@/` maps to `./src/`

## Common Commands

### Development
```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint
```

### Database
```bash
npx prisma migrate dev   # Create and apply migration
npx prisma migrate deploy # Apply migrations (production)
npx prisma generate      # Generate Prisma client
npx prisma studio        # Open Prisma Studio GUI
```

### Testing
```bash
npm test                 # Run all tests with Vitest
npm run test:coverage    # Run tests with coverage
npm run test:watch       # Run tests in watch mode
```

### Docker
```bash
npm run docker:build     # Build Docker image
npm run docker:up        # Start containers
npm run docker:down      # Stop containers
npm run docker:migrate   # Run migrations in container
```

### Verification Scripts
```bash
npm run verify:auth      # Verify admin authentication
npm run verify:caching   # Verify caching strategy
npm run verify:code-splitting # Verify code splitting
```

### Performance
```bash
npm run perf:lighthouse  # Run Lighthouse tests
npm run perf:simple      # Run simple performance tests
```

## Build Configuration

- **Output**: Standalone (for Docker)
- **Image Optimization**: WebP/AVIF formats, lazy loading enabled
- **Path Aliases**: `@/*` resolves to `src/*`
- **Module Resolution**: Bundler mode
