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

## Hard rules (apply to every change, every agent)

These rules hold for Claude Code, Cowork, and any other agent operating
in this repo. They exist because every one of them was added after a
real failure during development.

1. **Never guess.** Before touching code to fix a bug, identify a
   data-driven signal that proves the diagnosis: a log line, a failing
   test, a schema validator result, a database row, a `curl` output.
   Cite the source in the commit message. If no such signal is
   available, your first step is to obtain one — not to ship code.

2. **Shopify GraphQL changes are validated before push.** Every query
   or mutation edit goes through `validate_graphql_codeblocks` against
   the correct API (`admin` for Admin queries, `customer` for Customer
   Account queries, `storefront-graphql` for Storefront queries)
   before `git push`. If you do not have access to the validator,
   stop and ask the user — do not push speculative GraphQL. The CAA
   schema in particular has subtle field-name differences from Admin
   (`zoneCode` vs `provinceCode`, `territoryCode` vs `countryCodeV2`,
   `phoneNumber` vs `phone`) that the docs do not always make obvious.

3. **Typecheck + tests pass before commit.** Run:
   ```
   yarn workspace @b2b/portal typecheck
   yarn workspace @b2b/server typecheck
   yarn workspace @b2b/server test
   ```
   All three green before `git add`. The server runs via `tsx` in
   production so type errors do not block the deploy — they will leak
   to runtime.

4. **One logical change per commit, one branch per change.** Branch
   pattern: `fix/<area>-<short-slug>-<8-hex>` for bug fixes,
   `feat/<area>-<short-slug>-<8-hex>` for new behaviour. Conventional
   Commits message. After the merge, tag the resulting commit
   `fix-<N>-<slug>` or `feat-<N>-<slug>` so individual changes can be
   reverted in isolation.

5. **When a fix fails, revert — don't stack.** If a deploy goes red
   after your merge and your change is the cause, revert that merge
   before opening any new branch. Do NOT chain a second "fix" on top
   of a broken deploy.

6. **Pre-existing typecheck/test failures are blockers, not noise.**
   If you find a red gate that is not from your change, fix or
   quarantine it before continuing. Never bypass with `--no-verify`,
   never delete the failing assertion, never disable the typecheck
   step. The `.claude/settings.json` hook blocks `--no-verify`
   pushes/commits as a backstop.

7. **Address fields depend on which Shopify API you're querying.**
   The codebase touches three address types with different schemas:
   - Admin `MailingAddress` (Order.shippingAddress on Admin queries):
     `provinceCode`, `countryCodeV2`, `phone`, `company`
   - CAA `CustomerAddress` (Order.shippingAddress on CAA, Customer
     addresses): `zoneCode`, `territoryCode`, `phoneNumber`, `company`
   - CAA `CompanyAddress` (CompanyLocation.shippingAddress on CAA):
     `zoneCode`, `territoryCode`, `phone`, `companyName`
   `apps/server/src/shopify/mappers/addressMapper.ts` accepts any of
   these and maps to the canonical domain `Address` — but the GraphQL
   selector must match the API being queried. When in doubt, run
   `validate_graphql_codeblocks`.
