# Plan — Production Install (Fly.io + Neon)

## Context

Code and docs work for this install is **done** on branch
`claude/shopify-b2b-portal`. What remains is operator-only deployment
work that requires Shopify, Neon, and Fly credentials the AI doesn't
have. This file is the install runbook.

What's already in the repo (no more code to write before deploy):

- **Production build chain** — `apps/server/Dockerfile` (multi-stage:
  installs deps, runs `yarn workspace @b2b/portal build`, moves the
  SPA into `apps/server/public`, runs the BFF via `tsx`).
- **`fly.toml`** with `release_command` pinned to
  `yarn workspace @b2b/db drizzle:migrate` so migrations apply
  atomically before any new machine accepts traffic.
- **Single-origin BFF** — `apps/server/src/index.ts` mounts the API
  under `/api/*` and serves the built SPA from `./public/` in
  production, so cookies "just work" without CORS.
- **Persistent cart-id** on `sessions.shopify_cart_gid` (cart survives
  BFF restarts and works across multiple Fly machines).
- **Real `/orders/:id/reorder`** — Admin/CAA lookup → filter lines
  without resolved variants → `cartCreate` → persist cart id → return
  `{ cartId, skippedLines }`.
- **Real `/quotes/:id/convert-to-cart`** — lifts approved-quote lines
  into `cartCreate`, advances the quote to `ordered`.
- **Initial Drizzle migration** at
  `packages/db/src/migrations/0000_daffy_blizzard.sql` (already
  includes `shopify_cart_gid`).
- **Client credentials token management** in
  `apps/server/src/shopify/adminToken.ts` — `getAdminToken()` fetches
  short-lived Admin API tokens automatically (POST
  `/admin/oauth/access_token`, `grant_type=client_credentials`),
  caches them in memory, and refreshes when fewer than 60 s remain
  before expiry. No operator rotation needed.
- **Custom-app posture** documented in `docs/CUSTOM_APP.md`,
  `docs/ARCHITECTURE.md`, `docs/SHOPIFY.md`, and `README.md`. No
  Partners app required.
- **Verified clean**: typecheck passes across all workspaces, tests
  pass, SPA production build clean, audit greps confirm no public-app
  artifacts.

What's explicitly out of scope (deferred to v2, tracked in plan §9):
auth hardening, observability, security headers, Draft Order mirror,
full deploy-ops runbook.

---

## 1. Prerequisites

Install on the operator's laptop:

```bash
brew install flyctl                 # or curl -L https://fly.io/install.sh | sh
fly auth login
```

Account access required:

- **Shopify Plus store with B2B enabled.** Plus-tier; B2B is included
  on Plus. Trial dev stores don't have B2B unless you've requested it
  from a partner manager.
- **Neon account** at neon.tech (free tier OK for testing).
- **Fly.io account** (free tier suffices for a single shared-cpu-1x
  machine).
- A domain you control if you want a custom URL (optional — the
  default `<app>.fly.dev` is equally valid for Shopify).

---

## 2. Phase 1 — Shopify configuration

Custom-app path. **Do not create a Partners app** — see
`docs/CUSTOM_APP.md` for the contrast.

### 2.1 Enable B2B and create a test company

1. Shopify Admin → **Settings → Customer accounts** → set to
   **New customer accounts**. (CAA requires the new experience.)
2. **Customers → Companies → Create company.**
   - Name: `Acme Test`
   - Add a Location: `Acme HQ` with shipping + billing addresses
   - Add a Contact: yourself (real email), assign role
     **Location admin** at the HQ location
3. **Catalogs → New catalog** → assign to `Acme HQ`. Add a couple of
   products with known SKUs (e.g. `WIDGET-001`).

### 2.2 Create the app in the Dev Dashboard

Shopify Admin → **Apps → "Develop apps"** now redirects all new app
creation to the **Shopify Dev Dashboard**. Click **"Build apps in Dev
Dashboard"** — the old Admin-based custom app flow no longer exists for
new apps.

In the Dev Dashboard:

1. **Create app** → name it e.g. `B2B Portal` → select your store.
2. **Configuration → Admin API scopes**. Add:
   - `read_companies`, `write_companies`
   - `read_company_locations`
   - `read_company_contacts`, `write_company_contacts`
   - `read_orders` (and `read_all_orders` if your store predates the
     order-scope split)
   - `read_draft_orders`, `write_draft_orders` (optional Draft Order
     mirror — v2)
