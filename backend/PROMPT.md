# Edge Native Backend Boilerplate (Cloudflare Workers) — Operating Guide

This repository is a **production-oriented backend boilerplate** for Cloudflare Workers (V8 isolates) built with **Hono + TypeScript + Drizzle (D1)**.

It is intentionally:

- **Edge-native** (Web APIs only; no Node.js compatibility required)
- **Secure by default** (validated config, rate limiting, secure headers, CSRF for session flows)
- **Modular** (auth provider is pluggable; storage is optional)
- **Functional-first** (no framework-specific business logic assumptions)

---

## Quick start

```bash
cd backend
bun install
bun run dev
```

Local dev uses **Miniflare** and **does not require Wrangler login**.

- API URL: `http://127.0.0.1:8787`
- Health check: `GET /health`

---

## Local development requirements (Miniflare)

Local development is configured in `backend/package.json`:

- D1: `--d1 DB --d1-persist .mf/d1`
- KV: `--kv KV --kv-persist .mf/kv`
- R2: `--r2 BUCKET --r2-persist .mf/r2`
- Env loading: `--env-path .dev.vars`

This keeps local behavior close to production, while keeping production deployment managed by `wrangler.toml`.

---

## Configuration

Single entry point:

- `src/config/index.ts` (`getConfig(env)`)

Key properties:

- Validated at runtime (Zod)
- Safe defaults
- Production hardening rules (minimum secret lengths)

Local env vars:

- `backend/.dev.vars`

Production env vars:

- `backend/wrangler.toml` for non-secrets
- `wrangler secret put ...` for secrets

---

## Architecture

```
backend/src
├── config/                 # validated config
├── db/                     # drizzle client + repositories
├── lib/                    # jwt, password hashing, validation, http helpers
├── middleware/             # auth, csrf, rate limit, request context
├── modules/
│   ├── auth/               # auth provider interface + default provider
│   └── storage/            # signed URL helpers (optional)
└── routes/                 # versioned routing
```

### Database layer

- Schema: `src/lib/schema.ts`
- Migrations: `backend/migrations/*`
- Data access must go through repositories: `src/db/repositories/*`
- Soft deletes supported via `deleted_at`

### Unified HTTP response

All endpoints respond with a stable envelope:

```json
{ "success": true, "data": { ... }, "requestId": "..." }
```

or

```json
{ "success": false, "error": { "code": "...", "message": "..." }, "requestId": "..." }
```

---

## Authentication (pluggable)

### Provider contract

- Interface: `src/modules/auth/types.ts`
- Active provider selection: `src/modules/auth/provider.ts`

To replace auth entirely, swap the implementation exported from `provider.ts`.

### Default provider capabilities

- Email/password auth
  - Password hashing: PBKDF2-SHA256 (WebCrypto)
- Access tokens
  - JWT HS256 (WebCrypto HMAC)
- Refresh tokens
  - Stored + rotated in KV
- Sessions
  - Stored + rotated in KV
  - Session cookie is `HttpOnly` and `Secure` in production
- RBAC
  - Permissions map in `src/modules/auth/rbac.ts`

---

## API routing

Versioned routes:

- `GET /health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

Example resources:

- `GET /api/v1/users` (requires `users:read`)
- `POST /api/v1/users` (requires `users:write` + CSRF when session-authenticated)
- `GET /api/v1/posts`
- `POST /api/v1/posts` (requires `posts:write` + CSRF when session-authenticated)
- `GET /api/v1/products`
- `POST /api/v1/products` (requires `products:write` + CSRF when session-authenticated)

Backwards-compatible aliases:

- `/api/*` maps to `/api/v1/*` subset
- `/auth/*` maps to `/api/v1/auth/*` subset

---

## Security features

- Input validation on JSON boundaries (Zod): `src/lib/validation.ts`
- Secure headers: `secureHeaders()` middleware
- Rate limiting (KV): `src/middleware/rateLimit.ts`
- CSRF (for session flows): `src/middleware/csrf.ts`
- Request ID propagation: `X-Request-ID`

---

## Optional storage module (R2)

Routes:

- `POST /api/v1/storage/signed-upload` (admin)
- `PUT /api/v1/storage/upload/:key?exp=...&sig=...`
- `POST /api/v1/storage/signed-download` (auth)
- `GET /api/v1/storage/objects/:key?exp=...&sig=...`

Enable via config:

- `STORAGE_ENABLED=true`
- `STORAGE_SIGNING_SECRET=...`

The `BUCKET` binding is typed as optional so the storage module can be removed without breaking the core app.

---

## Template checklist (actual)

See:

- `/.cto/STATUS.md`
- `/.cto/CHECKLIST.md`
