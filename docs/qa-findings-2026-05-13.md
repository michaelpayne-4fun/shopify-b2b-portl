# QA Findings — 2026-05-13

**Run start:** 2026-05-13 02:27 AM  
**Branch:** `claude/shopify-b2b-portal`  
**Rollback tag:** `pre-overnight-2026-05-13`  
**Tester:** Automated overnight run (Claude / Cowork)

---

## Routes Tested

| Route | Status | Notes |
|-------|--------|-------|
| `/` | ✅ OK | Dashboard loads, shows company/location |
| `/orders` | ❌ ISE 500 | CAA schema mismatch |
| `/orders/:id` | ❌ Untestable | Blocked by list failure |
| `/quotes` | ✅ OK | Empty state renders cleanly |
| `/quotes/new` | 🔲 Pending | Phase 3 flow test |
| `/quotes/:id` | 🔲 Pending | Phase 3 flow test |
| `/quick-order` | ✅ OK | Page loads, form renders |
| `/cart` | ❌ ISE 500 | Missing customerAccessToken in buyerIdentity |
| `/shopping-lists` | ⚠️ Partial | Loads but naming is broken |
| `/shopping-lists/:id` | 🔲 Pending | Phase 3 flow test |
| `/addresses` | ✅ OK | Personal tab renders; company tab lazy-loads from session |
| `/users` | ❌ ISE 500 | Admin API missing read_customers scope |
| `/company` | ✅ OK | Company + location renders |
| `/admin` | ✅ OK | Overview stats render |
| `/admin/role-grants` | ❌ ISE 500 | Cascades from /users failure |
| `/admin/quote-settings` | ⚠️ Stub | Redirect note only, no real settings |
| `/admin/shopping-list-settings` | ⚠️ Stub | Redirect note only, no real settings |
| `/admin/company-settings` | ✅ OK | Full settings form renders |
| `/admin/audit-log` | ⚠️ Partial | Loads but actor shows raw GID |
| `/admin/features` | ❌ Wrong data | All flags show "on" including disabled ones |

---

## Findings

---

### F-001 — /orders: CAA GraphQL schema mismatch
**Route:** `/orders`  
**Severity:** Blocker  
**Fault domain:** BFF / Portal

**Symptom:** "Unable to load — Internal Server Error" on Orders page.

**Console/Log excerpt:**
```
Error: CAA: Field 'totalPriceSet' doesn't exist on type 'Order';
Field 'subtotalPriceSet' doesn't exist on type 'Order';
Field 'variant' doesn't exist on type 'LineItem';
Field 'originalUnitPriceSet' doesn't exist on type 'LineItem';
Field 'originalTotalSet' doesn't exist on type 'LineItem'
  at customerAccountQuery (apps/server/src/shopify/customerAccountClient.ts:32:34)
  at async list (apps/server/src/routes/orders.ts:70:15)
```

**Root cause analysis:**
1. ✅ **Most likely: `ORDER_FIELDS` uses Admin API field names verbatim in the CAA query.** The CAA Orders API exposes `totalPrice` (not `totalPriceSet`), `subtotalPrice` (not `subtotalPriceSet`), and line items use `price`/`totalPrice` scalars not `PriceSet` objects. `variant` doesn't exist on CAA `LineItem` — it uses `merchandise { ... on ProductVariant }`. There is no try/catch around the MINE_ORDERS_QUERY in `list()` so the schema error propagates as 500.
2. CAA access token expired → would produce 401, not schema errors. Rejected.
3. Rate limiting → would produce 429. Rejected.

**Fix:** Write a separate `CAA_ORDER_FIELDS` fragment with correct CAA field names and a separate `CAA_MINE_ORDERS_QUERY`. Add a try/catch fallback in `list()` to Admin API (scope=mine via `purchasingEntity` filter) if CAA fails.

---

### F-002 — /cart: customerAccessToken missing from buyerIdentity
**Route:** `/cart`  
**Severity:** Blocker  
**Fault domain:** BFF

**Symptom:** "Unable to load — Internal Server Error" on Cart page.

**Console/Log excerpt:**
```
ValidationError [DomainError]: The customer access token is required
when setting a company location
  at ensureCart (apps/server/src/routes/cart.ts:49:11)
  code: 'VALIDATION', status: 400
```

**Root cause analysis:**
1. ✅ **Most likely: `cartCreate` mutation sets `companyLocationId` in `buyerIdentity` but omits `customerAccessToken`.** Shopify Storefront API requires both fields together when associating a cart to a company location. The `buyerAccessToken` is only passed as a header option to `storefrontQuery`, not embedded in the `buyerIdentity` input object. Line 49 of `cart.ts`.
2. CAA token expired → would fail differently upstream, not at cart creation. Rejected.
3. Missing company location GID → would produce undefined, not this specific error message. Rejected.

**Fix:** In `ensureCart`, add `customerAccessToken: buyerAccessToken` to the `buyerIdentity` object when `companyLocationId` is set.

---

### F-003 — /users: Admin API missing read_customers scope
**Route:** `/users`, `/admin/role-grants`  
**Severity:** Major (Blocker on /users, cascades to role-grants)  
**Fault domain:** Shopify config / Data

**Symptom:** "Unable to load — Internal Server Error" on Users page. Role grants page also fails.

**Console/Log excerpt:**
```
Error: Admin API: Access denied for customer field.
Required access: `read_customers` access scope.
  at adminQuery (apps/server/src/shopify/adminClient.ts:23:34)
  at async (apps/server/src/routes/users.ts:62:16)
```

