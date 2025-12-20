# Progress log

This is a lightweight running log intended for maintainers.

## 2025-12-20

- Switched local dev to Miniflare (no Wrangler login) with local D1/KV/R2 emulation.
- Implemented validated configuration system (`backend/src/config`).
- Implemented pluggable auth provider system with:
  - email/password (PBKDF2)
  - JWT access tokens
  - refresh token rotation (KV)
  - session-based auth + session rotation (KV)
  - RBAC permissions
- Added repository-layer enforcement for DB access (Drizzle + D1) and soft delete columns/migration.
- Added global security middleware: secure headers, rate limiting, CSRF protection for session flows.
- Standardized response envelope and error handling.
- Added optional R2 storage routes for signed upload/download.
- Added `.cto/*` tracking docs and updated repository documentation.
