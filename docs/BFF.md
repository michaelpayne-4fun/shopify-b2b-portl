# BFF REST Surface

Base URL: `${VITE_BFF_URL}` (default `http://localhost:8787`).

All routes except `/auth/login`, `/auth/callback`, `/auth/logout`, and
`/healthz` require an authenticated session cookie. All admin routes
additionally require `portal.admin`. All approval routes additionally
require `FEATURE_APPROVALS=true` on the BFF.

## Auth

```
POST   /auth/login                              -> { authorizeUrl }
POST   /auth/callback     { code, state }       -> { sessionId }
POST   /auth/logout                             -> 204
GET    /auth/me                                 -> { buyer, company, activeLocationId } | 401
```

## Company

```
GET    /me/company                              -> Company
POST   /me/company/switch-location  { locationId } -> { activeLocationId }
```

## Catalog

```
GET    /catalog/search   ?q=&pageSize=          -> Page<Product>
GET    /catalog/sku/:sku                        -> Product | 404
```

## Cart & checkout

```
GET    /cart                                    -> Cart
POST   /cart/items       { sku?, variantId?, quantity } -> Cart
PATCH  /cart/items/:id   { quantity }           -> Cart
DELETE /cart/items/:id                          -> Cart
DELETE /cart                                    -> 204
POST   /cart/checkout                           -> { url }
```

## Orders

```
GET    /orders     ?scope=mine|company&status=&search=  -> Page<Order>
GET    /orders/:id                              -> Order
POST   /orders/:id/reorder                      -> { cartId }     (TODO in v1)
```

## Quotes (portal-owned)

```
GET    /quotes     ?status=                     -> Page<Quote>
GET    /quotes/:id                              -> Quote
POST   /quotes               QuoteDraftInput    -> Quote   (draft)
PATCH  /quotes/:id           QuoteDraftInput    -> Quote
DELETE /quotes/:id                              -> 204
POST   /quotes/:id/submit                       -> Quote   (auto-approves v1)
POST   /quotes/:id/convert-to-cart              -> { cartId }
```

## Shopping lists (portal-owned)

```
GET    /shopping-lists                          -> Page<ShoppingList>
GET    /shopping-lists/:id                      -> ShoppingList
POST   /shopping-lists                          -> ShoppingList
PATCH  /shopping-lists/:id                      -> ShoppingList
DELETE /shopping-lists/:id                      -> 204
POST   /shopping-lists/:id/items   { sku, quantity }  -> ShoppingList
DELETE /shopping-lists/:id/items/:itemId        -> ShoppingList
POST   /shopping-lists/:id/add-to-cart          -> { cartId }
```

## Approvals (FEATURE_APPROVALS gated)

```
GET    /approvals    ?state=                    -> Page<Approval>
GET    /approvals/:id                           -> Approval
POST   /approvals/:id/decide  { decision, notes? } -> Approval
```

## Addresses

```
GET    /addresses    ?scope=personal|company    -> Page<Address>
POST   /addresses                               -> Address  (TODO in v1)
PATCH  /addresses/:id                           -> Address  (TODO in v1)
DELETE /addresses/:id                           -> 204      (TODO in v1)
```

## Users & roles

```
GET    /users                                   -> Page<Buyer>
POST   /users        InviteUserInput            -> Buyer
PATCH  /users/:id    { roleId }                 -> 204
DELETE /users/:id                               -> 204
GET    /roles                                   -> Role[]
```

## Admin (requires `portal.admin`)

```
GET    /admin/overview                          -> { draftQuotes, activeLists, usersCount, pendingApprovals }
GET    /admin/company-settings                  -> CompanySettings
PATCH  /admin/company-settings                  -> CompanySettings (audited)
GET    /admin/role-grants                       -> Array<{ userId, grants }>
PUT    /admin/role-grants/:userId  { grants }   -> { userId, grants } (audited)
GET    /admin/audit-log                         -> Page<AuditEntry>
GET    /admin/features                          -> FeatureFlags
GET    /admin/approval-rules                    -> ApprovalRule[]   (FEATURE_APPROVALS gated)
POST   /admin/approval-rules                    -> ApprovalRule     (FEATURE_APPROVALS gated, 501 v1)
PATCH  /admin/approval-rules/:id                -> ApprovalRule     (FEATURE_APPROVALS gated, 501 v1)
DELETE /admin/approval-rules/:id                -> 204              (FEATURE_APPROVALS gated, 501 v1)
```

## Error shape

```
{ "error": "VALIDATION", "message": "..." }
```

Status codes: 400 (validation), 401 (auth), 403 (permission), 404
(not found / feature off), 409 (conflict), 500 (unexpected).
