# Target Architecture

## Layering

```
+--------------------------------------------------+
|  UI (features/*, ui/*)                           |
|   - React components, MUI, forms, routes         |
|   - Calls hooks; never API clients directly      |
+--------------------------------------------------+
|  Application services & hooks                    |
|   - features/*/hooks/use*.ts                     |
|   - React Query mutations/queries                |
|   - Read from CommerceAdapter via context        |
+--------------------------------------------------+
|  Domain                                          |
|   - models/, services/, policies/                |
|   - Platform-neutral types and business rules    |
+--------------------------------------------------+
|  Commerce contract                               |
|   - commerce/interfaces/*.ts                     |
|   - Pure interfaces against domain models        |
+--------------------------------------------------+
|  Commerce adapters                               |
|   - commerce/adapters/{mock,bigcommerce,...}     |
|   - Implements interfaces, maps platform shapes  |
+--------------------------------------------------+
|  API clients & infra                             |
|   - api/clients/http.ts, fetch, errors           |
+--------------------------------------------------+
```

Rules:
- UI components import from `features/*` and `ui/*` only; they never import
  from `commerce/` or `api/`.
- `features/*/hooks/*` access commerce through the `CommerceAdapter` injected
  by `CommerceProvider`. They return domain models, never raw responses.
- `commerce/interfaces/*` cannot import from `commerce/adapters/*`.
- `commerce/adapters/*` are the only place platform SDKs/URLs may appear.

## Folder structure

```
/src
  /app
    /routing          # react-router setup, ProtectedRoute, route table
    /providers        # AppProviders, Commerce/Auth/Query/Theme providers
    /config           # env parsing, feature flags
  /features
    /auth             # login, forgot password, register
    /account          # dashboard, account settings
    /company          # company hierarchy, locations
    /users            # user management
    /addresses        # address book
    /catalog          # quick order, product lookup
    /cart             # cart view
    /orders           # order list / detail
    /quotes           # quote list / detail / draft
    /shopping-lists   # shopping lists
    /invoices         # invoices (optional)
  /domain
    /models           # platform-neutral data shapes
    /services         # domain logic (pure)
    /policies         # PermissionPolicy, OrderPolicy, QuotePolicy
  /commerce
    /interfaces       # CommerceAdapter and 12 service interfaces
    /adapters
      /mock           # in-memory deterministic adapter
      /bigcommerce    # BC adapter + mappers + client
  /api
    /clients          # http(), shared fetch
    /errors           # ApiError, NetworkError, NotAuthorizedError
    /mappers          # pagination, cursor helpers
  /ui
    /components       # Can, DataTable, EmptyState, ErrorState, ...
    /layouts          # PortalLayout, AuthLayout
    /forms            # FormTextField, FormSelect, ...
    /feedback         # ErrorBoundary, Toast
  /state
    /stores           # zustand stores (auth session, ui prefs)
    /queries          # react-query client, query-key registry
  /i18n               # locale message bundles
  /utils              # cn, money, date, format
  /tests              # MSW handlers, fixtures, test helpers
```

## Domain models

Defined in `src/domain/models/*`. The full TypeScript declarations are
authoritative; this is the summary.

- **Money** `{ amount: number; currency: CurrencyCode }`
- **Address** — generic postal address with optional company/phone.
- **Permission** — string literal union of capabilities.
- **Role** `{ id, name, permissions: Permission[], isAdmin }`
- **Buyer** `{ id, email, firstName, lastName, role, locale? }`
- **Company** `{ id, name, status, locations, defaultLocationId? }`
- **CompanyLocation** `{ id, name, address, isDefault, channelHint? }`
- **BuyerContext** `{ buyer, company, location?, channelId?, currency, locale }`
- **Product** `{ id, sku, name, slug?, images[], options[], variants[] }`
- **ProductVariant** `{ id, sku, name, attributes, price, inventory? }`
- **PriceList** / **ContractPrice** — buyer-scoped pricing rules.
- **Inventory** `{ available: number | null; backorderable: boolean }`
- **Cart** + **CartItem** — neutral cart shape with totals breakdown.
- **Checkout** — handoff payload + URL.
- **Order** + **OrderLine** + **OrderStatus**.
- **Quote** + **QuoteLine** + **QuoteStatus**.
- **Approval** — generic 3-state approval workflow record.

## Commerce adapter contract

A single `CommerceAdapter` exposes 12 service interfaces:

