# Error Handling System

This directory contains a comprehensive error handling system for both server-side (API routes) and client-side (React components) error management.

## Overview

The error handling system provides:
- Custom error classes with appropriate HTTP status codes
- Centralized error handling for API routes
- Client-side error display with toast notifications
- Validation error formatting
- Network error handling

## Server-Side Error Handling

### Custom Error Classes

Located in `cms-errors.ts`:

```typescript
import { 
  CMSError, 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError, 
  ForbiddenError, 
  DuplicateError,
  InternalServerError 
} from '@/lib/errors';
```

#### Available Error Classes

- **CMSError**: Base class for all CMS errors
- **ValidationError** (400): Input validation failures
- **NotFoundError** (404): Resource not found
- **UnauthorizedError** (401): Authentication required
- **ForbiddenError** (403): Insufficient permissions
- **DuplicateError** (409): Resource already exists
- **InternalServerError** (500): Unexpected server errors

#### Usage in Services

```typescript
// In a service method
async getPageBySlug(slug: string): Promise<Page> {
  const page = await this.repository.findBySlug(slug);
  
  if (!page) {
    throw new NotFoundError(`Page with slug "${slug}"`);
  }
  
  return page;
}

async createPage(data: CreatePageInput): Promise<Page> {
  const exists = await this.repository.slugExists(data.slug);
  
  if (exists) {
    throw new DuplicateError(`Page with slug "${data.slug}"`);
  }
  
  return this.repository.create(data);
}
```

### API Route Error Handler

Located in `error-handler.ts`:

```typescript
import { handleAPIError } from '@/lib/errors';

export async function POST(request: Request) {
  try {
    // Your route logic here
    const data = await request.json();
    const result = await service.create(data);
    return Response.json(result, { status: 201 });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

The `handleAPIError` function automatically:
- Converts CMS errors to appropriate HTTP responses
- Formats Zod validation errors
- Handles Prisma database errors
- Logs errors for debugging
- Returns consistent error response format

#### Error Response Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    // Optional additional details
  }
}
```

### Prisma Error Handling

The error handler automatically converts Prisma errors:

- **P2002** (Unique constraint): 409 Conflict
- **P2025** (Record not found): 404 Not Found
- **P2003** (Foreign key violation): 400 Bad Request
- **P2018** (Required record not found): 404 Not Found

## Client-Side Error Handling

### Toast Notifications

Located in `client-error-handler.ts`:

```typescript
import { 
  showErrorToast, 
  showSuccessToast, 
  showInfoToast 
} from '@/lib/errors';
```

#### Display Error Messages

```typescript
try {
  const response = await fetch('/api/admin/pages', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    await handleFetchError(response);
  }
  
  const result = await response.json();
  showSuccessToast('Page created successfully');
} catch (error) {
  showErrorToast(error, 'Failed to create page');
}
```

#### Available Toast Functions

```typescript
// Error toast (red)
showErrorToast(error, 'Optional fallback message');

// Success toast (green)
showSuccessToast('Operation successful', 'Optional description');

// Info toast (blue)
showInfoToast('Information', 'Optional description');
```

### Form Validation Errors

```typescript
import { formatValidationError } from '@/lib/errors';

try {
  // API call
} catch (error) {
  const errorMessage = formatValidationError(error);
  setFormError(errorMessage);
}
```

### Network Error Handling

```typescript
import { handleNetworkError } from '@/lib/errors';

try {
  const response = await fetch('/api/endpoint');
} catch (error) {
  const message = handleNetworkError(error);
  showErrorToast(message);
}
```

### Fetch Error Helper

```typescript
import { handleFetchError } from '@/lib/errors';

const response = await fetch('/api/endpoint', {
  method: 'POST',
  body: JSON.stringify(data),
});

if (!response.ok) {
  await handleFetchError(response); // Throws parsed error
}

const result = await response.json();
```

### Async Operation Wrapper

```typescript
import { withClientErrorHandling } from '@/lib/errors';

const result = await withClientErrorHandling(
  async () => {
    const response = await fetch('/api/endpoint');
    return response.json();
  },
  'Failed to fetch data'
);

// result will be undefined if error occurred
if (result) {
  // Handle success
}
```

## Complete Example

### Service Layer