3. **Configuration → Storefront API scopes**. Add:
   - `unauthenticated_read_product_listings`
   - `unauthenticated_read_product_inventory`
   - `unauthenticated_read_customers`
   - `unauthenticated_write_checkouts`
   - Any B2B `buyer_identity` scopes listed
4. **Save and install** the app on your store.
5. **API credentials** tab → capture the following:
   - **Client ID** → `SHOPIFY_CLIENT_ID`
   - **Client secret** → `SHOPIFY_CLIENT_SECRET`
   - **Storefront API access token** → `SHOPIFY_STOREFRONT_ACCESS_TOKEN`

   > **There is no Admin API access token to copy.** The Dev Dashboard
   > does not issue static `X-Shopify-Access-Token` values for new apps.
   > The BFF fetches short-lived tokens automatically at runtime via the
   > OAuth 2.0 client credentials grant. See
   > `apps/server/src/shopify/adminToken.ts`. If you see an automation
   > token (`atkn_…`) anywhere, it is from the legacy flow — do not use
   > it and revoke it if it was generated.

### 2.3 Configure the Customer Account API (Headless channel)

Shopify Admin → **Settings → Customer accounts → Headless storefronts**
(may be labelled "Customer Account API applications"):

1. **Create application.**
2. **Application URL**: leave placeholder for now; you'll fill in the
   Fly URL after Phase 3.
3. **Redirect URI**: also placeholder; will be `<fly-url>/auth/callback`.
4. Scopes: `openid`, `email`, `customer-account-api:full`.
5. Capture **Client ID** → `SHOPIFY_CAA_CLIENT_ID`. If it's a
   confidential client, also capture **Client secret** →
   `SHOPIFY_CAA_CLIENT_SECRET`.

You'll come back to this screen after Phase 3 to set the real URLs.

### 2.4 Capture all values

| Value | Env var |
|---|---|
| `<shop>.myshopify.com` | `SHOPIFY_SHOP_DOMAIN` |
| App Client ID | `SHOPIFY_CLIENT_ID` |
| App Client secret | `SHOPIFY_CLIENT_SECRET` |
| Storefront token | `SHOPIFY_STOREFRONT_ACCESS_TOKEN` |
| CAA Client ID | `SHOPIFY_CAA_CLIENT_ID` |
| CAA Client secret | `SHOPIFY_CAA_CLIENT_SECRET` (if confidential) |

---

## 3. Phase 2 — Neon Postgres

1. neon.tech → **Create project** named `shopify-b2b-portal`.
2. Region: pick one close to your Fly primary region (e.g.
   `aws-us-east-2` if Fly = `ord`).
3. Postgres version: 16 (matches `docker-compose.yml`).
4. **Connection details** → copy the **pooled** connection string:
   `postgres://<user>:<pwd>@<host>/<db>?sslmode=require`
5. That string is `DATABASE_URL` in Fly secrets.

No driver swap needed — the existing `postgres.js` client speaks
TCP+TLS to Neon directly. Neon free tier gives ~7-day PITR.

---

## 4. Phase 3 — Fly.io app

### 4.1 Edit `fly.toml`

The committed `fly.toml` has `app = "shopify-b2b-portal"`. **Change
this to a globally unique app name** before `fly launch`. Optionally
adjust `primary_region` (default `ord`).

### 4.2 Launch (without deploying)

From the repo root:

```bash
fly launch --no-deploy --copy-config --name <your-unique-name>
```

This creates the Fly app and reads `fly.toml` as-is. Skip the
"add a Postgres" prompt — Neon is already provisioned.

### 4.3 Custom domain (optional)

```bash
fly certs create portal.example.com
# Add the printed A + AAAA records to your DNS provider.
fly certs show portal.example.com    # wait for issued: true
```

Use either `portal.example.com` or `<your-app>.fly.dev` as `<prod-url>`
consistently for the next steps.

### 4.4 Set secrets

```bash
fly secrets set \
  SESSION_SIGNING_KEY="$(openssl rand -base64 48)" \
  DATABASE_URL="postgres://...neon.tech/...?sslmode=require" \
  PUBLIC_PORTAL_URL="<prod-url>" \
  SHOPIFY_SHOP_DOMAIN="<shop>.myshopify.com" \
  SHOPIFY_STORE_ID="<numeric-store-id>" \
  SHOPIFY_CLIENT_ID="<app-client-id>" \
  SHOPIFY_CLIENT_SECRET="<app-client-secret>" \
  SHOPIFY_STOREFRONT_ACCESS_TOKEN="<storefront-token>" \
  SHOPIFY_CAA_CLIENT_ID="<caa-client-id>" \
  SHOPIFY_CAA_CLIENT_SECRET="<caa-client-secret>" \
  SHOPIFY_CAA_REDIRECT_URI="<prod-url>/auth/callback"
```

