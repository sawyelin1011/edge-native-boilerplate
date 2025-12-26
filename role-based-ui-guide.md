# Role-Based UI Guide

## Purpose

Guide for implementing UI that adapts to user roles and permissions.

## Role Hierarchy

```
Super Admin (Level 0)
    ├── Admin (Level 1)
    │       ├── Distributor (Level 2)
    │       │       ├── Reseller (Level 3)
    │       │       │       ├── Web Owner (Level 4)
    │       │       │       │       └── End Customer (Level 5)
    │       │       │       │
    │       │       └── Web Owner
    │       │
    └── Web Owner
```

## Permission Matrix

### 1. Tenant Permissions

| Action | Super Admin | Admin | Distributor | Reseller | Web Owner | Customer |
|--------|-------------|-------|-------------|----------|-----------|----------|
| tenant:read | ✅ | ✅ (own) | ✅ (own) | ✅ (own) | ✅ (own) | ❌ |
| tenant:create | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| tenant:update | ✅ | ✅ (own) | ❌ | ❌ | ❌ | ❌ |
| tenant:delete | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 2. User Permissions

| Action | Super Admin | Admin | Distributor | Reseller | Web Owner | Customer |
|--------|-------------|-------|-------------|----------|-----------|----------|
| user:read | ✅ | ✅ (own) | ✅ (own) | ✅ (own) | ❌ | ❌ |
| user:create | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| user:update | ✅ | ✅ (own) | ✅ (own) | ❌ | ❌ | ❌ |
| user:delete | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 3. Role Permissions

| Action | Super Admin | Admin | Distributor | Reseller | Web Owner | Customer |
|--------|-------------|-------|-------------|----------|-----------|----------|
| role:read | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| role:create | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| role:update | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| role:delete | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 4. Wallet Permissions

| Action | Super Admin | Admin | Distributor | Reseller | Web Owner | Customer |
|--------|-------------|-------|-------------|----------|-----------|----------|
| wallet:read | ✅ | ✅ | ✅ (own) | ✅ (own) | ✅ (own) | ✅ (own) |
| wallet:modify | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| wallet:credit | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| wallet:debit | ✅ | ✅ | ✅ (own) | ✅ (own) | ✅ (own) | ❌ |

### 5. Pricing Permissions

| Action | Super Admin | Admin | Distributor | Reseller | Web Owner | Customer |
|--------|-------------|-------|-------------|----------|-----------|----------|
| pricing:read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| pricing:modify | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| pricing:setMarkup | ✅ | ✅ | ✅ (within limit) | ✅ (within limit) | ❌ | ❌ |

### 6. Order Permissions

| Action | Super Admin | Admin | Distributor | Reseller | Web Owner | Customer |
|--------|-------------|-------|-------------|----------|-----------|----------|
| order:read | ✅ | ✅ | ✅ (own) | ✅ (own) | ✅ (own) | ✅ (own) |
| order:create | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| order:cancel | ✅ | ✅ | ✅ (own) | ✅ (own) | ✅ (own) | ❌ |
| order:refund | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### 7. API Key Permissions

| Action | Super Admin | Admin | Distributor | Reseller | Web Owner | Customer |
|--------|-------------|-------|-------------|----------|-----------|----------|
| apikey:read | ✅ | ✅ | ✅ (own) | ✅ (own) | ✅ (own) | ❌ |
| apikey:create | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| apikey:delete | ✅ | ✅ | ✅ (own) | ✅ (own) | ✅ (own) | ❌ |

## UI Implementation

### 1. Permission Hook

```typescript
// hooks/usePermission.ts
import { useSession } from '@/hooks/useSession'

type Action = 'create' | 'read' | 'update' | 'delete' | 'modify' | 'list' | '*'
type Resource = 'tenant' | 'user' | 'role' | 'wallet' | 'pricing' | 'order' | 'apikey' | 'service'

export function usePermission() {
  const { user } = useSession()
  
  const permissions = user?.permissions || []
  
  function can(action: Action, resource: Resource): boolean {
    const required = `${resource}:${action}`
    const starRequired = `${resource}:*`
    
    // Check for wildcard
    if (permissions.includes(starRequired)) return true
    if (permissions.includes(required)) return true
    
    return false
  }
  
  function hasAny(...checks: Array<{ action: Action; resource: Resource }>): boolean {
    return checks.some(check => can(check.action, check.resource))
  }
  
  function hasAll(...checks: Array<{ action: Action; resource: Resource }>): boolean {
    return checks.every(check => can(check.action, check.resource))
  }
  
  return { can, hasAny, hasAll, permissions }
}
```

