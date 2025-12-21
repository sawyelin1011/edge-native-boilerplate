# Backend Template Checklist (tracked)

This is the living checklist for the `backend/` package. It is intended to match what is actually implemented in code.

## Runtime / Edge

- [x] Cloudflare Workers runtime (V8 isolates)
- [x] No Node.js compatibility flags required
- [x] Web standards APIs only (Fetch/WebCrypto)

## Local development (mandatory)

- [x] Miniflare-based local development (`bun run dev` in `backend/`)
- [x] No Wrangler login required for local dev
- [x] Local emulation: D1
- [x] Local emulation: KV
- [x] Local emulation: R2
- [x] Local env loading without auth (`.dev.vars`)
- [x] Clear local vs production separation (`.dev.vars` vs `wrangler.toml`)

## Configuration system

- [x] Single config entry point (`src/config/index.ts`)
- [x] Validated config (Zod)
- [x] Safe defaults
- [x] Production hardening rules for secrets

## Database layer

- [x] D1-compatible SQL
- [x] Drizzle ORM integration
- [x] Schema-first
- [x] Migrations included
- [x] Repository pattern enforced for queries
- [x] Transaction-safe operations supported
- [x] Soft delete
- [x] Audit fields (`created_at`, `updated_at`)

## Auth

- [x] Pluggable auth interface (swap provider via a single file)
- [x] Email/password auth (PBKDF2)
- [x] Token-based auth (JWT access tokens)
- [x] Session-based auth (KV)
- [x] Refresh token rotation (KV)
- [x] Session rotation (KV)
- [x] RBAC permissions

## Security

- [x] Input validation on boundaries
- [x] Unified error handling
- [x] Consistent response shape
- [x] Rate limiting
- [x] CORS handling
- [x] Secure HTTP headers
- [x] CSRF protection for session-based requests
- [x] Avoid logging secrets (no auth token/secret logging in middleware)

## API

- [x] REST-ish resource structure
- [x] Versioned routing (`/api/v1`)
- [x] `/api/*` aliases to versioned routes
- [x] Health check endpoint

## GSMFlow platform layer

### Multi-role system

- [x] Roles: USER / RESELLER / DISTRIBUTOR / WEB_OWNER / ADMIN
- [x] Role-based pricing calculation utility
- [x] Balance field in DB
- [ ] Email verification sending (requires email provider plugin)
- [x] Email verification token + verify endpoint (KV)
- [ ] Password reset flow
- [ ] 2FA (TOTP)
- [ ] 2FA (SMS) (requires SMS provider plugin)

### Providers & services

- [x] Provider schema (`service_providers`)
- [x] Services schema (`services`) with provider mapping
- [x] Provider plugin registry
- [x] DHRU provider plugin (edge-native fetch)
- [x] Service sync route (admin)
- [ ] Automatic failover between providers for identical services (requires service mapping across providers)

### Orders

- [x] Order schema (`orders`)
- [x] Pending -> Processing -> Completed/Failed
- [x] Refund handling (failed/cancelled)
- [x] Public order status endpoint

### Payments

- [x] Payment schema (`payments`)
- [x] NOWPayments plugin (invoice + webhook signature verification)
- [x] Invoice creation endpoint
- [x] Webhook handler updates balance
- [ ] Multi-gateway payment plugin catalog (Stripe/PayPal etc.)

### Plugins

- [x] Plugin registry + config validation
- [x] Plugins table (`plugins`) for enable/disable + config

### CMS

- [x] Site settings table (`site_settings`) + admin endpoints
- [ ] CMS pages + content versioning
- [ ] Asset management beyond signed upload/download

## Optional storage module

- [x] R2 support (signed upload + signed download)
- [x] Optional at runtime via config
- [ ] Image optimization / transformations (requires account features such as Image Resizing/Images)
