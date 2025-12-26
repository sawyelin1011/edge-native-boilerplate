# GSMFlow - Edge-Native Platform System

## Phase 2: Platform Core Implementation

A production-grade, edge-native monorepo for GSMFlow, a multi-tenant digital services & GSM automation platform.

### Architecture

```
gsmflow/
├── apps/
│   ├── api/           # Edge-native API (Hono + tRPC)
│   ├── admin/         # Admin Dashboard (Next.js App Router)
│   └── storefront/    # Storefront (Next.js App Router)
│
├── packages/
│   ├── core/              # Domain layer (pure TypeScript)
│   ├── trpc-contracts/    # tRPC routers, procedures, permissions
│   ├── adapters/
│   │   ├── base/          # Adapter interfaces
│   │   ├── cloudflare/    # Cloudflare Workers adapter
│   │   ├── vercel-edge/   # Vercel Edge adapter
│   │   └── deno/          # Deno Deploy adapter
│   ├── plugin-system/     # Plugin architecture
│   ├── sdk/               # Client SDK
│   └── shared/            # Shared types & utilities
│
└── turbo.json         # Turborepo configuration
```

### Runtime Targets

- ✅ **Cloudflare Workers** (Primary)
- ✅ **Vercel Edge Functions**
- ✅ **Deno Deploy**

### Platform Core Features

#### 1. Tenant System
- Multi-tenant by default
- Tenant isolation (wallets, pricing, users, API keys)
- Strict cross-tenant access prevention

#### 2. Role & Permission Engine
- Data-driven roles (not enums)
- Default templates: Super Admin, Admin, Distributor, Reseller, Web Owner, End Customer
- Scope-based permissions (actions, pricing, API access)
- Dynamic permission checking via tRPC

#### 3. Pricing & Profit Engine
- Base price from provider or manual
- Role-based markup with configurable ranges
- Per-order profit calculation
- Full audit history

#### 4. Wallet System
- Wallet per tenant & role
- Atomic operations: credit, debit, lock, refund
- Order wallet lock before processing
- Complete audit trail

#### 5. Provider Abstraction
- Plugin-based provider system
- No hard-coded provider assumptions
- Support for IMEI, remote files, server tasks, digital services

#### 6. Order Lifecycle Engine
- States: created → queued → processing → success | failed | refunded
- Async processing with callbacks/polling
- Per-role order visibility
- Immutable history

### Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start development
pnpm dev:api      # API on port 8787
pnpm dev:admin    # Admin on port 3000
pnpm dev:storefront # Storefront on port 3001
```

### Frontend Development

Frontend exists **only** to:
- Test APIs
- Manage platform entities
- Validate permissions
- Operate system manually

See `frontend-setup.md` for implementation guides.

### Phase 2 Status

| Component | Status | Description |
|-----------|--------|-------------|
| Monorepo Structure | ✅ | Turborepo + pnpm workspaces |
| Runtime Adapters | ✅ | Cloudflare, Vercel Edge, Deno |
| Core Domain | ✅ | Pure TypeScript, runtime-agnostic |
| tRPC Contracts | ✅ | Routers, procedures, permissions |
| Plugin System | ✅ | Foundation, extensible |
| Tenant System | ⏳ | Multi-tenant architecture |
| Role Engine | ⏳ | Data-driven roles |
| Pricing Engine | ⏳ | Markup & profit flow |
| Wallet System | ⏳ | Atomic operations |
| Provider Abstraction | ⏳ | Plugin system |
| Order Lifecycle | ⏳ | State machine |
| API Keys | ⏳ | Scope-based permissions |

### License

MIT
