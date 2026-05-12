# Deployment model: Shopify Custom App

This portal is a Shopify **custom app**, not a public app.

- **One deployment serves one Shopify Plus B2B store.**
- It is **not** distributed via the Shopify App Store.
- It is **not** installed per merchant via OAuth.
- It is hosted on infrastructure the merchant controls (Fly.io + Neon
  in `fly.toml`; any equivalent stack works).

If you're an operator who's previously shipped a public Shopify app
from the App Store, the credential-issuing path here is different —
read on.

## How the merchant provisions credentials

All credentials are issued **inside the merchant's own Shopify Admin**,
not in Shopify Partners. There is no Partners app to create.

### Admin API + Storefront API tokens

1. Shopify Admin → **Apps → "Develop apps"** → **Create an app**.
2. Configure the **Admin API integration**: pick the scopes from
   `docs/SHOPIFY.md`. Save.
3. Configure the **Storefront API integration** on the same custom app:
   pick the Storefront scopes from `docs/SHOPIFY.md`. Save.
4. Click **Install app**. This installs the custom app on the
   merchant's own store (no review, no public listing).
5. **API credentials** tab → copy the **Admin API access token**
   (visible once) → set as `SHOPIFY_ADMIN_ACCESS_TOKEN`.
6. Same tab → copy the **Storefront API access token** → set as
   `SHOPIFY_STOREFRONT_ACCESS_TOKEN`.

The merchant can rotate either token at any time by re-installing the
app or rotating credentials from the same screen.

### Customer Account API (Headless channel)

The CAA app is **separate** from the Admin/Storefront custom app and
**separate** from Partners apps. It is configured under the merchant's
Headless channel:

1. Shopify Admin → **Settings → Customer accounts**. Set "Customer
   accounts" to **New customer accounts**.
2. **Headless storefronts** (sometimes labelled "Customer Account API
   applications") → **Create application**.
3. **Application URL**: the production URL of this portal (e.g.
   `https://portal.example.com`).
4. **Redirect URI**: `https://portal.example.com/auth/callback`
   (the exact value also goes into `SHOPIFY_CAA_REDIRECT_URI`).
5. Scopes: `openid`, `email`, `customer-account-api:full`.
6. Copy **Client ID** → `SHOPIFY_CAA_CLIENT_ID`. If the app is a
   confidential client, copy **Client secret** → `SHOPIFY_CAA_CLIENT_SECRET`.

The CAA app is conceptually a headless-storefront OAuth client —
buyers (not merchants) authenticate against it. This portal is the
"headless storefront" it serves.

### Do NOT use Shopify Partners

Shopify Partners is only required for App Store distribution. Do not
create a Partners app for this portal — it would set up the public-app
OAuth-install flow, which this codebase is not designed for.

## What custom apps don't need (and that this portal doesn't have)

| Public-app concern | This portal |
|---|---|
| OAuth install flow per merchant | Not present — tokens come from env vars |
| Per-shop access-token storage | No `installed_shops` / `shop_domain` columns |
| Multi-tenant DB keyed by shop | Single-tenant; data implicitly scoped to the one configured store |
| Shopify Billing API | Not integrated |
| App Bridge / embedded admin UI | None — this portal is a standalone SPA on its own domain |
| Mandatory privacy webhooks (`customers/data_request`, `customers/redact`, `shop/redact`) | None — those are App Store review requirements |
| App listing & review process | N/A |
| Shopify Partners account ownership | N/A |

If you `grep` the repo for `@shopify/app-bridge`, `@shopify/shopify-app-`,
`shopify.app.toml`, `installed_shops`, or `shop_domain` you should find
zero matches. See §"DO / DON'T for future contributors" below.

## Operational consequences

- **Token rotation**: rotate via `fly secrets set ...` (or your
  hosting equivalent) followed by a redeploy. The session-signing key
  follows the same path; rotating it logs everyone out.
- **API rate limits**: Storefront 220 req/min and Admin 40 GraphQL
  points/sec (leaky bucket) — the standard per-shop limits. We only
  consume them on behalf of one merchant.
- **Adding another merchant**: spin up a separate deployment with
  that merchant's own tokens, Neon database, and Fly app. There is
  no shared hosting and no per-shop routing in this codebase.
- **No webhook listener**: the portal polls Shopify (CAA + Admin) on
  demand for orders and company data. If you want push-based updates
  for a custom app you can subscribe via Admin API mutations from this
  same custom-app token; that's a feature add, not a deployment-model
  change.

## DO / DON'T for future contributors

Code-review-time guardrails so the custom-app posture doesn't drift:

**Don't add:**
- `@shopify/app-bridge` / `@shopify/app-bridge-react` (embedded admin UI)
- `@shopify/shopify-app-express`, `@shopify/shopify-app-remix`, or
  any `@shopify/shopify-app-*` package
- `shopify.app.toml` (Shopify CLI config — public-app artifact)
- A `shop_domain`, `tenant_id`, or `installed_shops` column on any
  table
- A `/webhooks/*` route (unless explicitly adding push notifications
  for this single-merchant deployment — see "No webhook listener"
  above)
- A `POST /auth/install` or per-shop OAuth-install handler
- A `/billing` route or Shopify Billing API integration
- Mandatory GDPR webhook handlers (those are public-app review
  requirements, not custom-app needs)

**Do add (still custom-app-compatible):**
- More CAA scopes if the buyer experience needs them
- More Admin API scopes if BFF logic needs them
- Push-notification webhooks subscribed by the *operator* via Admin
  GraphQL, handled by a new `/webhooks/<topic>` route in
  `apps/server/src/routes/` — still a single-tenant deployment

## If you ever wanted to convert this to a public app

This is **out of scope** for v1 and not planned. But if the
requirement changed, here's the explicit list of work:

1. Add a `shops` (or `installed_shops`) table keyed by `shop_domain`.
2. Add a `shop_domain` column to every portal-owned table.
3. Add an OAuth install flow (`/auth/install`, `/auth/shopify/callback`)
   that exchanges per-shop tokens and stores them encrypted.
4. Replace `env().SHOPIFY_ADMIN_ACCESS_TOKEN` reads in
   `apps/server/src/shopify/adminClient.ts` with a per-request lookup
   keyed by the active shop.
5. Subscribe to and handle `app/uninstalled`, `customers/data_request`,
   `customers/redact`, `shop/redact`.
6. Integrate the Shopify Billing API.
7. Decide on App Bridge / embedded admin (separate UI surface from
   the buyer-facing SPA).
8. Submit for App Store review.

That's a substantial rewrite, not a config flip — which is exactly
why this commitment is worth making explicit now.

## Verification

Run from the repo root:

```bash
# 1. No public-app SDKs.
grep -rn '@shopify/app-bridge\|@shopify/shopify-app-' \
  --include='*.ts' --include='*.tsx' --include='*.json' \
  apps packages

# 2. No CLI app config.
ls shopify.app.toml 2>/dev/null && echo "FAIL: public-app artifact" || echo "OK"

# 3. No multi-tenant columns.
grep -rn 'shop_domain\|tenant_id\|installed_shops' packages/db/src/schema/

# 4. No app-install OAuth handlers.
grep -rn 'auth/install\|app/uninstalled' apps/server/src/

# 5. No App Store / Partners terminology in user-facing docs.
grep -rn 'app store\|partners app\|partner dashboard' README.md docs/
```

All five should return no matches (or only the explanatory mentions
inside this file). If any return real matches, the custom-app posture
has drifted — investigate before merging.
