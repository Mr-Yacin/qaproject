# Authentication and Authorization Infrastructure

This document describes the authentication and authorization infrastructure implemented for the CMS.

## Components

### 1. User Repository (`repositories/user.repository.ts`)
- CRUD operations for User model
- Find by ID, email, or all users
- Find active users by email
- Create, update, and delete users

### 2. User Service (`services/user.service.ts`)
- Business logic for user management
- Password hashing with bcrypt (10 salt rounds)
- User authentication (email + password)
- User CRUD with validation
- Password verification utilities

### 3. Authentication Middleware (`middleware/auth.middleware.ts`)
- `requireAuth()` - Ensures user is logged in and active
- `requireRole(roles)` - Ensures user has one of the allowed roles
- Role checking utilities:
  - `hasRole(user, role)` - Check specific role
  - `hasAnyRole(user, roles)` - Check multiple roles
  - `isAdmin(user)` - Check if admin
  - `canEdit(user)` - Check if admin or editor
  - `isViewer(user)` - Check if viewer only
- Custom error classes: `UnauthorizedError`, `ForbiddenError`

### 4. Audit Repository (`repositories/audit.repository.ts`)
- Create audit log entries
- Query audit logs with filters (user, action, entity type, date range)
- Pagination support
- Delete old logs for archival

### 5. Audit Service (`services/audit.service.ts`)
- High-level audit logging methods:
  - `logCreate()` - Log entity creation
  - `logUpdate()` - Log entity updates
  - `logDelete()` - Log entity deletion
  - `logLogin()` - Log user login
  - `logLogout()` - Log user logout
- Export audit logs to CSV
- Archive old logs (default: keep 365 days)

### 6. Audit Middleware (`middleware/audit.middleware.ts`)
- Extract IP address and user agent from requests
- `logAudit()` - Log audit action with context
- `withAudit()` - Wrapper for automatic audit logging
- `createAuditContext()` - Helper to create audit context

### 7. NextAuth Configuration (`lib/auth.ts`)
- Updated to use User model from database
- Authenticates against hashed passwords
- Includes user role in session
- 24-hour session timeout

### 8. TypeScript Types (`types/next-auth.d.ts`)
- Extended NextAuth types to include `UserRole`
- Session includes user role
- JWT token includes role

## Usage Examples

### Protecting API Routes

```typescript
import { requireRole } from '@/lib/middleware/auth.middleware';
import { UserRole } from '@prisma/client';

export async function POST(request: Request) {
  // Require admin role
  const user = await requireRole([UserRole.ADMIN]);
  
  // ... rest of handler
}

export async function PUT(request: Request) {
  // Require admin or editor role
  const user = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  
  // ... rest of handler
}
```

### Logging Audit Actions

```typescript
import { AuditService } from '@/lib/services/audit.service';
import { AuditAction } from '@prisma/client';

const auditService = new AuditService();

// Log a create action
await auditService.logCreate(
  user.id,
  'Page',
  page.id,
  { title: page.title, slug: page.slug }
);

// Log an update action
await auditService.logUpdate(
  user.id,
  'Settings',
  settings.id,
  { before: oldSettings, after: newSettings }
);

// Log a delete action
await auditService.logDelete(
  user.id,
  'Topic',
  topicId,
  { slug: topic.slug }
);
```

### Using Audit Middleware

```typescript
import { logAudit, createAuditContext } from '@/lib/middleware/audit.middleware';
import { AuditAction } from '@prisma/client';

export async function POST(request: NextRequest) {
  const user = await requireRole([UserRole.ADMIN]);
  
  // ... perform action
  const page = await pageService.createPage(data);
  
  // Log the action
  await logAudit(
    createAuditContext(
      user,
      AuditAction.CREATE,
      'Page',
      page.id,
      { title: page.title, slug: page.slug }
    ),
    request
  );
  
  return Response.json(page);
}
```

### Creating Users

```typescript
import { UserService } from '@/lib/services/user.service';
import { UserRole } from '@prisma/client';

const userService = new UserService();

// Create a new admin user
const admin = await userService.createUser({
  email: 'admin@example.com',
  password: 'securepassword123',
  name: 'Admin User',
  role: UserRole.ADMIN,
});

// Password is automatically hashed with bcrypt
```

### Authenticating Users

```typescript
import { UserService } from '@/lib/services/user.service';

const userService = new UserService();

// Authenticate user
const user = await userService.authenticateUser(
  'admin@example.com',
  'securepassword123'
);

if (user) {
  // User authenticated successfully
  console.log(`Welcome ${user.name}!`);
} else {
  // Invalid credentials
  console.log('Invalid email or password');
}
```

## Security Features

1. **Password Hashing**: All passwords are hashed with bcrypt using 10 salt rounds
2. **Active User Check**: Authentication checks if user account is active
3. **Role-Based Access**: Middleware enforces role requirements
4. **Session Management**: 24-hour JWT session timeout
5. **Audit Trail**: All actions are logged with user, timestamp, and details
6. **IP and User Agent Tracking**: Audit logs capture request metadata

## User Roles

- **ADMIN**: Full access to all features
- **EDITOR**: Can manage content (pages, topics, menus, footer, media)
- **VIEWER**: Read-only access

## Error Handling

- `UnauthorizedError`: Thrown when user is not authenticated
- `ForbiddenError`: Thrown when user lacks required role
- Both errors should be caught in API routes and return appropriate HTTP status codes (401, 403)

## Next Steps

To use this infrastructure:

1. Run database migration to create User and AuditLog tables
2. Create seed script to add default admin user
3. Update API routes to use `requireAuth()` and `requireRole()`
4. Add audit logging to all CRUD operations
5. Test authentication flow and role-based access