```
CommerceAdapter
  ├── auth:        AuthService
  ├── customer:    CustomerService
  ├── company:     CompanyService
  ├── catalog:     CatalogService
  ├── cart:        CartService
  ├── checkout:    CheckoutService
  ├── order:       OrderService
  ├── quote:       QuoteService
  ├── address:     AddressService
  ├── role:        UserRoleService
  ├── pricing:     PricingService
  └── inventory:   InventoryService
```

Each method accepts a `BuyerContext` and returns domain models (or `Page<T>`
for paginated lists). See `src/commerce/interfaces/*.ts` for the canonical
signatures.

## Auth / session flow

```
LoginPage
  └─ useLogin().login(email, password)
       └─ adapter.auth.login()       → AuthSession { token, buyer }
            └─ authStore.setSession(session)
                 └─ adapter.company.getActiveCompany(context)
                      └─ buyerContextStore.setContext(buyerContext)
ProtectedRoute
  └─ authStore.isAuthenticated && buyerContextStore.hasContext
       ? <Outlet />
       : <Navigate to="/login" />
```

- `AuthSession` is the **only** thing persisted in localStorage.
- All other server state lives in React Query and refetches on mount.
- The adapter is responsible for token refresh (interface: `auth.refresh()`).

## Cart / order / quote flow

```
QuickOrderPage
  └─ useAddToCart().mutate({ sku, quantity })
       └─ adapter.cart.addItem(ctx, { sku, quantity })
            ├─ Mock adapter:    in-memory cart
            └─ BC adapter:      POST /api/storefront/carts/{id}/items
       └─ queryClient.invalidateQueries(['cart'])

CheckoutPage
  └─ useCheckout().beginCheckout()
       └─ adapter.checkout.create(ctx, cartId)  → { url, payload? }
            └─ window.location.assign(url)  (or in-app handoff)

QuoteDraftPage
  └─ useSubmitQuote().mutate(draft)
       └─ adapter.quote.submit(ctx, draft)   → Quote
       └─ queryClient.invalidateQueries(['quote', 'list'])
```

Mutations are co-located with queries; React Query owns invalidation.

## Company / role / permission flow

```
After login:
  adapter.company.getActiveCompany(ctx)
    → Company + Role[] + Permissions resolved into `BuyerContext`

Permission checks:
  PermissionPolicy.can(buyerContext, 'orders.view')

UI:
  <Can permission="orders.view">
    <Link to="/orders">Orders</Link>
  </Can>

Route guards:
  <Route element={<RequirePermission perm="company.manage" />}>
    <Route path="/users" element={<UserManagementPage />} />
  </Route>
```

Permission strings are domain-defined (see `domain/models/permission.ts`).
Adapters map their native role/permission strings into this set.

## Configuration strategy

Top-level env (`VITE_*`):
- `VITE_COMMERCE_PLATFORM`: `mock` | `bigcommerce` | string for future adapters.
- `VITE_API_BASE_URL`: default backend base URL (consumed by adapters that
  need it).
- `VITE_AUTH_PROVIDER`: `commerce` (default) | `external-jwt` | future.
- `VITE_DEFAULT_LOCALE`, `VITE_DEFAULT_CURRENCY`.
- Feature flags: `VITE_ENABLE_QUOTES`, `VITE_ENABLE_APPROVALS`,
  `VITE_ENABLE_COMPANY_MANAGEMENT`, `VITE_ENABLE_SHOPPING_LISTS`,
  `VITE_ENABLE_INVOICES`.

Adapter-specific env (BC only):
- `VITE_BC_STORE_HASH`, `VITE_BC_CHANNEL_ID`, `VITE_BC_B2B_API_URL`,
  `VITE_BC_B2B_APP_CLIENT_ID`, `VITE_BC_STOREFRONT_URL`.

These live in `commerce/adapters/bigcommerce/config.ts` and are not read from
anywhere else.

## Data fetching

- **React Query** owns *all* remote data. Query keys live in
  `state/queries/queryKeys.ts`.
- **Zustand** owns small client state: `authStore`, `buyerContextStore`,
  `uiPreferencesStore`.
- Mutations call adapter services and invalidate the affected keys. No raw
  fetch in feature code.
- Standard error mapping in `api/errors/ApiError.ts`; the UI renders
  `<ErrorState />` consistently.

## Testing strategy

- **Unit**: mappers, policies, domain services — pure functions, fast.
- **Contract**: every adapter (mock + BigCommerce) runs the same interface
  contract tests (`src/commerce/__tests__/adapterContract.ts`).
- **Integration**: mock adapter drives feature tests in `features/**/__tests__`
  using Testing Library; routing and providers are wired up.
- **MSW**: stubs the BigCommerce adapter's HTTP layer for adapter-specific
  tests without a live BC store.
