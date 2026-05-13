# B2B Buyer Portal — Claude Code context

## What this repo is

Platform-agnostic B2B Buyer Portal. The frontend SPA (`src/`) is
commerce-platform-neutral; adapters in `src/commerce/adapters/` wire it
to a specific backend. The server package (`apps/server/`) is the BFF
(Backend For Frontend) that proxies Shopify APIs and manages sessions.

## Deployment runbook

**`docs/PLAN.md` is the canonical install runbook.** Read it before
starting any deployment-related task. Key points:

- Target: Fly.io (BFF) + Neon Postgres + Shopify Plus with B2B.
- **Shopify Admin API auth**: as of January 2026, new apps use the
  OAuth client credentials grant — no static access token.
  `SHOPIFY_CLIENT_ID` + `SHOPIFY_CLIENT_SECRET` replace the old
  `SHOPIFY_ADMIN_ACCESS_TOKEN`. Tokens are fetched and cached
  automatically by `apps/server/src/shopify/adminToken.ts`.
- Storefront API and Customer Account API credentials are unchanged.
- `fly secrets set` block is in `docs/PLAN.md §4.4`.

## Environment variables

`docs/ENVIRONMENT.md` is the authoritative variable reference.
Server-side Shopify vars live in `apps/server/src/env.ts` (Zod-validated).
Frontend vars are all `VITE_*` prefix; server vars have no prefix.

## Key constraints

- Do **not** add `SHOPIFY_ADMIN_ACCESS_TOKEN` anywhere — it is obsolete
  for new apps. Use `await getAdminToken()` from
  `apps/server/src/shopify/adminToken.ts` for every Admin API call.
- Do **not** create a Shopify Partners app. This is a custom app
  (single-store). See `docs/CUSTOM_APP.md`.
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN`, `SHOPIFY_CAA_CLIENT_ID`, and
  `SHOPIFY_CAA_CLIENT_SECRET` are separate credentials — do not confuse
  them with the Admin API client credentials.

## Test and typecheck

```bash
# Frontend (root)
npx vitest run          # 22 tests
npx tsc --noEmit

# Server
cd apps/server
npx vitest run          # 4 tests
npx tsc --noEmit
```

All 26 tests must pass before any commit that touches `apps/server/src/`
or `src/commerce/`.

## Branch

Active development branch: `claude/shopify-api-auth-update-76I0x`
