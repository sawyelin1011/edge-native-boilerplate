# API Testing Panels Guide

## Purpose

Testing panels validate that APIs work correctly across all roles and permissions.

## Required Testing Panels

### 1. Health Check Panel

**Purpose**: Verify API is running and healthy

**API Call**:
```
GET /health
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0",
  "environment": "development",
  "runtime": "cloudflare"
}
```

**UI Components**:
- Health status indicator (green/red)
- Version display
- Environment badge
- Last check timestamp
- Manual refresh button

### 2. Tenant Panel

**Purpose**: Test tenant CRUD operations

#### List Tenants
```
GET /trpc/tenant.list
```
**Input**: `{ limit: 10, offset: 0 }`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Tenant Name",
      "slug": "tenant-slug",
      "status": "active",
      "settings": { ... },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "requestId": "uuid",
    "timestamp": "2024-01-01T00:00:00Z",
    "pagination": { "total": 5, "limit": 10, "offset": 0, "hasMore": false }
  }
}
```

**UI Components**:
- Table with tenant list
- Search/filter by name
- Pagination controls
- Create tenant button
- Edit/Delete actions (admin only)

#### Create Tenant
```
POST /trpc/tenant.create
```
**Input**:
```json
{
  "name": "New Tenant",
  "slug": "new-tenant",
  "settings": {
    "features": { "api": true },
    "limits": { "maxUsers": 100 }
  }
}
```

**Required Permission**: `tenant:create`

### 3. User Panel

**Purpose**: Test user management

| Operation | API | Permission |
|-----------|-----|------------|
| List users | `user.list` | `user:read` |
| Get user | `user.get` | `user:read` |
| Create user | `user.create` | `user:create` |
| Update user | `user.update` | `user:update` |
| Delete user | `user.delete` | `user:delete` |

**UI Components**:
- User table with role column
- Create user form (email, name, role)
- Edit user modal
- Role assignment dropdown

### 4. Role & Permission Panel

**Purpose**: Verify permission system works

#### List Roles
```
GET /trpc/role.list
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "super_admin",
      "name": "Super Admin",
      "permissions": ["tenant:*", "user:*", "pricing:*", "wallet:*", "order:*"],
      "isSystem": true
    },
    {
      "id": "admin",
      "name": "Admin",
      "permissions": ["tenant:read", "user:*", "pricing:read", "wallet:read", "order:*"],
      "isSystem": true
    }
  ]
}
```

**UI Components**:
- Role list with permission count
- Permission tree viewer
- Create role form
- Edit permissions (super admin only)

### 5. Wallet Panel

**Purpose**: Test wallet operations

| Operation | API | Permission |
|-----------|-----|------------|
| Get balance | `wallet.get` | `wallet:read` |
| Credit | `wallet.credit` | `wallet:modify` |
| Debit | `wallet.debit` | `wallet:modify` |
| Lock | `wallet.lock` | `wallet:modify` |
| History | `wallet.history` | `wallet:read` |

#### Credit Wallet
```
POST /trpc/wallet.credit
```
**Input**:
```json
{
  "tenantId": "uuid",
  "amount": 1000.00,
  "currency": "USD",
  "description": "Initial deposit"
}
```

**UI Components**:
- Wallet balance card
- Credit form (amount, description)
- Debit form (amount, description)
- Transaction history table
- Lock/unlock controls

### 6. Pricing Panel

**Purpose**: Test pricing hierarchy

| Operation | API | Permission |
|-----------|-----|------------|
| Get pricing | `pricing.get` | `pricing:read` |
| Set markup | `pricing.setMarkup` | `pricing:modify` |
| Get profit | `pricing.getProfit` | `pricing:read` |

**UI Components**:
- Pricing hierarchy tree
- Markup adjustment sliders
- Profit calculator
- Provider price display

### 7. Order Panel

**Purpose**: Test order lifecycle

| Operation | API | Permission |
|-----------|-----|------------|
| List orders | `order.list` | `order:read` |
| Create order | `order.create` | `order:create` |
| Get order | `order.get` | `order:read` |
| Cancel order | `order.cancel` | `order:cancel` |
| Refund order | `order.refund` | `order:refund` |

#### Create Order
```
POST /trpc/order.create
```
**Input**:
```json
{
  "serviceId": "uuid",
  "quantity": 1,
  "metadata": { "reference": "REF123" }
}
```

**UI Components**:
- Order list with filters (status, date)
- Create order form (service, quantity)
- Order detail view
- Status timeline
- Refund button (when applicable)

### 8. API Key Panel

**Purpose**: Manage API keys

| Operation | API | Permission |
|-----------|-----|------------|
| List keys | `apikey.list` | `apikey:read` |
| Create key | `apikey.create` | `apikey:create` |
| Revoke key | `apikey.revoke` | `apikey:delete` |

**UI Components**:
- API key list
- Create key form (name, scopes, expiry)
- Copy key dialog
- Revoke button

### 9. Testing Checklist

- [ ] Health check returns healthy
- [ ] Can create tenant
- [ ] Can list users for tenant
- [ ] Can create user with role
- [ ] Permissions block unauthorized actions
- [ ] Wallet credit/debit works
- [ ] Pricing markup updates correctly
- [ ] Order creation deducts wallet
- [ ] Order refund credits wallet
- [ ] API keys grant correct scopes
- [ ] Role hierarchy enforced

### 10. Test Data Setup

```typescript
// Seed script for testing
const testData = {
  tenants: [
    { name: 'Test Tenant 1', slug: 'test1' },
    { name: 'Test Tenant 2', slug: 'test2' },
  ],
  roles: ['super_admin', 'admin', 'distributor', 'reseller', 'web_owner'],
  services: [
    { name: 'IMEI Check', type: 'imei', basePrice: 5.00 },
    { name: 'Remote File', type: 'file', basePrice: 2.00 },
  ],
}
```
