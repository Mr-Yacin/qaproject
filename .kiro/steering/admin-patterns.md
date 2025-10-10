---
inclusion: fileMatch
fileMatchPattern: 'src/components/admin/**/*'
---

# Admin Component Patterns

This guidance applies when working with admin interface components.

## Component Organization

Admin components should be organized by feature area:
- Each feature gets its own subdirectory under `src/components/admin/`
- Shared layout components go in `admin/layout/`
- Keep components focused and single-purpose

## Naming Conventions

- **Forms**: Suffix with `Form` (e.g., `SettingsForm.tsx`, `PageForm.tsx`)
- **Lists/Tables**: Suffix with `List` or `Table` (e.g., `PageList.tsx`, `AuditLogTable.tsx`)
- **Builders**: Suffix with `Builder` for complex UI builders (e.g., `MenuBuilder.tsx`)
- **Modals/Dialogs**: Suffix with `Modal` or `Dialog` (e.g., `DeleteConfirmDialog.tsx`)

## Common Patterns

### Form Components
```typescript
interface FormProps {
  initialData?: DataType;
  onSubmit: (data: DataType) => Promise<void>;
  onCancel?: () => void;
}

export function FeatureForm({ initialData, onSubmit, onCancel }: FormProps) {
  // Use react-hook-form for form state
  // Use Zod for validation
  // Show loading state during submission
  // Display error messages with toast
}
```

### List Components
```typescript
interface ListProps {
  data: DataType[];
  onEdit?: (item: DataType) => void;
  onDelete?: (item: DataType) => void;
  isLoading?: boolean;
}

export function FeatureList({ data, onEdit, onDelete, isLoading }: ListProps) {
  // Use shadcn/ui Table component
  // Include pagination if needed
  // Show loading skeleton
  // Handle empty states
}
```

### Authentication
All admin components should be wrapped in authentication:
```typescript
// In page.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/admin/login');
  
  return <AdminComponent />;
}
```

### Role-Based Rendering
```typescript
import { useSession } from 'next-auth/react';

export function AdminFeature() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  
  if (userRole === 'VIEWER') {
    return <ReadOnlyView />;
  }
  
  return <EditableView />;
}
```

## UI Guidelines

### Use shadcn/ui Components
- Button, Input, Select, Textarea for form controls
- Table for data lists
- Dialog for modals
- Toast for notifications
- Card for content containers
- Badge for status indicators

### Loading States
Always show loading states:
```typescript
{isLoading ? <Skeleton /> : <Content />}
```

### Error Handling
Display errors with toast notifications:
```typescript
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();

try {
  await submitData();
  toast({ title: 'Success', description: 'Data saved' });
} catch (error) {
  toast({ 
    title: 'Error', 
    description: error.message,
    variant: 'destructive'
  });
}
```

### Confirmation Dialogs
Always confirm destructive actions:
```typescript
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## Accessibility

- Use semantic HTML elements
- Include proper ARIA labels
- Ensure keyboard navigation works
- Test with screen readers
- Maintain proper focus management

## Performance

- Use React.lazy() for code splitting large components
- Implement virtual scrolling for long lists
- Debounce search inputs
- Use optimistic updates where appropriate
- Memoize expensive computations with useMemo
