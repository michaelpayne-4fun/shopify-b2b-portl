# Technical Assessment: BigCommerce B2B Buyer Portal

This assessment captures the architecture of the upstream
`bigcommerce/b2b-buyer-portal` repository and identifies coupling points that
must be addressed by the rewrite.

## 1. Current architecture

| Area | Implementation |
| --- | --- |
| Monorepo | Turborepo |
| Language | TypeScript |
| UI | React 18 + MUI 5 + Emotion |
| Bundler | Vite |
| Routing | React Router v6 (declarative, file-by-page) |
| Client state | Redux Toolkit + redux-persist |
| Server state | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| GraphQL | `graphql` + codegen tools |
| i18n | `react-intl` |
| Tests | Vitest + Testing Library + MSW |
| Node / yarn | Node ≥ 22.16, Yarn 1.22.17 |

### Workspaces

- `apps/storefront` — primary SPA, injected into a BigCommerce Stencil or
  headless storefront.
- `packages/ui` — MUI-based components shared across apps.
- `packages/store` — shared Redux slices.
- `packages/b3global` — global utilities tied to the `b3` (BigCommerce B2B)
  runtime contract.
- `packages/tsconfig`, `packages/eslint-config-b3` — toolchain.

### `apps/storefront/src`

- `App.tsx`, `main.ts`, `headless.ts`, `theme.tsx`
- `HeadlessController/` — bridges the SPA to the BigCommerce storefront when
  running in headless mode.
- `pages/` — page-per-route components: `Login`, `ForgotPassword`,
  `Registered`, `RegisteredBCToB2B`, `HomePage`, `Dashboard`, `MyOrders`,
  `OrderDetail`, `CompanyOrderList`, `QuickOrder`, `order/`, `QuotesList`,
  `QuoteDetail`, `QuoteDraft`, `quote/`, `AccountSetting`, `UserManagement`,
  `AddressList`, `ShoppingLists`, `ShoppingListDetails`, `CompanyHierarchy`,
  `Invoice`, `InvoicePayment`.
- `shared/service/` — API client layer:
  - `b2b/` — BigCommerce B2B Edition GraphQL/REST.
  - `bc/` — BigCommerce Storefront/Stencil REST.
  - `request/` — shared HTTP helpers.
- `store/` — Redux slices and persistence.
- `hooks/`, `lib/`, `utils/`, `constants/`, `types/`, `assets/`.

### Runtime / deployment

- Built for two modes:
  1. **Stencil** injection — header/footer script tags load the bundle into a
     BC-hosted storefront. The portal hijacks routes within the storefront
     domain (`https://<store>.mybigcommerce.com/`).
  2. **Headless** integration — Catalyst / Next.js / custom storefront calls
     the portal as a sub-application, mediated by `HeadlessController`.
- Environment is configured via Vite env vars (`VITE_*`), most notably
  `VITE_B2B_URL` (B2B Edition GraphQL service) and
  `VITE_LOCAL_APP_CLIENT_ID` (B2B Edition app id).

## 2. Core workflows

- **Auth**: credential or token exchange against B2B Edition; session persisted
  in storage; Stencil cookie sync when injected.
- **Buyer / company context**: company id, location, role and permissions
  loaded after auth and required for almost every request.
- **Catalog / quick order**: SKU lookup against BC Storefront API, with
  contract pricing from B2B Edition.
- **Cart / checkout**: cart lives on the BC storefront; the portal mutates it
  via Storefront APIs, then hands off to BC checkout.
- **Orders**: order history mixes B2B Edition company-scoped views and BC
  storefront customer orders.
- **Quotes**: full CRUD against B2B Edition (draft, submit, accept, convert
  to order).
- **Addresses / users / company hierarchy**: B2B Edition data.
- **Shopping lists**: B2B Edition feature.
- **Invoices**: B2B Edition invoicing/AR.
- **Approvals**: present in some plans; UI gating depends on raw permission
  strings returned by the API.

## 3. BigCommerce coupling points

