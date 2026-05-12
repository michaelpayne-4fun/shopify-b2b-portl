# Migration Map: upstream → rewrite

Format: `Original` → `New` — _Disposition / Notes_.

Dispositions: **Preserved** (lifted with light edits), **Rewritten** (new
implementation, same intent), **Moved** (relocated), **Removed**,
**Abstracted** (moved behind an interface).

## Top-level

| Original | New | Notes |
| --- | --- | --- |
| Turborepo monorepo (`apps/`, `packages/`) | Single Vite workspace with internal layering | Rewritten. The architecture is package-ready; nothing imports across feature boundaries. |
| `apps/storefront/.env-example` | `.env.example` + `.env.mock` | Rewritten. New variables driven by the adapter selector. |
| `apps/storefront/headless.ts`, `HeadlessController/` | `commerce/adapters/bigcommerce/storefrontHost.ts` (skeleton) | Abstracted. The portal no longer reaches into a host storefront from feature code. |
| `packages/ui` | `src/ui/components/*` | Moved. Same idea (reusable MUI components), now in-app. |
| `packages/store` (Redux slices) | `src/state/stores/*` (Zustand) + React Query | Rewritten. Server state moved to React Query; client state slimmed to auth + buyer context. |
| `packages/b3global` (`window.b3` globals) | Removed | Removed. Replaced by explicit DI of the adapter via `CommerceProvider`. |
| `packages/tsconfig`, `packages/eslint-config-b3` | `tsconfig.json`, `.eslintrc.cjs` | Preserved as inline config. |

## `apps/storefront/src` modules

| Original | New | Disposition |
| --- | --- | --- |
| `App.tsx`, `main.ts`, `theme.tsx` | `src/app/App.tsx`, `src/app/main.tsx`, `src/ui/theme.ts` | Rewritten. |
| `shared/service/b2b/*` | `src/commerce/adapters/bigcommerce/services/*` + `client/b2bClient.ts` | Abstracted. Now hidden behind `CommerceAdapter` interfaces. |
| `shared/service/bc/*` | `src/commerce/adapters/bigcommerce/services/*` (cart/checkout/customer) | Abstracted. |
| `shared/service/request/*` | `src/api/clients/http.ts` | Rewritten. |
| `store/` (Redux slices) | Split: `state/stores/authStore.ts`, `state/stores/buyerContextStore.ts`, `state/queries/*` | Rewritten. |
| `hooks/` | `src/features/*/hooks/*` and `src/ui/*` | Moved + rewritten. Hooks now live alongside the feature they serve. |
| `lib/`, `utils/` | `src/utils/*` | Preserved (selectively); BC-flavored helpers moved into the BC adapter. |
| `types/` | `src/domain/models/*` | Rewritten as platform-neutral domain models. |
| `constants/` | `src/app/config/*` and feature-local `*.ts` | Rewritten. No BC URLs or IDs live outside the BC adapter. |

## Pages

| Original page | New page | Notes |
| --- | --- | --- |
| `Login` | `features/auth/pages/LoginPage.tsx` | Same flow, adapter-driven. |
| `ForgotPassword` | `features/auth/pages/ForgotPasswordPage.tsx` | Same flow, adapter-driven. |
| `Registered`, `RegisteredBCToB2B` | `features/auth/pages/RegisterPage.tsx` | Merged. The "BC→B2B" promotion is a BC-adapter concern surfaced via `auth.register()`. |
| `HomePage`, `Dashboard` | `features/account/pages/DashboardPage.tsx` | Merged. |
| `MyOrders`, `CompanyOrderList` | `features/orders/pages/OrdersPage.tsx` (with a `scope` toggle) | Merged. Personal vs company scope is a parameter to `order.list(ctx, { scope })`. |
| `OrderDetail`, `order/` | `features/orders/pages/OrderDetailPage.tsx` | Preserved. |
| `QuickOrder` | `features/catalog/pages/QuickOrderPage.tsx` | Preserved. |
| `QuotesList`, `QuoteDetail`, `QuoteDraft`, `quote/` | `features/quotes/pages/*` | Preserved. |
| `AccountSetting` | `features/account/pages/AccountSettingsPage.tsx` | Preserved. |
| `UserManagement` | `features/users/pages/UserManagementPage.tsx` | Preserved. |
| `AddressList` | `features/addresses/pages/AddressListPage.tsx` | Preserved. |
| `CompanyHierarchy` | `features/company/pages/CompanyHierarchyPage.tsx` | Preserved. |
| `ShoppingLists`, `ShoppingListDetails` | `features/shopping-lists/pages/*` | Preserved (feature-flagged). |
| `Invoice`, `InvoicePayment` | `features/invoices/pages/*` | Preserved (feature-flagged). |

## Cross-cutting

| Original | New | Notes |
| --- | --- | --- |
| Raw BC permissions strings used in components | `domain/models/permission.ts` + `domain/policies/PermissionPolicy.ts` + `<Can />` | Abstracted. Adapters now map their permission strings into a fixed domain set. |
| Stencil cookie sync | `commerce/adapters/bigcommerce/services/BigCommerceAuthService.ts` | Adapter-only. |
| `react-intl` message catalog | `src/i18n/locales/en.ts` (lean dictionary) + `useMessage()` | Rewritten. The full ICU message setup is left as an extension point; not required for parity. |
| reCAPTCHA on register | `domain/services/CaptchaProvider` (optional) | Abstracted. |
| Vite env `VITE_B2B_URL` etc. | `VITE_BC_B2B_API_URL` etc., under BC adapter | Renamed and scoped. |