### 2. Role Guard Component

```typescript
// components/RoleGuard.tsx
import { usePermission } from '@/hooks/usePermission'

interface RoleGuardProps {
  allow?: Array<{ action: string; resource: string }>
  requireAll?: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGuard({ allow, requireAll = true, children, fallback = null }: RoleGuardProps) {
  const { hasAny, hasAll } = usePermission()
  
  if (!allow || allow.length === 0) {
    return <>{children}</>
  }
  
  const hasPermission = requireAll ? hasAll(...allow) : hasAny(...allow)
  
  if (!hasPermission) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}
```

### 3. Navigation Menu

```typescript
// components/Navigation.tsx
import { RoleGuard } from './RoleGuard'

const menuItems = [
  { label: 'Dashboard', href: '/', icon: 'home' },
  { 
    label: 'Tenants', 
    href: '/tenants',
    permission: { action: 'read', resource: 'tenant' }
  },
  { 
    label: 'Users', 
    href: '/users',
    permission: { action: 'read', resource: 'user' }
  },
  { 
    label: 'Roles', 
    href: '/roles',
    permission: { action: 'read', resource: 'role' }
  },
  { 
    label: 'Wallet', 
    href: '/wallet',
    permission: { action: 'read', resource: 'wallet' }
  },
  { 
    label: 'Pricing', 
    href: '/pricing',
    permission: { action: 'read', resource: 'pricing' }
  },
  { 
    label: 'Orders', 
    href: '/orders',
    permission: { action: 'read', resource: 'order' }
  },
  { 
    label: 'API Keys', 
    href: '/apikeys',
    permission: { action: 'read', resource: 'apikey' }
  },
]

export function Navigation() {
  return (
    <nav>
      <ul>
        {menuItems.map(item => (
          <li key={item.href}>
            <RoleGuard allow={[item.permission]}>
              <a href={item.href}>{item.label}</a>
            </RoleGuard>
          </li>
        ))}
      </ul>
    </nav>
  )
}
```

### 4. Action Buttons

```typescript
// components/Actions.tsx
import { RoleGuard } from './RoleGuard'

export function CreateTenantButton() {
  return (
    <RoleGuard allow={[{ action: 'create', resource: 'tenant' }]}>
      <button onClick={openCreateModal}>Create Tenant</button>
    </RoleGuard>
  )
}

export function CreditWalletButton({ tenantId }: { tenantId: string }) {
  return (
    <RoleGuard allow={[{ action: 'modify', resource: 'wallet' }]}>
      <button onClick={() => openCreditModal(tenantId)}>Credit</button>
    </RoleGuard>
  )
}

export function RefundOrderButton({ orderId }: { orderId: string }) {
  return (
    <RoleGuard allow={[{ action: 'refund', resource: 'order' }]}>
      <button onClick={() => openRefundModal(orderId)}>Refund</button>
    </RoleGuard>
  )
}
```

### 5. Form Field Visibility

```typescript
// components/forms/TenantForm.tsx
import { usePermission } from '@/hooks/usePermission'

export function TenantForm() {
  const { can } = usePermission()
  const canSetLimits = can('modify', 'tenant')
  const canSetFeatures = can('modify', 'tenant')
  
  return (
    <form>
      <input name="name" label="Name" required />
      <input name="slug" label="Slug" required />
      
      {canSetFeatures && (
        <FeaturesField name="features" />
      )}
      
      {canSetLimits && (
        <LimitsField name="limits" />
      )}
    </form>
  )
}
```

### 6. Table Column Visibility

```typescript
// components/TenantTable.tsx
import { usePermission } from '@/hooks/usePermission'

export function TenantTable() {
  const { can } = usePermission()
  const showActions = can('update', 'tenant') || can('delete', 'tenant')
  
  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created' },
    ...(showActions ? [{ key: 'actions', label: 'Actions' }] : []),
  ]
  
  return <DataTable columns={columns} />
}
```

### 7. Role-Based Feature Flags

