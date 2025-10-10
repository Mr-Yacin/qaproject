---
inclusion: fileMatch
fileMatchPattern: 'src/app/api/**/*'
---

# API Route Patterns

This guidance applies when working with Next.js API routes.

## Standard API Route Structure

```typescript
import { NextRequest } from 'next/server';
import { z } from 'zod';

// Define request schema
const RequestSchema = z.object({
  field1: z.string(),
  field2: z.number(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication (if required)
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 2. Authorization (check role if needed)
    const user = await requireRole(['ADMIN', 'EDITOR'])(request);
    
    // 3. Parse and validate request body
    const body = await request.json();
    const validatedData = RequestSchema.parse(body);
    
    // 4. Call service layer
    const result = await service.performAction(validatedData);
    
    // 5. Audit logging (for sensitive operations)
    await auditService.logAction({
      userId: user.id,
      action: 'CREATE',
      entityType: 'Resource',
      entityId: result.id,
    });
    
    // 6. Cache revalidation (if needed)
    revalidateTag('resource-tag');
    
    // 7. Return response
    return Response.json(result, { status: 201 });
    
  } catch (error) {
    return handleAPIError(error);
  }
}
```

## HTTP Methods

- **GET**: Retrieve resources (no body)
- **POST**: Create new resources
- **PUT**: Update entire resource
- **PATCH**: Partial update
- **DELETE**: Remove resource

## Status Codes

Use appropriate HTTP status codes:
- `200` - Success (GET, PUT, PATCH)
- `201` - Created (POST)
- `204` - No Content (DELETE)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (not authorized)
- `404` - Not Found
- `409` - Conflict (duplicate)
- `500` - Internal Server Error

## Error Handling

Always use the standard error handler:
```typescript
import { handleAPIError } from '@/lib/utils/error-handler';

try {
  // ... operation
} catch (error) {
  return handleAPIError(error);
}
```

## Validation

Always validate input with Zod:
```typescript
import { z } from 'zod';

const Schema = z.object({
  email: z.string().email(),
  age: z.number().min(0).max(120),
});

try {
  const data = Schema.parse(body);
} catch (error) {
  if (error instanceof z.ZodError) {
    return Response.json(
      { error: 'Validation failed', details: error.errors },
      { status: 400 }
    );
  }
}
```

## Authentication Patterns

### Public Endpoints
No authentication required:
```typescript
export async function GET(request: NextRequest) {
  // No auth check
  const data = await service.getPublicData();
  return Response.json(data);
}
```

### Protected Endpoints (Session)
Require authenticated user:
```typescript
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... rest of handler
}
```

### Protected Endpoints (API Key)
For webhook/external integrations:
```typescript
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== process.env.INGEST_API_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... rest of handler
}
```

### Protected Endpoints (HMAC)
For secure webhooks:
```typescript
import { verifyHmacSignature } from '@/lib/security/hmac';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-signature');
  const timestamp = request.headers.get('x-timestamp');
  const body = await request.text();
  
  const isValid = verifyHmacSignature(body, signature, timestamp);
  if (!isValid) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }
  // ... rest of handler
}
```

## Authorization (Role-Based)

Use the requireRole helper:
```typescript
import { requireRole } from '@/lib/auth/authorization';

export async function POST(request: NextRequest) {
  // Only ADMIN and EDITOR can access
  const user = await requireRole(['ADMIN', 'EDITOR'])(request);
  
  // ... rest of handler
}
```

## Pagination

For list endpoints, support pagination:
```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;
  
  const [items, total] = await Promise.all([
    service.list({ skip, take: limit }),
    service.count(),
  ]);
  
  return Response.json({
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
```

## Filtering and Sorting

Support query parameters:
```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const filters = {
    status: searchParams.get('status'),
    locale: searchParams.get('locale'),
    tags: searchParams.getAll('tags'),
  };
  
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  
  const items = await service.list({ filters, sortBy, sortOrder });
  return Response.json(items);
}
```

## Cache Revalidation

Revalidate cache after mutations:
```typescript
import { revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  const result = await service.create(data);
  
  // Revalidate relevant cache tags
  revalidateTag('topics');
  revalidateTag(`topic:${result.slug}`);
  
  return Response.json(result, { status: 201 });
}
```

## File Uploads

Handle multipart form data:
```typescript
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  if (!file) {
    return Response.json({ error: 'No file provided' }, { status: 400 });
  }
  
  // Validate file
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return Response.json({ error: 'File too large' }, { status: 400 });
  }
  
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return Response.json({ error: 'Invalid file type' }, { status: 400 });
  }
  
  // Process file
  const result = await mediaService.uploadFile(file, user.id);
  return Response.json(result, { status: 201 });
}
```

## Audit Logging

Log sensitive operations:
```typescript
await auditService.logAction({
  userId: user.id,
  action: 'DELETE',
  entityType: 'Topic',
  entityId: topicId,
  details: { slug: topic.slug },
  ipAddress: request.headers.get('x-forwarded-for'),
  userAgent: request.headers.get('user-agent'),
});
```

## Testing API Routes

Write integration tests:
```typescript
describe('POST /api/admin/pages', () => {
  it('should create page with valid data', async () => {
    const response = await fetch('/api/admin/pages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie,
      },
      body: JSON.stringify(validPageData),
    });
    
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.slug).toBe(validPageData.slug);
  });
  
  it('should return 401 without authentication', async () => {
    const response = await fetch('/api/admin/pages', {
      method: 'POST',
      body: JSON.stringify(validPageData),
    });
    
    expect(response.status).toBe(401);
  });
});
```
