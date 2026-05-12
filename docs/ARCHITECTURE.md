# Architecture

## Layering

```
+--------------------------------------------------+
|  SPA  (apps/portal)                              |
|   - React + MUI + Router + React Query           |
|   - features/*/pages call services/*Service.ts   |
|   - services/* call bffClient (fetch w/ cookie)  |
|   - state: zustand for buyer context; rest in    |
|     React Query                                  |
+--------------------------------------------------+
|  BFF  (apps/server)                              |
|   - Hono on Node                                 |
|   - Cookie session -> AuthContext (per request)  |
|   - Mediates ALL Shopify calls (Storefront/CAA/  |
|     Admin); SPA never touches Shopify directly   |
|   - Owns portal DB                               |
+--------------------------------------------------+
|  packages/domain                                 |
|   - Buyer, Company, Cart, Order, Quote, ...      |
|   - PermissionPolicy, QuotePolicy, state machine |
+--------------------------------------------------+
|  packages/db                                     |
|   - Drizzle schema + migrations + db client      |
+--------------------------------------------------+
|  Shopify Plus B2B                                |
|   - Storefront API (browser-safe surface)        |
|   - Customer Account API (per-buyer token)       |
|   - Admin GraphQL (server-only)                  |
+--------------------------------------------------+
|  Postgres                                        |
|   - Tables: sessions, buyers, role_assignments,  |
|     quotes, shopping_lists, approval_rules,      |
|     company_settings, admin_audit_log            |
+--------------------------------------------------+
```

## Trust boundaries

- **Browser**: only a signed session cookie (HTTP-only). Never sees
  Shopify access tokens.
- **BFF**: holds CAA buyer access token (per session row) and the
  Admin API access token (server env). Mediates everything.
- **Postgres**: reachable only from the BFF.

## Data flow examples

### Sign-in

```
SPA LoginPage --POST /auth/login--> BFF
                                     ├── inserts oauth_states (state + PKCE verifier)
                                     └── returns authorizeUrl
SPA window.assign(authorizeUrl)
                  ↓
Shopify CAA hosted login --redirect /auth/callback?code&state-->
                  ↓
SPA AuthCallbackPage --POST /auth/callback--> BFF
                                                ├── exchange code -> CAA tokens
                                                ├── resolve customer + company
                                                ├── bootstrap portal_admin grant (first time)
                                                ├── ensure company_settings row
                                                ├── insert sessions row
                                                └── Set-Cookie signed session
SPA --invalidate /auth/me--> hydrate BuyerContext --> navigate /
```

### Cart add

```
SPA QuickOrder --POST /cart/items--> BFF (requireAuth)
                                       ├── ensure Shopify cart exists for session
                                       ├── resolve sku -> variant id (Storefront)
                                       ├── cartLinesAdd (Storefront w/ buyerIdentity)
                                       └── return mapped Cart
SPA React Query caches under ['cart']
```

### Quote submit (approvals flag-off)

```
SPA QuoteDetail --POST /quotes/:id/submit--> BFF
                                              ├── requirePermission('quotes.submit')
                                              ├── advanceQuote(... 'submit', { approvalsEnabled: false })
                                              │      -> 'approved' (skips submitted state)
                                              └── update row, return Quote
```

### Admin write (audited)

```
SPA CompanySettings --PATCH /admin/company-settings--> BFF
                                                        ├── requirePermission('portal.admin')
                                                        ├── load `before` snapshot
                                                        ├── withAudit({ ..., fn: updateCompanySettings })
                                                        │      ├── update row
                                                        │      └── append admin_audit_log row
                                                        └── return CompanySettings
```

## Permission layering

Final `Role.permissions` returned by the BFF is the union of:

1. **Shopify-derived** — `apps/server/src/shopify/mappers/permissionMapper.ts`
   translates the buyer's `CompanyContactRoleAssignment` into the
   canonical `Permission` set.
2. **Portal-DB grants** — rows from `role_assignments` that augment the
   role with `approvals.act`, `shoppingLists.manage`, `quotes.*`,
   `portal.admin`.

`portal.admin` is **never** sourced from Shopify; first-time
`Location admin` sign-ins bootstrap a grant if the company has none.

## Feature flags

Server-side flags (in `apps/server/src/env.ts`) gate route registration
via `requireFeatureFlag(...)`. SPA-side flags (in `apps/portal/src/app/config/env.ts`)
gate route registration in the router and hide sidebar entries.

- `FEATURE_QUOTES` — enabled in v1
- `FEATURE_APPROVALS` — **OFF in v1**; tables + types exist for future flip
- `FEATURE_SHOPPING_LISTS` — enabled in v1
- `FEATURE_INVOICES` — off in v1
- `FEATURE_MULTI_TIER_HIERARCHY` — off in v1

## Why no adapter layer

A platform-agnostic adapter pattern was scaffolded in an earlier branch
and discarded. The portal is purpose-built for Shopify Plus B2B; the
gap analysis in `docs/GAP_ANALYSIS.md` makes the decision explicit per
capability. Replacing Shopify in this codebase is a deliberate rewrite,
not a configuration change.
