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
