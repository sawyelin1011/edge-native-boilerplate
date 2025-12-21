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

## 2025-12-21

- Extended domain model + migrations for GSMFlow: providers, services, orders, payments, plugins, site settings.
- Introduced GSMFlow role model (USER/RESELLER/DISTRIBUTOR/WEB_OWNER/ADMIN) and role-based pricing calculation.
- Implemented edge-native plugin registry + manager (functional, no classes).
- Implemented DHRU provider plugin + admin service sync endpoint.
- Implemented order lifecycle endpoints (create/place/status/public-status) with refunds.
- Implemented NOWPayments payment gateway plugin + invoice + webhook handling.
- Added email verification token issuance on register + verify endpoint (KV-based).
- Switched JWT implementation to the edge-compatible `jose` library.
