# Overnight QA + Fix Run — 2026-05-13

Autonomous QA pass against `https://shopb2bapp-b2b-portal.fly.dev`.
All fixes and features shipped to `claude/shopify-b2b-portal` and deployed via GitHub Actions.

---

## Bug Fixes

### F-001 · Orders list blank for `scope=mine` — **FIXED** `d998d42`
**Severity:** Blocker  
**Root cause:** `MINE_ORDERS_QUERY` used Admin API field names (`totalPriceSet`, `subtotalPriceSet`, `originalUnitPriceSet`) in a Customer Account API call. CAA uses flat `totalPrice`/`subtotalPrice` without the `Set` wrapper. The query was silently returning nulls.  
**Fix:** Added `CaaOrderNode` / `CaaLineItem` interfaces, `CAA_ORDER_FIELDS` GraphQL fragment, and `normalizeCaaOrder()` normalizer that converts CAA shape → `ShopifyOrderNode`. Added `ADMIN_ORDER_FIELDS` for Admin API fallback. Both `/orders/:id` and `/orders/:id/reorder` use CAA-first with Admin fallback.  
**Tag:** `fix-2-orders-caa-schema`

---

### F-002 · Cart create fails with `BUYER_IDENTITY_INVALID` — **FIXED** `31bbf35`
**Severity:** Blocker  
**Root cause:** `ensureCart` sent `companyLocationId` in `buyerIdentity` without the required `customerAccessToken`. Shopify Storefront API requires both fields together when `companyLocationId` is set.  
**Fix:** Added `customerAccessToken: buyerAccessToken` to the `buyerIdentity` object. Also extracted `ensureCart` to `apps/server/src/portal/cart/ensureCart.ts` as a shared utility.  
**Tag:** `fix-1-cart-buyer-identity` / `feat-1-shopping-list-add-to-cart`

---

### F-003 · Users route 500s — `/admin/role-grants` page unusable — **FIXED** `71f6eee`
**Severity:** Major  
**Root cause:** `COMPANY_CONTACTS_QUERY` fetches `customer { firstName lastName email }` which requires the `read_customers` Admin API scope. The app's scope grant does not include it. The route threw a 500, cascading to RoleGrantsPage showing a full error screen.  
**Fix (server):** Wrapped the Admin query in try/catch; ACCESS_DENIED errors return an empty list + `X-Warning` header instead of 500.  
**Fix (portal):** `RoleGrantsPage` and `UserManagementPage` show an inline `Alert` warning instead of crashing. Role grants (DB-backed) remain functional.  
**Action required:** Add `read_customers` scope in Shopify Partner Dashboard and reinstall the app to fully enable user listing.  
**Tag:** `fix-4-users-scope-graceful`

---

### F-004 · Feature flags always true despite `FEATURE_X=false` in fly.toml — **FIXED** `634c6db`
**Severity:** Major  
**Root cause:** `z.coerce.boolean()` coerces any non-empty string, including the string `"false"`, to `true` (`Boolean("false") === true`). All five feature flags were permanently on.  
**Fix:** Replaced with `booleanFromEnv(defaultVal)` — a custom Zod transform that treats `"false"`, `"0"`, `"no"`, `"off"` as false.  
**Tag:** `fix-3-feature-flags-boolean`

---

### F-005 · All shopping lists created with name "New list" — **FIXED** `50cbafe`
**Severity:** Major  
**Root cause:** The "New list" button called `create.mutate()` with `useState('New list')` as the name. The actual `<input type="hidden">` was not editable; users had no way to set a custom name.  
**Fix:** Replaced hidden input with a MUI Dialog that prompts for a name before creating. Enter key submits; Create button disabled until name is non-empty.  
**Tag:** `fix-5-shopping-list-name`

---

### F-006 · Audit log displays raw Shopify GIDs — **FIXED** `ff4ff76`
**Severity:** Polish  
**Root cause:** `AuditLogPage` rendered `{e.actorId}` directly, e.g. `gid://shopify/Customer/123456789`.  
**Fix:** Added `formatGid()` helper that extracts type and ID from the GID pattern (`Customer 123456789`). Raw GID available on hover via Tooltip. `subjectId` column gets the same treatment. Action column now Title Case.  
**Tag:** `fix-6-audit-log-gid`

---

## New Features

### F-008 · Shopping list "Add all to cart" was a stub — **BUILT** `425570c`
`POST /shopping-lists/:id/add-to-cart` returned `{ cartId: 'pending-cart-id' }`. Now fully implemented: resolves SKUs to variant IDs via Storefront API, bulk-adds to cart, returns updated cart. SKUs not in catalog are skipped with `X-Warning` header.

### F-009 · Quote draft had raw SKU text fields, no product search — **BUILT** `14c1821`
`QuoteDraftPage` rebuilt with the same `QuickOrderRow` autocomplete used in Quick Order. Buyers can search by name or SKU, see thumbnails and prices, get qty validation, and see an indicative total before submitting.

### F-010 · Shopping list items had no product search or name — **BUILT** `e04cc65`
New `ProductSearch` reusable component (single-item autocomplete with avatar, price, attributes). `ShoppingListDetailPage` now uses it instead of a raw SKU field. Product names stored in DB on add so list shows real names. Server `itemSchema` updated to accept `name`.

### F-011 · User management was read-only — **BUILT** `688fd84`
`UserManagementPage` now has: invite user dialog (name, email, role picker), inline role dropdown per user, remove user with confirmation dialog. All actions use existing server endpoints (`POST /users`, `PATCH /users/:id`, `DELETE /users/:id`).

---

## Commit Map

| Tag | SHA | Description |
|-----|-----|-------------|
| `fix-1-cart-buyer-identity` | `31bbf35` | Cart buyerIdentity fix |
| `fix-2-orders-caa-schema` | `d998d42` | Orders CAA normalizer |
| `fix-3-feature-flags-boolean` | `634c6db` | booleanFromEnv transform |
| `fix-4-users-scope-graceful` | `71f6eee` | Users graceful degradation |
| `fix-5-shopping-list-name` | `50cbafe` | Shopping list name dialog |
| `fix-6-audit-log-gid` | `ff4ff76` | Audit log GID formatting |
| `feat-1-shopping-list-add-to-cart` | `425570c` | Real add-to-cart implementation |
| `feat-2-quote-draft-search` | `14c1821` | Quote draft product search |
| `feat-3-shopping-list-product-search` | `e04cc65` | Shopping list product search |
| `feat-4-user-management` | `688fd84` | User invite/role/remove |

---

## Outstanding

- **read_customers scope** (F-003): Requires Shopify Partner Dashboard → app scopes → reinstall. Cannot be done programmatically.
- **Approvals feature** (`FEATURE_APPROVALS`): Intentionally behind flag. Routes exist but return 501. Server scaffolding in place for future build-out.
- **Quote → Draft Order mirroring**: TODO comment in `quotes.ts`. Only relevant when `quoteMirrorToDraftOrder=true` in company settings.