```typescript
// features/index.ts
import { useSession } from '@/hooks/useSession'

export function useFeatureFlags() {
  const { user } = useSession()
  const role = user?.role
  
  return {
    canCreateTenant: role === 'super_admin',
    canManageAllUsers: role === 'super_admin' || role === 'admin',
    canModifyPricing: role === 'super_admin' || role === 'admin',
    canSetMarkup: ['super_admin', 'admin', 'distributor', 'reseller'].includes(role),
    canCreditWallet: ['super_admin', 'admin'].includes(role),
    canRefundOrders: role === 'super_admin' || role === 'admin',
    canGenerateApiKeys: ['super_admin', 'admin', 'distributor', 'reseller', 'web_owner'].includes(role),
  }
}
```

### 8. Pricing UI Based on Role

```typescript
// components/PricingPanel.tsx
import { useFeatureFlags } from '@/features'

export function PricingPanel() {
  const { canSetMarkup } = useFeatureFlags()
  
  return (
    <div>
      <h3>Base Pricing</h3>
      <BasePricingTable />
      
      {canSetMarkup && (
        <div className="markup-section">
          <h3>Your Markup</h3>
          <MarkupControls />
        </div>
      )}
    </div>
  )
}
```

### 9. Wallet Display Rules

```typescript
// components/WalletDisplay.tsx
import { useFeatureFlags } from '@/features'

export function WalletDisplay({ wallet }: { wallet: Wallet }) {
  const { canCredit, canCreditOthers } = useFeatureFlags()
  
  return (
    <div className="wallet-card">
      <h3>{wallet.currency} Wallet</h3>
      <div className="balance">{wallet.balance.toFixed(2)}</div>
      
      <div className="actions">
        {canCredit && (
          <button onClick={creditWallet}>Credit</button>
        )}
        {wallet.locked > 0 && (
          <span className="locked">Locked: {wallet.locked}</span>
        )}
      </div>
    </div>
  )
}
```

### 10. Order Form Restrictions

```typescript
// components/OrderForm.tsx
import { useFeatureFlags } from '@/features'

export function OrderForm({ service }: { service: Service }) {
  const { canSetQuantity } = useFeatureFlags()
  
  return (
    <form>
      <ServiceInfo service={service} />
      
      <input 
        name="quantity" 
        type="number" 
        min="1" 
        max={service.maxQuantity}
        disabled={!canSetQuantity}
      />
      
      <div className="price-breakdown">
        <span>Unit Price: {service.price}</span>
        <span>Total: {calculateTotal()}</span>
      </div>
    </form>
  )
}
```

## Testing Role-Based UI

### 1. Login as Different Roles

```typescript
// test-utils/roleHelpers.ts
async function loginAs(role: string) {
  // Login with user of specific role
  await login({ email: `${role}@test.com`, password: 'test' })
}

async function testAs(role: string, testFn: () => Promise<void>) {
  await loginAs(role)
  await testFn()
}
```

### 2. Permission Assertions

```typescript
// tests/permissions.spec.ts
import { render, screen } from '@testing-library/react'

it('shows create button for admin', async () => {
  loginAs('admin')
  render(<TenantList />)
  expect(screen.getByText('Create Tenant')).toBeInTheDocument()
})

it('hides create button for distributor', async () => {
  loginAs('distributor')
  render(<TenantList />)
  expect(screen.queryByText('Create Tenant')).not.toBeInTheDocument()
})
```

## Common Patterns

### 1. Show/Hide Navigation Items

```typescript
// Use RoleGuard in navigation
<RoleGuard allow={[{ action: 'read', resource: 'order' }]}>
  <NavLink href="/orders">Orders</NavLink>
</RoleGuard>
```

### 2. Disable Form Fields

```typescript
// Use permission check to disable
<input disabled={!can('update', 'tenant')} />
```

### 3. Filter Table Data

```typescript
// Server-side filtering based on tenant
const orders = await orderService.list({
  tenantId: user.tenantId,
  // Admin sees all, others see own
})
```

### 4. Redirect Unauthorized Access

```typescript
// In useEffect
useEffect(() => {
  if (!can('read', 'tenant')) {
    router.push('/unauthorized')
  }
}, [user])
```

### 5. Show Permission Tooltip

```typescript
// Tooltip on disabled actions
<Tooltip content="You don't have permission to credit wallets">
  <button disabled>Credit</button>
</Tooltip>
```