Confirm with `fly secrets list` — every value should be present
(values themselves are hashed in the output).

### 4.5 Point Shopify CAA at the Fly URL

Back to Shopify Admin → **Settings → Customer accounts → Headless
storefronts → your application**:

- Application URL: `<prod-url>`
- Redirect URI: `<prod-url>/auth/callback` (exact match, no trailing
  slash)

Save.

### 4.6 Deploy

```bash
fly deploy
```

What happens (in order):

1. Fly builds `apps/server/Dockerfile` (installs deps, builds SPA,
   moves dist into `apps/server/public`).
2. Fly runs `release_command = yarn workspace @b2b/db drizzle:migrate`
   against the Neon `DATABASE_URL`. This creates every table in the
   initial migration including `shopify_cart_gid`. If it fails, the
   release aborts and the previous machine keeps serving traffic.
3. Fly rolls out the new machine; healthchecks on `/healthz`; drains
   the old one.
4. On the first Admin API call the BFF fetches a short-lived token via
   the client credentials grant and caches it. No manual token rotation
   is needed.

Tail logs: `fly logs`. Look for `BFF listening on http://localhost:8080`.

---

## 5. Phase 4 — Smoke test against production

Open `<prod-url>` in a fresh incognito window.

1. `/login` → **Continue with Shopify** → Shopify CAA hosted login →
   sign in as the test contact.
2. Redirect back to `<prod-url>/auth/callback`. Session cookie set
   on the production origin.
3. Dashboard renders. **Admin** link visible (you're a Location admin
   on a fresh company → `portal.admin` bootstrap fires automatically).
4. **Quick Order**: add `WIDGET-001` qty 1 → cart populates → click
   **Checkout** → redirected to Shopify hosted checkout.
5. Place the order in Shopify → return to the portal → `/orders` →
   click into detail → **Reorder** → new cart appears with the order's
   lines.
6. **New quote** → add `WIDGET-001` qty 5 → submit → auto-approves
   (approvals flag-off) → **Convert to cart** → cart populates from
   the quote's lines.
7. `/admin/company-settings` → change "Default expiry (days)" from 14
   to 7 → save → confirm the change appears in `/admin/audit-log`
   with correct `before`/`after`.

Cross-instance sanity (optional):

```bash
fly scale count 2
# repeat cart flows; cart persists across machines because cart id
# lives on sessions.shopify_cart_gid in Neon, not in memory
fly scale count 1
```

---

## 6. Local development workflow

After the production deploy lands, day-to-day development still
happens locally:

```bash
cp apps/server/.env.example apps/server/.env
# Fill in SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET (no static admin token)
docker compose up -d postgres
yarn db:migrate
yarn dev                            # SPA :3000, BFF :8787
```

The SPA already calls `/api/*`; Vite proxies it to `:8787` (path
preserved, no rewrite — the BFF mounts under `/api`).

For testing the **OAuth round trip locally against a real store**,
register a *second* CAA application in Shopify pointing at an
ngrok / cloudflared tunnel for `localhost:3000` (Vite is preconfigured
to accept ngrok/Cloudflare tunnel hosts via `allowedHosts`). Keep the
production CAA application pointing at the Fly URL.

---

## 7. Migration discipline

- Every schema change in `packages/db/src/schema/*.ts` is followed by
  `yarn db:generate` → check in the new SQL file.
- Local: run `yarn db:migrate` before `yarn dev`.
- Production: Fly's `release_command` applies them on every deploy.
- For destructive migrations, branch the Neon `main` database first
  (`Neon → Branches → New branch`), test the migration against the
  branch, and only merge after verification.

---

## 8. Verification checklist

- [ ] `fly status` shows the machine running, healthchecks green.
- [ ] `fly logs` shows `BFF listening on http://localhost:8080`.
- [ ] `<prod-url>/healthz` returns `{"ok":true}`.
- [ ] `fly secrets list` shows every required secret (`SHOPIFY_CLIENT_ID`,
      `SHOPIFY_CLIENT_SECRET`, etc.); no `SHOPIFY_ADMIN_ACCESS_TOKEN`
      entry (that variable no longer exists).
