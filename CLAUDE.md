# B2B Buyer Portal — Claude Code context

## What this repo is

Shopify-native B2B Buyer Portal. The BFF (`apps/server/`) proxies
Shopify Admin and Customer Account APIs and serves the SPA. The portal
(`apps/portal/`) is the React SPA. Shared packages live in `packages/`.

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
Server-side vars are Zod-validated in `apps/server/src/env.ts`.
Portal vars are all `VITE_*` prefix.

## Key constraints

- Do **not** add `SHOPIFY_ADMIN_ACCESS_TOKEN` anywhere — it is obsolete
  for new apps. Use `await getAdminToken()` from
  `apps/server/src/shopify/adminToken.ts` for every Admin API call.
- Do **not** create a Shopify Partners app. This is a custom app
  (single-store). See `docs/CUSTOM_APP.md`.
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN`, `SHOPIFY_CAA_CLIENT_ID`, and
  `SHOPIFY_CAA_CLIENT_SECRET` are separate credentials — do not confuse
  them with the Admin API client credentials.

## Branch

Active development branch: `claude/shopify-b2b-portal`
