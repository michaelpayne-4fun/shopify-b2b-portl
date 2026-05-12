# Writing a Commerce Adapter

This portal is platform-agnostic. To plug in a new commerce backend (Shopify,
Adobe Commerce, a custom API, an ERP-backed catalog, etc.), implement the
`CommerceAdapter` contract.

## Steps

1. **Create the adapter folder.**
   ```
   src/commerce/adapters/<your-platform>/
     index.ts
     config.ts          // env parsing for this adapter only
     client/...         // HTTP / SDK clients used by your services
     mappers/...        // platform-shape → domain-model translators
     services/
       <Platform>AuthService.ts
       <Platform>CustomerService.ts
       <Platform>CompanyService.ts
       <Platform>CatalogService.ts
       <Platform>CartService.ts
       <Platform>CheckoutService.ts
       <Platform>OrderService.ts
       <Platform>QuoteService.ts
       <Platform>AddressService.ts
       <Platform>UserRoleService.ts
       <Platform>PricingService.ts
       <Platform>InventoryService.ts
   ```

2. **Implement each interface** from `src/commerce/interfaces/`. Every method
   must accept a `BuyerContext` (or `null` for unauth methods like `login`)
   and return domain models defined in `src/domain/models/`.

3. **Map permissions.** Translate your backend's permission strings into the
   domain `Permission` union (`src/domain/models/permission.ts`). Anything
   that doesn't map should be omitted; do not invent new domain permissions
   in adapter code.

4. **Register the adapter** in `src/commerce/adapters/registry.ts`:
   ```ts
   if (platform === 'your-platform') {
     return createYourPlatformAdapter(yourConfig);
   }
   ```

5. **Document env vars** in `docs/ENVIRONMENT.md` under a new heading.

6. **Add contract tests.** The shared contract suite in
   `src/commerce/__tests__/adapterContract.ts` exercises the public surface
   against a live adapter. Add a test file that imports it and points it at
   your adapter (the mock adapter is the reference).

## Rules

- The adapter is the **only** place platform SDKs, URLs, hostnames, IDs,
  cookies, headers, and response shapes may appear.
- The adapter **must not** import from `src/features/*`, `src/ui/*`, or
  `src/state/*`. It may import from `src/domain/*`, `src/commerce/interfaces`,
  and `src/api/*`.
- The adapter **must not** assume the app runs inside a hosted storefront. If
  your platform needs a host-page bridge (cookies, hand-off URLs), encapsulate
  it in a `storefrontHost.ts` module local to the adapter.
- Mutations must return the updated domain model (or `void` when the contract
  says so) — feature code uses the return value to update React Query caches.

## Optional capabilities

If your platform does not support a feature (e.g. quotes), throw
`new NotSupportedError('quotes')` from the relevant service method and
disable the feature flag (`VITE_ENABLE_QUOTES=false`). The UI will hide the
feature without compiling out its code path.
