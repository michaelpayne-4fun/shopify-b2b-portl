# Environment Variables

## Server (`apps/server/.env`)

| Variable | Default | Notes |
| --- | --- | --- |
| `PORT` | `8787` | BFF port |
| `PUBLIC_PORTAL_URL` | `http://localhost:3000` | Used for CORS + checkout redirects |
| `SESSION_SIGNING_KEY` | _required_ | 32+ bytes random; signs the JWT in the session cookie |
| `DATABASE_URL` | _required_ | Postgres connection string |
| `SHOPIFY_SHOP_DOMAIN` | _required_ | e.g. `acme.myshopify.com` |
| `SHOPIFY_STORE_ID` | _required_ | Numeric store ID from the Shopify admin URL (e.g. `98578891115`). Used to construct the Customer Account API OAuth endpoints (`https://shopify.com/{store-id}/auth/oauth/…`). |
| `SHOPIFY_CLIENT_ID` | _required_ | OAuth app client ID — used by `adminToken.ts` to obtain short-lived Admin API tokens via client credentials grant (replaces static `SHOPIFY_ADMIN_ACCESS_TOKEN`) |
| `SHOPIFY_CLIENT_SECRET` | _required_ | OAuth app client secret — paired with `SHOPIFY_CLIENT_ID`; never commit this value |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | _required_ | Public storefront token (static; unaffected by admin auth change) |
| `SHOPIFY_STOREFRONT_API_VERSION` | `2024-10` | |
| `SHOPIFY_ADMIN_API_VERSION` | `2024-10` | |
| `SHOPIFY_CAA_CLIENT_ID` | _required_ | Customer Account API client id |
| `SHOPIFY_CAA_CLIENT_SECRET` | optional | If your CAA app is a confidential client |
| `SHOPIFY_CAA_REDIRECT_URI` | _required_ | Must match the value configured on the Shopify app |
| `FEATURE_QUOTES` | `true` | Toggle quotes |
| `FEATURE_APPROVALS` | `false` | **OFF in v1** |
| `FEATURE_SHOPPING_LISTS` | `true` | Toggle shopping lists |
| `FEATURE_INVOICES` | `false` | Off in v1 |
| `FEATURE_MULTI_TIER_HIERARCHY` | `false` | Off in v1 |

## Portal (`apps/portal/.env`)

| Variable | Default | Notes |
| --- | --- | --- |
| `VITE_BFF_URL` | `http://localhost:8787` | Origin of the BFF |
| `VITE_DEFAULT_LOCALE` | `en-US` | |
| `VITE_DEFAULT_CURRENCY` | `USD` | |
| `VITE_ENABLE_QUOTES` | `true` | Hides UI when off |
| `VITE_ENABLE_APPROVALS` | `false` | **OFF in v1** |
| `VITE_ENABLE_SHOPPING_LISTS` | `true` | |
| `VITE_ENABLE_INVOICES` | `false` | |

The server-side flags are the authoritative gate; the SPA flags only
hide UI. Misaligned flags cause harmless "feature disabled" 404s.
