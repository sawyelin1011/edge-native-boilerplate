# GSMFlow - Edge-Native Monorepo

## Phase 1 Foundation

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

- ✅ **Cloudflare Workers**
- ✅ **Vercel Edge Functions**
- ✅ **Deno Deploy**

### Key Features

- **Edge-First**: Built for V8-only Web APIs, no Node.js dependencies
- **Runtime-Agnostic**: Switch runtime by changing adapter only
- **Type-Safe**: tRPC for end-to-end type safety
- **Plugin-Ready**: Extensible architecture with lifecycle hooks
- **Multi-Tenant**: Tenant context injected at request level
- **Policy-Based**: Role/permission system via policy interfaces

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

### Phase 1 Status

| Component | Status |
|-----------|--------|
| Monorepo structure | ✅ Complete |
| Runtime adapters | ✅ Cloudflare, Vercel Edge, Deno |
| tRPC contracts | ✅ Routers, procedures, permissions |
| Core domain models | ✅ Interfaces, no implementation |
| Policy system | ✅ Interfaces, empty implementation |
| Plugin system | ✅ Foundation, no plugins |
| API endpoints | ✅ Health only |
| Admin frontend | ✅ Bootstrap only |
| Storefront frontend | ✅ Bootstrap only |

### What's Next (Phase 2)

- GSM services & IMEI logic
- Pricing & markup rules
- Provider integration
- Wallet & order management
- UI components & features

### License

MIT
