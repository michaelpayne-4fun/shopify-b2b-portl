# Functional Gap Analysis: BigCommerce B2B Edition vs Shopify Plus B2B

This is the v1 disposition per capability. Legend:
- **S** sourced from Shopify
- **A** adapter composition (Shopify primitives + BFF logic)
- **P** portal-owned (BFF + Postgres)
- **F** feature-flagged OFF in v1

| Capability | BC B2B Edition | Shopify Plus B2B | v1 |
|---|---|---|---|
| Sign-in | Email/password | Customer Account API OAuth/PKCE | **S** |
| Buyer profile | B2B customer | CAA `customer` query | **S** |
| Company + locations | B2B first-class | Admin `company`/`companyLocation` | **S** via BFF |
| Multi-tier company hierarchy | Yes | None | **F** |
| Roles | 24+ permission strings | Coarse role names + portal grants | **S + P** |
| Users / contacts | B2B users | Admin `CompanyContact` | **S** via BFF |
| User invite | B2B invite | `companyContactCreate` | **S** via BFF |
| Catalog browse | Storefront search | Storefront `products(query)` | **S** via BFF |
| Quick Order (SKU) | Storefront filter | `products(query: "sku:X")` | **S** via BFF |
| Cart CRUD | Storefront cart | Storefront `cart*` w/ `buyerIdentity.companyLocationId` | **S** via BFF |
| Buyer-specific pricing | Contract prices | B2B Catalog (auto-applied) | **S** |
| Inventory | Storefront | `variant.quantityAvailable` | **S** |
| Checkout | Hosted | `cart.checkoutUrl` | **S** |
| Orders — mine | B2B orders | CAA `customer.orders` | **S** via BFF |
| Orders — company | B2B orders | Admin `orders(query: "company_location_id:...")` | **S** via BFF |
| Reorder | B2B `/reorder` | None natively | **A** (lines → `cartLinesAdd`) |
| Quotes (state machine) | First-class | Draft Orders (admin-only, no buyer states) | **P** |
| Approval workflows | First-class | None | **F** in v1 |
| Shopping lists | First-class | None | **P** |
| Personal addresses | B2B | CAA `customer.addresses` | **S** via BFF |
| Company-location addresses | B2B | Admin `companyLocation.shippingAddress` | **S** via BFF |
| Invoices / AR | B2B AR | Shopify Net Terms (limited) | **F** |
| PO number | Yes | `order.poNumber` | **S** |
| Multi-currency | Yes | Shopify Markets | **S** |

## Implications

- **Portal-owned**: quotes, shopping lists, role grants. Approvals are
  scaffolded but flag-off until a future release.
- **All Shopify writes go through the BFF.** The browser only holds a
  signed session cookie; CAA and Admin tokens stay server-side.
- **Admin UI** is first-class. Anything stored in the portal DB that
  changes buyer-facing behavior is editable from `/admin/...` pages,
  gated by `portal.admin`.

## Quote state machine (v1)

```
draft --submit--> approved (auto)  --convertToCart--> ordered
          \                            \
           \                            -> expired
            -> expired
```

When `FEATURE_APPROVALS=true` (future), `submit` advances to
`submitted` and an approval row mediates the transition to `approved`.
The state machine in `packages/domain/src/policies/quoteStateMachine.ts`
already supports both modes.
