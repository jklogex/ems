# Developer Guide

This guide provides an overview of the codebase architecture, common patterns, and how to extend the application.

## Architecture Overview

The application follows a layered architecture:

```
app/
├── (dashboard)/     # Dashboard pages (protected routes)
├── api/            # API routes (Next.js App Router)
├── auth/           # Authentication pages
└── mobile/         # Mobile-specific pages

components/
├── ui/             # Reusable UI components
├── mobile/         # Mobile-specific components
└── [feature]/      # Feature-specific components

lib/
├── api/            # API utilities (handlers, middleware, responses)
├── db/             # Database client and types
├── hooks/          # React hooks
├── utils/          # Utility functions
└── validations/    # Zod validation schemas
```

## Adding a New API Route

### Simple CRUD Route

For standard CRUD operations, use the base handlers:

```typescript
// app/api/items/route.ts
import { NextRequest } from 'next/server';
import { listHandler, createHandler } from '@/lib/api/handlers';
import { createItemSchema } from '@/lib/validations/items';

export async function GET(request: NextRequest) {
  return listHandler(request, {
    table: 'items',
    allowedFilters: ['name', 'status'],
    defaultLimit: 100,
  });
}

export async function POST(request: NextRequest) {
  return createHandler(request, {
    table: 'items',
    schema: createItemSchema,
  });
}
```

### Route with Custom Logic

For routes that need custom logic, use the hooks:

```typescript
// app/api/items/[id]/route.ts
import { NextRequest } from 'next/server';
import { readHandler, updateHandler } from '@/lib/api/handlers';
import { updateItemSchema } from '@/lib/validations/items';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return readHandler(request, params, {
    table: 'items',
    select: '*, related_table (*)',
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return updateHandler(request, params, {
    table: 'items',
    schema: updateItemSchema,
    afterUpdate: async (data, supabase) => {
      // Custom logic after update
      await supabase.from('audit_log').insert({
        item_id: data.id,
        action: 'updated',
      });
    },
  });
}
```

## Creating Validation Schemas

All API inputs should be validated using Zod schemas:

```typescript
// lib/validations/items.ts
import { z } from 'zod';
import { optionalStringSchema } from './common';

export const createItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: optionalStringSchema,
  status: z.enum(['active', 'inactive']),
});

export const updateItemSchema = createItemSchema.partial();

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
```

## Using Data Fetching Hooks

### Basic Query

```typescript
import { useQuery } from '@/lib/hooks/use-api';

function MyComponent() {
  const { data, loading, error, refetch } = useQuery('/api/items');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>{/* Render data */}</div>;
}
```

### Paginated Query

```typescript
import { usePaginatedQuery } from '@/lib/hooks/use-api';

function MyComponent() {
  const {
    data,
    loading,
    page,
    totalCount,
    nextPage,
    previousPage,
  } = usePaginatedQuery('/api/items', { pageSize: 20 });

  // ...
}
```

### Mutation

```typescript
import { useMutation } from '@/lib/hooks/use-api';

function MyComponent() {
  const { mutate, loading, error } = useMutation('/api/items', 'POST', {
    onSuccess: (data) => {
      console.log('Item created:', data);
    },
  });

  const handleSubmit = async () => {
    await mutate({ name: 'New Item' });
  };

  // ...
}
```

## Using the DataTable Component

```typescript
import { DataTable } from '@/components/ui/data-table';

function ItemsPage() {
  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'status', header: 'Status' },
    {
      key: 'created_at',
      header: 'Created',
      render: (item) => formatDate(item.created_at),
    },
  ];

  return (
    <DataTable
      url="/api/items"
      columns={columns}
      searchParams={{ status: 'active' }}
      actions={(item) => (
        <Button onClick={() => handleEdit(item.id)}>Edit</Button>
      )}
    />
  );
}
```

## Using Form Components

```typescript
import { FormField, SelectField, TextareaField } from '@/components/ui/form-field';

function ItemForm() {
  return (
    <form>
      <FormField
        label="Name"
        name="name"
        required
        error={errors.name}
      >
        <Input name="name" />
      </FormField>

      <SelectField
        label="Status"
        name="status"
        options={[
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ]}
      />

      <TextareaField
        label="Description"
        name="description"
        rows={4}
      />
    </form>
  );
}
```

## Error Handling

All API routes use centralized error handling:

```typescript
import { handleApiError } from '@/lib/api/error-handler';

export async function GET(request: NextRequest) {
  try {
    // Your code
  } catch (error) {
    return handleApiError(error);
  }
}
```

## Response Format

All API responses follow a standard format:

```typescript
{
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    count?: number;
    limit?: number;
    offset?: number;
  };
}
```

Use the response utilities:

```typescript
import { successResponse, errorResponse, paginatedResponse } from '@/lib/api/response';

// Success
return successResponse(data);

// Error
return errorResponse('Something went wrong', 500);

// Paginated
return paginatedResponse(data, { count: 100, limit: 50, offset: 0 });
```

## Database Queries

Use the query builder utilities:

```typescript
import { buildQuery, getQueryOptionsFromSearchParams } from '@/lib/db/query-builder';
import { getSupabaseServiceClient } from '@/lib/db/client';

const supabase = getSupabaseServiceClient();
const searchParams = request.nextUrl.searchParams;
const options = getQueryOptionsFromSearchParams(searchParams);

const query = buildQuery(supabase.from('items'), options);
const { data, error } = await query;
```

## Constants

Use constants instead of magic strings:

```typescript
import { WORK_ORDER_STATUSES, API_ENDPOINTS } from '@/lib/constants';

if (status === WORK_ORDER_STATUSES.CLOSED) {
  // ...
}
```

## Type Safety

- All API inputs should use Zod schemas
- Export TypeScript types from schemas using `z.infer<>`
- Avoid using `any` types
- Use proper types from `lib/db/types.ts`

## Coding Conventions

1. **File Naming**: Use kebab-case for files (e.g., `work-orders.ts`)
2. **Component Naming**: Use PascalCase for components
3. **Function Naming**: Use camelCase for functions
4. **Constants**: Use UPPER_SNAKE_CASE for constants
5. **Types/Interfaces**: Use PascalCase

## Testing

When adding new features:

1. Test API routes with proper validation
2. Test error cases
3. Test edge cases (empty data, null values, etc.)
4. Test with different user roles if applicable

## Common Patterns

### Protected Routes

```typescript
import { withAuth } from '@/lib/api/middleware';

export const GET = withAuth(async (request, session) => {
  // session.user contains user info
  // ...
});
```

### Role-Based Access

```typescript
import { withAuthAndRole } from '@/lib/api/middleware';
import { USER_ROLES } from '@/lib/constants';

export const GET = withAuthAndRole([USER_ROLES.ADMIN])(async (request, session) => {
  // Only admins can access
  // ...
});
```

### Validated Routes

```typescript
import { withValidation } from '@/lib/api/middleware';
import { createItemSchema } from '@/lib/validations/items';

export const POST = withValidation(createItemSchema)(async (request, validatedData) => {
  // validatedData is type-safe and validated
  // ...
});
```

## Questions?

If you have questions about the codebase, check:
1. This developer guide
2. Existing similar code
3. Type definitions in `lib/db/types.ts` and `lib/validations/`
4. API response utilities in `lib/api/response.ts`