```typescript
// src/lib/services/page.service.ts
import { NotFoundError, DuplicateError } from '@/lib/errors';

export class PageService {
  async createPage(data: CreatePageInput): Promise<Page> {
    const exists = await this.repository.slugExists(data.slug);
    
    if (exists) {
      throw new DuplicateError(`Page with slug "${data.slug}"`);
    }
    
    return this.repository.create(data);
  }
  
  async getPage(slug: string): Promise<Page> {
    const page = await this.repository.findBySlug(slug);
    
    if (!page) {
      throw new NotFoundError(`Page with slug "${slug}"`);
    }
    
    return page;
  }
}
```

### API Route

```typescript
// src/app/api/admin/pages/route.ts
import { handleAPIError } from '@/lib/errors';
import { PageService } from '@/lib/services/page.service';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const service = new PageService();
    const page = await service.createPage(data);
    
    return Response.json(page, { status: 201 });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

### React Component

```typescript
// src/components/admin/pages/PageForm.tsx
'use client';

import { showErrorToast, showSuccessToast, handleFetchError } from '@/lib/errors';

export function PageForm() {
  const [saving, setSaving] = useState(false);
  
  const handleSubmit = async (data: FormData) => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/admin/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        await handleFetchError(response);
      }
      
      const page = await response.json();
      showSuccessToast('Page created successfully');
      router.push(`/admin/pages/${page.slug}`);
    } catch (error) {
      showErrorToast(error, 'Failed to create page');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

## Best Practices

### Server-Side

1. **Always use try-catch in API routes** and call `handleAPIError(error)`
2. **Throw specific error types** in services (NotFoundError, ValidationError, etc.)
3. **Let Prisma errors bubble up** - they'll be handled automatically
4. **Include context in error messages** - e.g., "Page with slug 'about'"
5. **Log errors** for debugging (handled automatically by `handleAPIError`)

### Client-Side

1. **Always handle fetch errors** with `handleFetchError` or try-catch
2. **Show user-friendly messages** using toast notifications
3. **Provide fallback messages** for unexpected errors
4. **Handle network errors gracefully** with `handleNetworkError`
5. **Display validation errors** near form fields when possible

### Error Messages

1. **Be specific** - "Page with slug 'about' not found" vs "Not found"
2. **Be actionable** - Tell users what they can do to fix the issue
3. **Be consistent** - Use the same terminology across the app
4. **Avoid technical jargon** - Users don't need to know about Prisma errors
5. **Include context** - What operation failed and why

## Testing

### Testing Error Handling

```typescript
// Test service errors
describe('PageService', () => {
  it('should throw NotFoundError when page does not exist', async () => {
    const service = new PageService(mockRepository);
    
    await expect(service.getPage('nonexistent')).rejects.toThrow(NotFoundError);
  });
  
  it('should throw DuplicateError when slug exists', async () => {
    const service = new PageService(mockRepository);
    
    await expect(service.createPage({ slug: 'existing' })).rejects.toThrow(DuplicateError);
  });
});

// Test API error responses
describe('POST /api/admin/pages', () => {
  it('should return 409 when slug exists', async () => {
    const response = await fetch('/api/admin/pages', {
      method: 'POST',
      body: JSON.stringify({ slug: 'existing' }),
    });
    
    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.code).toBe('DUPLICATE');
  });
});
```

## Migration Guide

### Updating Existing Code

1. **Replace custom error classes** with CMS error classes
2. **Replace manual error handling** with `handleAPIError`
3. **Replace toast calls** with error handling utilities
4. **Update error messages** to be more specific

### Before

```typescript
// Old way
export async function POST(request: Request) {
  try {
    // logic
  } catch (error) {
    if (error instanceof CustomError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### After

```typescript
// New way
import { handleAPIError } from '@/lib/errors';

export async function POST(request: Request) {
  try {
    // logic
  } catch (error) {
    return handleAPIError(error);
  }
}
```

## Troubleshooting

### Error not showing in toast

- Check that `<Toaster />` is included in your layout
- Verify you're importing from `@/lib/errors` not `@/hooks/use-toast`

### Wrong status code returned

- Check that you're throwing the correct error type
- Verify the error is being caught and handled by `handleAPIError`

### Validation errors not formatted

- Ensure you're using Zod schemas for validation
- Check that the error is being passed to `formatValidationError`

### Network errors not handled

- Use `handleNetworkError` for fetch errors
- Wrap fetch calls in try-catch blocks
