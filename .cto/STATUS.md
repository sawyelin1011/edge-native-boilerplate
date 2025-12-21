# edge-native-boilerplate — Implementation Status

Last updated: 2025-12-21

This folder is a lightweight, repo-local way to track template completeness and what has already been implemented so future work can continue without re-auditing the whole codebase.

## Current state

This repo is now a production-oriented Cloudflare Workers backend boilerplate (V8 isolate runtime, no Node.js compatibility flags required).

### Implemented modules (core)

- **Local dev (Miniflare, no Wrangler login):** `backend/package.json#dev`
  - Local emulation: **D1**, **KV**, **R2**
  - Environment loading: `backend/.dev.vars` via `--env-path`
- **Configuration system:** `backend/src/config/index.ts`
  - Safe defaults + strict validation
  - Environment-based hardening rules for production
- **Database layer (D1 + Drizzle):**
  - Schema-first: `backend/src/lib/schema.ts`
  - Repository pattern: `backend/src/db/repositories/*`
  - Transactions supported (DbExecutor union): `backend/src/db/client.ts`
  - Soft delete support via `deleted_at` columns
- **Authentication (pluggable):** `backend/src/modules/auth/*`
  - Provider interface + drop-in provider swap: `backend/src/modules/auth/provider.ts`
  - Default provider supports:
    - email/password (PBKDF2-SHA256)
    - access tokens (JWT)
    - refresh token rotation (KV)
    - session-based auth (KV) + session rotation
    - RBAC permissions
- **Security:**
  - Strict request validation: `backend/src/lib/validation.ts` (Zod)
  - Unified error responses: `backend/src/lib/http/*`
  - Secure headers: `backend/src/index.ts`
  - Rate limiting (KV): `backend/src/middleware/rateLimit.ts`
  - CSRF protection for session-based auth (header token): `backend/src/middleware/csrf.ts`
- **API design:**
  - Versioned routing at `/api/v1/*`
  - `/api/*` also routes to the same versioned handlers for convenience
  - Consistent response envelope: `{ success, data|error, requestId }`
  - Health check: `GET /health`
- **Optional object storage (R2):** `backend/src/routes/v1/storage.ts`
  - Signed uploads + signed downloads
  - Module is runtime-optional via config; `BUCKET` binding is typed optional.

### GSMFlow platform layer (in progress)

The repo now includes the beginnings of a GSMFlow-specific domain layer:

- Roles + pricing model: `backend/src/gsmflow/pricing.ts`
- Core schema + migration: `backend/src/lib/schema.ts`, `backend/migrations/0003_gsmflow_core.sql`
- Provider + services sync (DHRU plugin): `backend/src/plugins/provider/dhru.ts`, `backend/src/gsmflow/syncServices.ts`
- Orders lifecycle + refunds: `backend/src/gsmflow/orders.ts`
- Payment gateway plugin (NOWPayments): `backend/src/plugins/payment/nowpayments.ts`
- Admin endpoints for plugins/providers/settings: `backend/src/routes/v1/gsmflow/admin.ts`

Not implemented yet (tracked in checklist): BetterAuth integration, password reset flows, full 2FA (TOTP + SMS provider), full CMS.

## Known constraints

- Vitest/Miniflare integration tests live under `backend/src/__tests__` but are excluded from the Workers TypeScript config to keep the runtime type environment strictly `WebWorker`.

## Next steps (if you want to extend further)

- Add API key authentication as an additional pluggable auth provider.
- Add a dedicated “admin bootstrap” mechanism (first admin user creation).
- Add a first-class pagination/filtering utility and apply to list endpoints.
- Expand storage module (image transformations) if you enable Cloudflare Image Resizing or Cloudflare Images.
