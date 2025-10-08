# CMS Frontend Setup Documentation

This document describes the setup and configuration for the CMS frontend feature.

## Installed Dependencies

### Core Dependencies
- **Next.js 14.2+**: React framework with App Router
- **React 18.3+**: UI library
- **TypeScript 5.0+**: Type safety

### Styling & UI
- **Tailwind CSS 3.4**: Utility-first CSS framework
- **tailwindcss-animate**: Animation utilities for Tailwind
- **PostCSS & Autoprefixer**: CSS processing
- **@tailwindcss/typography**: Typography plugin
- **shadcn/ui utilities**:
  - `class-variance-authority`: Component variants
  - `clsx`: Conditional classes
  - `tailwind-merge`: Merge Tailwind classes
- **lucide-react**: Icon library

### Authentication
- **NextAuth.js 4.24+**: Authentication for Next.js

### Forms & Validation
- **React Hook Form 7.64+**: Form state management
- **@hookform/resolvers**: Form validation resolvers
- **Zod 3.23+**: Schema validation

### Rich Text Editor
- **@tiptap/react**: React wrapper for Tiptap
- **@tiptap/starter-kit**: Essential Tiptap extensions
- **@tiptap/extension-link**: Link support
- **@tiptap/extension-image**: Image support

## Configuration Files

### Tailwind CSS (`tailwind.config.ts`)
- Custom color palette with primary, secondary, success, warning, error colors
- CSS variables for theming (light/dark mode support)
- Custom breakpoints for responsive design
- Animation utilities for accordions and transitions
- shadcn/ui compatible configuration

### PostCSS (`postcss.config.js`)
- Tailwind CSS processing
- Autoprefixer for browser compatibility

### Next.js (`next.config.js`)
- Standalone output for Docker deployment
- Image optimization with WebP and AVIF formats
- Remote image patterns configured

### shadcn/ui (`components.json`)
- Component library configuration
- Path aliases: `@/components`, `@/lib/utils`
- CSS variables enabled for theming

### TypeScript (`tsconfig.json`)
- Path alias `@/*` maps to `./src/*`
- Strict mode enabled
- Next.js plugin configured

## Environment Variables

The following environment variables need to be configured in `.env`:

```bash
# Database
DATABASE_URL="postgresql://..."
TEST_DATABASE_URL="postgresql://..."

# Security
INGEST_API_KEY="your-api-key-here"
INGEST_WEBHOOK_SECRET="your-webhook-secret-here"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Admin Authentication
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="your-secure-admin-password"
```

## File Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with global CSS
│   └── globals.css         # Tailwind directives and CSS variables
├── lib/
│   └── utils.ts            # Utility functions (cn helper)
└── types/
    └── next-auth.d.ts      # NextAuth type definitions
```

## Global Styles

The `src/app/globals.css` file includes:
- Tailwind directives (`@tailwind base/components/utilities`)
- CSS variables for theming (light and dark mode)
- Base styles for consistent appearance

## Utility Functions

### `cn()` - Class Name Merger
Located in `src/lib/utils.ts`, this function merges Tailwind classes intelligently:

```typescript
import { cn } from '@/lib/utils'

// Usage
<div className={cn("base-class", condition && "conditional-class")} />
```

## Next Steps

With the project setup complete, you can now:

1. Install shadcn/ui components as needed using:
   ```bash
   npx shadcn-ui@latest add [component-name]
   ```

2. Create the public layout and components (Task 2)
3. Implement API client layer (Task 3)
4. Build authentication system (Task 10)
5. Create admin dashboard (Tasks 11-16)

## Build & Development

```bash
# Development
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run tests
npm test
```

## Verification

The setup has been verified with:
- ✅ Successful production build
- ✅ No TypeScript errors
- ✅ All dependencies installed correctly
- ✅ Tailwind CSS configured and working
- ✅ Next.js configuration optimized
