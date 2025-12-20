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
- [x] Health check endpoint

## Optional storage module

- [x] R2 support (signed upload + signed download)
- [x] Optional at runtime via config
- [ ] Image optimization / transformations (requires account features such as Image Resizing/Images)
