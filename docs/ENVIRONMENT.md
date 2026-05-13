# Environment Variables

All variables are read at build time by Vite. Defaults are sufficient for
running the mock adapter locally.

## App-level (always applicable)

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_COMMERCE_PLATFORM` | `mock` | Selects which adapter to load: `mock` or `bigcommerce` (extendable). |
| `VITE_API_BASE_URL` | `""` | Optional base URL for backends that need one. |
| `VITE_AUTH_PROVIDER` | `commerce` | `commerce` uses the selected adapter's auth; future values support external IDPs. |
| `VITE_DEFAULT_LOCALE` | `en-US` | Initial UI locale. |
| `VITE_DEFAULT_CURRENCY` | `USD` | Initial display currency. |

## Feature flags

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_ENABLE_QUOTES` | `true` | Show the Quotes feature. |
| `VITE_ENABLE_APPROVALS` | `false` | Show approval workflows in orders/quotes. |
| `VITE_ENABLE_COMPANY_MANAGEMENT` | `true` | Show Company / Users / Addresses. |
| `VITE_ENABLE_SHOPPING_LISTS` | `true` | Show Shopping Lists. |
| `VITE_ENABLE_INVOICES` | `false` | Show Invoices / AR. |

## BigCommerce adapter

Only used when `VITE_COMMERCE_PLATFORM=bigcommerce`. These live in
`src/commerce/adapters/bigcommerce/config.ts` and are not read elsewhere.

| Variable | Purpose |
| --- | --- |
| `VITE_BC_B2B_API_URL` | B2B Edition API URL (e.g. `https://api-b2b.bigcommerce.com`). |
| `VITE_BC_B2B_APP_CLIENT_ID` | App client id issued by B2B Edition. |
| `VITE_BC_STORE_HASH` | Store hash for Storefront API calls. |
| `VITE_BC_CHANNEL_ID` | Storefront channel id. |
| `VITE_BC_STOREFRONT_URL` | Public storefront origin (used for checkout hand-off). |

## Shopify server (`apps/server`)

Server-side only — never exposed to the browser. Read by `apps/server/src/env.ts`
via Zod and validated at startup.

| Variable | Purpose |
| --- | --- |
| `SHOPIFY_SHOP_DOMAIN` | Store domain (e.g. `your-store.myshopify.com`). |
| `SHOPIFY_CLIENT_ID` | OAuth app client ID from the Shopify Dev Dashboard. Used to obtain Admin API tokens via the client credentials grant. |
| `SHOPIFY_CLIENT_SECRET` | OAuth app client secret. Paired with `SHOPIFY_CLIENT_ID` — never commit this value. |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Static Storefront API token. Not affected by the Admin API credential change. |
| `SHOPIFY_CAA_CLIENT_ID` | Customer Account API OAuth client ID. Separate flow — unrelated to Admin API auth. |
| `SHOPIFY_CAA_CLIENT_SECRET` | Customer Account API OAuth client secret. |

> **Note on Admin API auth (January 2026 change).** New Shopify apps no longer
> receive a static `X-Shopify-Access-Token`. Tokens are obtained programmatically
> via the OAuth 2.0 client credentials grant, expire after 24 h, and are cached
> in memory by `apps/server/src/shopify/adminToken.ts`. See
> `apps/server/.env.example` for a complete template.
