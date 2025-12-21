# edge-native-boilerplate (Backend)

Production-oriented **Cloudflare Workers** backend boilerplate (V8 isolates) built with:

- **Hono** (routing)
- **Drizzle ORM** + **D1** (database)
- **KV** (sessions, refresh tokens, rate limiting)
- **R2** (optional signed uploads/downloads)
- **Zod** (validation)

This template is designed to be cloned and reused as a long-term backend foundation.

## Key properties

- Edge-native (Web APIs only)
- Secure by default (validated config, secure headers, rate limiting, CSRF for session flows)
- Modular & extensible (auth provider plugin)
- Strict typing (no `any`)

## Project structure

```
edge-native-boilerplate/
├── backend/     # Cloudflare Workers API
└── shared/      # shared types (API response contracts, auth types)
```

## Local development (Miniflare)

Local dev does **not** require Wrangler login.

```bash
bun install
bun run dev
```

- API URL: `http://127.0.0.1:8787`
- Health check: `GET /health`

## Production deployment

`backend/wrangler.toml` is for production deployment.

```bash
cd backend
# set secrets in your Cloudflare account
wrangler secret put JWT_SECRET
wrangler secret put SESSION_SECRET

# apply migrations
bun run db:migrate:prod

# deploy
bun run deploy
```

## Template status

See `/.cto/STATUS.md` and `/.cto/CHECKLIST.md`.
