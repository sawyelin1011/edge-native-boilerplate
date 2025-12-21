# Backend (Cloudflare Workers)

Edge-native backend for Cloudflare Workers (V8 isolates), built with **Hono** + **TypeScript** + **Drizzle (D1)**.

## Local development (Miniflare)

Local development emulates Cloudflare resources without requiring Wrangler login.

```bash
cd backend
bun install
bun run dev
```

- API URL: `http://127.0.0.1:8787`
- Health: `GET /health`

Local resource persistence is stored in `backend/.mf/` (gitignored).

## Configuration

- Local: `backend/.dev.vars`
- Validated config entry point: `backend/src/config/index.ts`

## API

Versioned API base:

- `/api/v1/*`

Auth endpoints:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

## Database

- Schema: `src/lib/schema.ts`
- Migrations: `backend/migrations/*`

Scripts:

- `bun run db:create`
- `bun run db:generate`
- `bun run db:migrate` (local)
- `bun run db:migrate:prod` (remote)

## Auth provider plugin

Auth is designed to be replaceable without touching business logic.

- Provider contract: `src/modules/auth/types.ts`
- Active provider: `src/modules/auth/provider.ts`

To replace auth, export a different provider from `provider.ts`.

## Optional storage (R2)

Enabled via config:

- `STORAGE_ENABLED=true`
- `STORAGE_SIGNING_SECRET=...`

Signed upload/download endpoints live under `/api/v1/storage/*`.

## Production deployment

`wrangler.toml` is intended for production deployment.

```bash
cd backend
wrangler secret put JWT_SECRET
wrangler secret put SESSION_SECRET
bun run db:migrate:prod
bun run deploy
```

## Template status

See the tracked implementation status:

- `/.cto/STATUS.md`
- `/.cto/CHECKLIST.md`
