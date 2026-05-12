# Phased Rewrite Plan

## Phase 1 — Repo audit and dependency map

**Objectives.** Establish a shared understanding of the upstream app, its
coupling points, and the rewrite contract.

**Tasks.**
- Catalogue the upstream monorepo, packages, pages, and `shared/service/*`
  modules.
- Produce `docs/ASSESSMENT.md` and `docs/MIGRATION.md` (the migration map).
- Classify every BC coupling point as Must / Replace / Drop / Adapter-only.

**Files / modules.** `docs/ASSESSMENT.md`, `docs/MIGRATION.md`.

**Acceptance criteria.** A reviewer can read the assessment and predict where
any upstream module will land in the rewrite.

**Risks.** Upstream behavior in undocumented edges (e.g. Stencil cookie sync)
is inferred. Mitigation: capture as `TODO` in the BC adapter so reality can
be filled in later without touching feature code.

## Phase 2 — Domain models and adapter contracts

**Objectives.** Lock the platform-neutral shape of the application.

**Tasks.**
- Implement `src/domain/models/*` (Buyer, Company, Role, Product, Cart,
  Order, Quote, Address, Approval, Money, Pagination, etc.).
- Implement `src/commerce/interfaces/*` (12 service interfaces + the
  `CommerceAdapter` aggregator).
- Add `PermissionPolicy` and route-guard primitives.

**Acceptance criteria.** Interfaces and models compile in isolation. Tests
for `PermissionPolicy` pass.

**Risks.** Over-modeling. Mitigation: model only what feature code needs
today; extend in subsequent phases.

## Phase 3 — UI shell and routing

**Objectives.** Get the app to render with a layout, navigation, theme, and
protected routing — but with no real data yet.

**Tasks.**
- `AppProviders`, `ThemeProvider`, `QueryProvider`, `I18nProvider`.
- `PortalLayout`, `AuthLayout`, `AppHeader`, `AppSidebar`.
- Route table with placeholders; `ProtectedRoute`, `RequirePermission`.
- Reusable `EmptyState`, `ErrorState`, `LoadingState`, `DataTable`,
  `PageHeader`, `Money`, `Can`.

**Acceptance criteria.** `yarn dev` boots; navigating between routes works;
unauth users are bounced to `/login`.

## Phase 4 — Auth and buyer context

**Objectives.** Real login, session, and company context.

**Tasks.**
- `authStore` (Zustand, persisted to `localStorage`).
- `buyerContextStore` (Zustand, in-memory, hydrated from `company.getActiveCompany`).
- `CommerceProvider` injects the configured adapter.
- `useLogin`, `useLogout`, `useBuyerContext` hooks.

**Acceptance criteria.** Login works against the mock adapter; refresh keeps
the session; `BuyerContext` is available everywhere.

## Phase 5 — Feature implementations

**Objectives.** Wire pages to domain hooks.

**Tasks.**
- `account` (dashboard, account settings)
- `company` (hierarchy + locations)
- `users` (list / invite / role assign)
- `addresses` (CRUD)
- `catalog` (quick order by SKU)
- `cart` (view, mutate)
- `orders` (list, detail)
- `quotes` (list, draft, detail, submit)
- `shopping-lists` (gated by `ENABLE_SHOPPING_LISTS`)
- `invoices` (gated by `ENABLE_INVOICES`)

**Acceptance criteria.** Each feature renders against the mock adapter and
honors permissions.

## Phase 6 — BigCommerce adapter

**Objectives.** Provide a reference adapter that maps the BC B2B Edition and
Storefront APIs into the contract.

**Tasks.**
- `commerce/adapters/bigcommerce/config.ts` reads BC-specific env.
- `client/b2bClient.ts` (B2B Edition GraphQL/REST) and
  `client/storefrontClient.ts` (Storefront REST).
- One service implementation per interface.
- `mappers/*` translate BC responses into domain models (one mapper per
  resource).
- Token storage / refresh + (optional) Stencil cookie sync isolated here.

**Acceptance criteria.** Setting `VITE_COMMERCE_PLATFORM=bigcommerce` and
filling BC env vars routes all calls through the BC adapter without any
feature-code change.

**Risks.** B2B Edition API surface is large and partly closed. Mitigation:
ship a contract that is complete and ship adapter methods that cover the
flows in the upstream app — anything beyond is a `TODO` in the adapter only.

## Phase 7 — Mock adapter and test harness

**Objectives.** Make the app runnable and testable without BigCommerce.

**Tasks.**
- `commerce/adapters/mock/*` with deterministic seeded data.
- Adapter contract test runs against both mock and (with MSW) BC.
- MSW handlers for BC HTTP calls.

**Acceptance criteria.** `VITE_COMMERCE_PLATFORM=mock yarn dev` boots a
fully usable portal. Contract tests pass for the mock adapter.

## Phase 8 — QA, regression, documentation

**Objectives.** Ensure quality, ship the docs.

**Tasks.**
- Lint / typecheck / test in CI.
- Manual exercise of every flow against the mock adapter.
- Finalize `README.md`, `docs/ENVIRONMENT.md`, `docs/ADAPTERS.md`.

**Acceptance criteria.** Documentation explains how to run the app, write a
new adapter, and what changed from the upstream repo.