- [ ] CAA Redirect URI in Shopify matches `<prod-url>/auth/callback`
      **exactly** (no trailing slash).
- [ ] Sign-in completes; dashboard renders the company name.
- [ ] Bootstrap fired: first Location admin has `portal.admin`
      (the `/admin` link appears in the sidebar).
- [ ] Cart survives `fly machine restart <id>` (persists in Neon).
- [ ] **Reorder** produces a non-empty cart for an order placed during
      smoke test.
- [ ] **Convert quote to cart** populates the cart from the quote's
      lines.
- [ ] Admin write (company-settings change) appears in
      `/admin/audit-log` with correct `before`/`after`.
- [ ] Browser network panel: session cookie scoped to `<prod-url>`;
      no Shopify tokens visible client-side.
- [ ] **No public-app artifacts** — run from repo root:
      ```bash
      grep -rn '@shopify/app-bridge\|@shopify/shopify-app-' apps packages
      ls shopify.app.toml 2>/dev/null
      grep -rn 'shop_domain\|tenant_id\|installed_shops' packages/db/src/schema/
      grep -rn 'auth/install\|app/uninstalled' apps/server/src/
      grep -rn 'SHOPIFY_ADMIN_ACCESS_TOKEN' apps packages
      ```
      All five should return no matches. A hit on the last grep means a
      static-token reference slipped back in; remove it and use
      `getAdminToken()` from `apps/server/src/shopify/adminToken.ts`.

---

## 9. Known v2 follow-ups (deferred)

These remain documented and tracked, **not** required for first deploy:

| Item | Why it matters |
|---|---|
| CAA token auto-refresh on expiry | Sessions outlast the CAA access-token TTL |
| Server-side session delete on logout | Today's logout only clears the cookie |
| `hono/rate-limiter` on `/api/auth/*` | Brute-force protection on OAuth start |
| `hono/secure-headers` (CSP, HSTS) | Standard web hardening |
| Structured logging (`pino`) + Sentry DSN | Prod debugging |
| Real `tsc` build (workspace dist/main) | Faster BFF startup; no `tsx` in prod image |
| Draft Order mirror on quote approval | When `quoteMirrorToDraftOrder=true` |
| Personal-address CRUD via CAA | Currently read-only |
| Approval workflows | `FEATURE_APPROVALS=true`; schema already in place |
| Push webhooks for orders | Replace polling; still single-tenant — see `docs/CUSTOM_APP.md` |

---

## 10. Critical files (reference)

| File | Purpose |
|---|---|
| `apps/server/src/env.ts` | Zod schema for env vars; failures here surface as Fly deploy errors |
| `apps/server/src/shopify/adminToken.ts` | Client credentials grant — fetches, caches, and auto-refreshes Admin API tokens |
| `apps/server/src/shopify/adminClient.ts` | Admin GraphQL client — calls `getAdminToken()` on every request |
| `apps/server/src/shopify/oauth.ts` | CAA OAuth/PKCE — redirect URI must match Shopify exactly |
| `apps/server/src/auth/session.ts` | Session cookie signing; rotating `SESSION_SIGNING_KEY` logs everyone out |
| `apps/server/src/auth/permissions.ts` | `portal.admin` bootstrap rule on first Location-admin sign-in |
| `apps/server/Dockerfile` | Multi-stage build; SPA assets land at `apps/server/public/` |
| `fly.toml` | Deploy config; `release_command` runs migrations atomically |
| `docs/CUSTOM_APP.md` | Custom-vs-public-app posture and drift guardrails |
| `docs/SHOPIFY.md` | Canonical scope list per integration |
| `docs/ENVIRONMENT.md` | Variable reference |

---

## 11. Time budget

| Step | Time |
|---|---|
| Shopify configuration (§2) | 30 min |
| Neon project (§3) | 10 min |
| Fly app + secrets + first deploy (§4) | 30 min |
| Custom domain + cert (§4.3) | 15 min (plus DNS propagation) |
| Smoke test (§5) | 30 min |
| **Total** | **~2 hours** |

Assumes the Shopify Plus B2B store, Neon, and Fly accounts exist with
CLI access. Shopify is the most variable — gathering tokens balloons
if the store isn't pre-configured for B2B.
