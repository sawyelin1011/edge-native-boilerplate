# Frontend Setup Guide

## Purpose

Frontend exists **only** to test, validate, and operate the GSMFlow platform. It is NOT a product frontend for customers.

## Implementation Requirements

### 1. API Integration

All frontend features must call tRPC APIs. Never implement business logic in UI components.

```typescript
// Example: Using the GSMFlow SDK
import { createClient } from '@gsmflow/sdk'

const client = createClient({
  baseUrl: 'http://localhost:8787/trpc',
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
})

// Call tRPC procedures
const health = await client.health.query()
```

### 2. Required Pages

#### 2.1 Dashboard (Root)
- System health overview
- Quick stats (tenants, orders, wallet balance)
- Recent activity feed

#### 2.2 Tenant Management
- List all tenants
- Create new tenant
- Edit tenant settings
- View tenant details (users, roles, wallet)

#### 2.3 Role Management
- List roles with permissions
- Create/edit role
- Assign permissions
- Role hierarchy display

#### 2.4 Service Management
- List available services
- Create service
- Configure provider
- Set base pricing

#### 2.5 Pricing Management
- View pricing hierarchy
- Adjust markup per role
- Calculate profit margins

#### 2.6 Wallet Operations
- Credit wallet
- Debit wallet
- View transaction history
- Lock/unlock funds

#### 2.7 Order Management
- List orders with filtering
- View order details
- Manual order processing
- Refund processing

### 3. Component Structure

```
src/
├── components/
│   ├── common/           # Reusable UI (Button, Input, Table, Modal)
│   ├── layout/           # Header, Sidebar, Layout
│   └── forms/            # Form components with validation
├── pages/                # Next.js pages (or app directory)
├── hooks/                # React hooks for API calls
├── utils/                # UI utilities
└── styles/               # Minimal global styles
```

### 4. API Key Management

Each role type requires different API key scopes:

| Role | Scopes Required |
|------|-----------------|
| Super Admin | all |
| Admin | tenant:*, user:*, pricing:read, wallet:read, order:* |
| Distributor | pricing:read, wallet:read, order:create, order:read |
| Reseller | pricing:read, wallet:read, order:create, order:read |
| Web Owner | pricing:read, order:create, order:read |
| End Customer | order:read |

### 5. Permission-Based UI Hiding

UI components must check permissions before rendering:

```typescript
// Example: Permission-based component visibility
import { usePermission } from '@/hooks/usePermission'

function SensitiveActionButton() {
  const { can } = usePermission()
  
  if (!can('wallet', 'modify')) {
    return null
  }
  
  return <button onClick={creditWallet}>Credit Wallet</button>
}
```

### 6. Form Validation

All forms must validate using tRPC input schemas:

```typescript
// Example: Form using tRPC input schema
import { trpc } from '@/utils/trpc'

function CreateTenantForm() {
  const createTenant = trpc.tenant.create.useMutation()
  
  const handleSubmit = (data: CreateTenantInput) => {
    createTenant.mutate(data)
  }
  
  return <Form onSubmit={handleSubmit} schema={tenantCreateSchema} />
}
```

### 7. Error Handling

Display API errors in user-friendly format:

```typescript
// Example: Error display
function ErrorMessage({ error }: { error: TRPCError }) {
  return (
    <div className="error-banner">
      <span className="error-code">{error.code}</span>
      <span className="error-message">{error.message}</span>
    </div>
  )
}
```

### 8. Loading States

Show loading states for all async operations:

```typescript
function LoadingSpinner({ loading }: { loading: boolean }) {
  if (!loading) return null
  return <div className="spinner">Loading...</div>
}
```

### 9. Table Components

Required for listing entities:

```typescript
// Example: Data table with pagination
function EntityTable<T>({
  data,
  columns,
  pagination,
  onSort,
}: EntityTableProps<T>) {
  return (
    <table>
      <thead>
        <tr>
          {columns.map(col => (
            <th onClick={() => onSort(col.key)}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.items.map(item => (
          <tr key={item.id}>
            {columns.map(col => (
              <td>{col.render(item)}</td>
            ))}
          </tr>
        ))}
      </tbody>
      <tfoot>
        <Pagination {...pagination} />
      </tfoot>
    </table>
  )
}
```

### 10. Minimal Styling

Use basic CSS or Tailwind. No custom design system needed.

```css
/* styles/globals.css */
:root {
  --primary: #0070f3;
  --danger: #f00;
  --success: #0a0;
  --warning: #fa0;
  --bg-primary: #fff;
  --bg-secondary: #f5f5f5;
  --text-primary: #111;
  --text-secondary: #666;
}

body {
  font-family: system-ui, sans-serif;
  margin: 0;
  padding: 0;
}

button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

button.primary {
  background: var(--primary);
  color: white;
  border: none;
}
```

### 11. API Key Security

- Store API keys in environment variables
- Never expose admin keys in client-side code
- Use different keys for different environments

```bash
# .env.local
NEXT_PUBLIC_API_KEY=pk_live_...
NEXT_PUBLIC_TENANT_ID=...
```

### 12. Development Workflow

1. Test API using tRPC client
2. Create form component
3. Connect to mutation/query
4. Add permission checks
5. Test error handling
6. Verify loading states

### 13. Build & Deploy

```bash
# Build for production
pnpm build:admin

# Deploy to Vercel/Cloudflare Pages
vercel deploy --prod
```

### 14. Next Steps

See also:
- `api-testing-panels.md` - API testing procedures
- `role-based-ui-guide.md` - Role-specific UI requirements