Classification key:
- `M` — Must preserve as abstract business capability (lives in the app).
- `R` — Can be replaced with generic commerce behavior.
- `D` — Should be removed.
- `A` — Must remain only in the BigCommerce adapter.

| # | Coupling point | Class | Disposition |
|---|---|---|---|
| 1 | `VITE_B2B_URL` / B2B Edition GraphQL endpoints | A | Lives in `commerce/adapters/bigcommerce/config.ts`. |
| 2 | `VITE_LOCAL_APP_CLIENT_ID`, BC app credentials | A | BC adapter only. |
| 3 | BC Storefront REST (`/api/storefront/...`) cart/checkout | A | BC adapter `CartService` / `CheckoutService`. |
| 4 | Stencil cookie / session sync | A | BC adapter `AuthService`. |
| 5 | `HeadlessController/`, `headless.ts` | A → R | Replaced with a generic `StorefrontHost` integration contract. |
| 6 | BC response shapes used directly in components / Redux | M | Replaced with platform-neutral domain models and mappers. |
| 7 | Store hash / channel id baked into URLs | A | Moved to adapter config; app references `BuyerContext.channelId` only as an opaque value. |
| 8 | Raw permission strings interpreted in components (`if (user.permissions.includes('foo'))`) | M | Replaced with `PermissionPolicy` + `<Can permission="..." />`. |
| 9 | B3 globals (`window.b3`, etc.) | D | Removed; replaced with explicit injection of the adapter. |
| 10 | B2B Edition concepts (company, role) embedded in UI strings | M | Kept as abstract domain concepts (Company, Role) — generic to B2B. |
| 11 | BC pricing concepts (price lists, customer groups) | M | Generalized to `PriceList` / `ContractPrice`. |
| 12 | BC quote API shape (`quoteId`, `tracker`, `extraFields`) | A | Mapped into neutral `Quote` model. |
| 13 | BC invoice / AR APIs | M (feature) / A (impl) | Gated by `ENABLE_INVOICES`. |
| 14 | BC approvals workflow | M (feature) / A (impl) | Gated by `ENABLE_APPROVALS`. |
| 15 | `react-intl` message bundle keyed off BC translation service | R | Replaced with a simple, file-based i18n surface that any backend can hydrate. |
| 16 | reCAPTCHA assumptions for registration | R | Pluggable `CaptchaProvider` interface (optional). |
| 17 | `redux-persist` of remote data | D | Server state owned by React Query; only `BuyerSession` is persisted client-side. |
| 18 | Hardcoded BC route assumptions (e.g. `/checkout`) | A | BC adapter exposes a `getCheckoutUrl()` method. |

## 4. Risks in the existing implementation

- **Tight coupling**: BC response shapes flow into Redux and components, so
  adding another platform requires touching the UI tree.
- **Two layers of state for the same data**: Redux + React Query duplicate
  server data, with persistence diverging from server truth.
- **Permission gating by string match** in components: hard to test, hard to
  audit, easy to drift.
- **Storefront injection model**: the portal both runs as a SPA and mutates a
  parent storefront's DOM/state, which mixes concerns.
- **Implicit global state** (`window.b3`, Stencil cookies): not safe to run
  outside a BC-hosted storefront.
- **No adapter contract**: replacing or mocking the backend means rewriting
  feature code.

## 5. Rewrite opportunities

- Move every external call behind a `CommerceAdapter` and 12 service
  interfaces.
- Introduce platform-neutral domain models and BC-specific mappers.
- Centralize permissions in a `PermissionPolicy` and a declarative `<Can />`
  component.
- Use React Query for *all* server state; use Zustand for the very small
  amount of persisted client state (`BuyerSession`). Drop Redux + redux-persist.
- Provide a fully working **mock adapter** so the app runs and tests against a
  deterministic backend without BigCommerce.
- Keep MUI 5 and React Router v6 for continuity, but isolate them behind the
  `ui/` layer.
- Feature-flag features that are BC-B2B-specific (invoices, approvals, quotes
  on/off).