**Root cause analysis:**
1. ✅ **Most likely: The Shopify custom app is missing `read_customers` in its Admin API access scopes.** The `COMPANY_CONTACTS_QUERY` queries `company.contacts[].customer { id firstName lastName email }` which requires the `read_customers` scope. The `getAdminToken()` client-credentials flow correctly fetches a token, but that token is limited to the scopes granted to the app.
2. Wrong company GID in auth → would return null company, not an access denied error. Rejected.
3. Network issue → would produce a network error, not an API authorization error. Rejected.

**Fix (data):** In Shopify Admin → Apps → your B2B Portal app → Configuration → Admin API scopes, add `read_customers`. The admin token refresh is automatic via `adminToken.ts` so no code change needed after scope update. Also add `write_customers` if invite functionality is needed.

**Secondary effect:** `/admin/role-grants` page calls both `/users` and `/admin/role-grants` API in parallel. The users failure causes the page to show `<ErrorState>`. The role-grants API itself (DB query only) is fine — fixing F-003 unblocks role-grants automatically.

---

### F-004 — Feature flags: z.coerce.boolean() coerces "false" string to true
**Route:** `/admin/features`, affects all feature-gated UI  
**Severity:** Major  
**Fault domain:** BFF / Config

**Symptom:** All feature flags show "on" in `/admin/features` including `approvals`, `invoices`, and `multiTierHierarchy` which are set to `"false"` in `fly.toml` and should be off.

**Evidence:**
- `fly.toml` correctly sets `FEATURE_APPROVALS = "false"`, `FEATURE_INVOICES = "false"`, `FEATURE_MULTI_TIER_HIERARCHY = "false"`
- `apps/server/src/env.ts` uses `z.coerce.boolean()` for all feature flags
- `z.coerce.boolean()` calls JS `Boolean()` — `Boolean("false") === true` because "false" is a non-empty string

**Root cause analysis:**
1. ✅ **Most likely: Zod's `z.coerce.boolean()` does not handle the string `"false"` as false.** It coerces any non-empty string to `true`. This is a well-known Zod gotcha. The three "off" features are running as enabled, which means `ApprovalsPage`, invoice UI, and multi-tier hierarchy UI are all active in the frontend.
2. fly.toml values overriding fly secrets → fly secrets take precedence, but env vars in [env] section are applied. No secrets override present. Rejected as primary cause (coercion is the issue regardless).
3. Server not picking up fly.toml → Server is clearly reading the env (other flags like quotes=true work correctly). Rejected.

**Fix:** Replace `z.coerce.boolean()` in `env.ts` with a transform that handles string values correctly:
```ts
z.string().transform(v => v === 'true' || v === '1').pipe(z.boolean()).default(false)
```
Or a simpler custom helper applied to all 5 flags.

---

### F-005 — Shopping lists: no name input, all lists created as "New list"
**Route:** `/shopping-lists`  
**Severity:** Minor  
**Fault domain:** Portal

**Symptom:** "New list" button creates a list immediately with hardcoded name "New list". There is no way for users to type a name before creation. Every list will be called "New list".

**Evidence:**
- `ShoppingListsPage.tsx` has `const [name, setName] = useState('New list')`
- The create button calls `createShoppingList({ name })` directly — no dialog
- The name input is `<input type="hidden" value={name} onChange={...} />` — inaccessible

**Plausible causes:**
1. ✅ **Most likely: Intentional v1 stub left incomplete** — comment in code says "kept simple in v1" but the result is non-functional UX
2. Regression during refactor → no evidence of prior name dialog in git history
3. Dialog removed for mobile simplicity → no responsive considerations visible. Rejected.

**Fix:** Add an inline rename dialog (MUI `Dialog` + `TextField`) or an inline editable name on the card, triggered when clicking "New list".

---

### F-006 — Audit log: actor column shows raw Shopify GID
**Route:** `/admin/audit-log`  
**Severity:** Polish  
**Fault domain:** Portal

**Symptom:** Actor column shows `gid://shopify/Customer/23802887864683` instead of a human name.

**Evidence:** `AuditLogPage.tsx` renders `{e.actorId}` directly — no name resolution.

**Fix:** Cross-reference `actorId` with the users list already loaded on that page (or pass actor name at write time in `withAudit()`).

---

### F-007 — Admin nav: quote-settings and shopping-list-settings are dead-end stubs
**Route:** `/admin/quote-settings`, `/admin/shopping-list-settings`  
**Severity:** Polish  
**Fault domain:** Portal

**Symptom:** Both pages render only a sentence saying "options are configured under Company settings." They are listed in the nav but do nothing.

**Fix:** Either remove from nav and redirect to `/admin/company-settings`, or build the actual settings inline on these pages (extracting the relevant sections from CompanySettingsPage).

---

## End-to-End Flow Status

| Flow | Status |
|------|--------|
| Quick Order: type SKU | 🔲 Pending |
| Quick Order: paste 5 SKUs | 🔲 Pending |
| Quick Order: upload CSV | 🔲 Pending |
| Quick Order: add to cart | ❌ Blocked (F-002) |
| Cart: open / change qty / remove | ❌ Blocked (F-002) |
| Cart: checkout (abort) | ❌ Blocked (F-002) |
| Orders: list | ❌ Blocked (F-001) |
| Orders: detail | ❌ Blocked (F-001) |
| Orders: reorder | ❌ Blocked (F-001, F-002) |
| Quotes: create draft | 🔲 Pending |
| Quotes: save + reload | 🔲 Pending |
| Shopping lists: create | ⚠️ Works but name is broken (F-005) |
| Shopping lists: add items | 🔲 Pending |
| Addresses: personal | ✅ Working |
| Addresses: company | ✅ Working (lazy tab) |
| Users: list | ❌ Blocked (F-003) |
| Admin: all sub-pages | ⚠️ Partial (see per-finding) |

