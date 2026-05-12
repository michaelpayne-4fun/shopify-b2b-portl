# B2B Buyer Portal

Platform-agnostic B2B buyer portal. A clean rewrite of
[`bigcommerce/b2b-buyer-portal`](https://github.com/bigcommerce/b2b-buyer-portal)
designed so the commerce backend is replaceable through well-defined adapters.

The repo ships with two adapters:

- **`mock`** — in-memory deterministic backend. Powers local development and
  tests with no external services. **This is the default.**
- **`bigcommerce`** — preserves the upstream behavior against the BigCommerce
  B2B Edition and Storefront APIs.

Future adapters (Shopify, Adobe Commerce, custom APIs, ERP-backed catalogs)
plug in via the same contract.

## Run it locally

```bash
yarn install      # or npm install / pnpm install
cp .env.example .env
yarn dev
```

The default `.env.example` selects the mock adapter. Sign in with any of:

| Email | Password | Role |
| --- | --- | --- |
| `admin@acme.test` | `password` | Company Admin (all permissions) |
| `senior@acme.test` | `password` | Senior Buyer (orders.viewCompany, addresses.manage, users.view) |
| `buyer@acme.test` | `password` | Buyer |

## Layout

```
docs/                  # technical assessment, architecture, plan, migration map
src/app/               # entry, providers, routing, config
src/features/          # one folder per business feature (pages + hooks)
src/domain/            # platform-neutral models, policies
src/commerce/          # adapter contract + adapter implementations
src/api/               # shared HTTP client, error types
src/ui/                # reusable components, layouts, forms, theme
src/state/             # zustand stores, react-query setup
src/tests/             # test setup, shared fixtures
```

See `docs/ARCHITECTURE.md` for the full layered design.

## Documentation

- **`docs/ASSESSMENT.md`** — analysis of the upstream repo and BigCommerce
  coupling points.
- **`docs/ARCHITECTURE.md`** — target architecture, layering rules, domain
  models, adapter contract.
- **`docs/PLAN.md`** — the phased rewrite plan.
- **`docs/MIGRATION.md`** — map from the upstream repo to this rewrite.
- **`docs/ADAPTERS.md`** — how to implement a new commerce adapter.
- **`docs/ENVIRONMENT.md`** — every env var, in one place.

## Scripts

| Script | What it does |
| --- | --- |
| `yarn dev` | Vite dev server on `http://localhost:3000` |
| `yarn build` | Type-check and produce a production bundle |
| `yarn preview` | Preview the production build |
| `yarn typecheck` | `tsc --noEmit` |
| `yarn lint` | ESLint over `src/**/*.{ts,tsx}` |
| `yarn test` | Run the Vitest suite |
| `yarn test:watch` | Watch-mode Vitest |

## Switching adapters

Set `VITE_COMMERCE_PLATFORM` to `mock` or `bigcommerce`. For BigCommerce you
also need:

```
VITE_BC_B2B_API_URL=
VITE_BC_B2B_APP_CLIENT_ID=
VITE_BC_STORE_HASH=
VITE_BC_CHANNEL_ID=
VITE_BC_STOREFRONT_URL=
```

No other code change is required. UI components never reference BigCommerce
APIs or response shapes directly; everything goes through `useCommerce()` and
the typed adapter contract.

## Adding a new commerce platform

See `docs/ADAPTERS.md`. In short: implement the 12 service interfaces in
`src/commerce/interfaces/`, register your adapter in
`src/commerce/adapters/registry.ts`, add your env vars, and run the contract
test against your adapter.
