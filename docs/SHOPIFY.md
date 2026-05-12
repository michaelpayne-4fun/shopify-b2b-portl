# Shopify Plus B2B configuration

This portal is a Shopify **custom app** (single merchant). Tokens are
provisioned via **Shopify Admin → Apps → "Develop apps"** and via the
**Headless storefronts** channel — not via Shopify Partners. Do not
create a Partners app for this portal; see `docs/CUSTOM_APP.md` for
the full custom-vs-public-app contrast.

This portal expects:
- A Shopify Plus store with **B2B enabled**.
- At least one B2B Company with one Location and one Contact.
- A **Storefront API access token** with B2B catalog access (from a
  custom app).
- An **Admin API access token** with the scopes listed below (same
  custom app).
- A **Customer Account API app** configured with the redirect URI
  `${PUBLIC_PORTAL_URL}/auth/callback` (separate from the custom app;
  configured under Settings → Customer accounts → Headless storefronts).

## Storefront API (custom app)

Issued from the **custom app** you create under Apps → Develop apps,
on the **Storefront API integration** tab.

Required for: product search, cart CRUD, checkout URL.

Scopes:
- `unauthenticated_read_product_listings`
- `unauthenticated_read_product_inventory`
- `unauthenticated_write_checkouts`
- `unauthenticated_read_customers`
- (B2B specific buyer-identity scopes per current docs)

## Customer Account API (Headless channel)

Configured under **Settings → Customer accounts → Headless storefronts**.
This is the **Headless channel** OAuth client — it's the storefront-side
configuration, separate from (and in addition to) the custom app you
created for Storefront/Admin tokens. The buyer authenticates against
this client; the merchant does not install it the same way.

Required for: sign-in, customer profile, customer addresses, company
contact profiles, `customer.orders`.

Scopes:
- `openid`
- `email`
- `customer-account-api:full`

Redirect URI must match `SHOPIFY_CAA_REDIRECT_URI` exactly.

## Admin API (custom app)

Same custom app as the Storefront token, on the **Admin API
integration** tab.

Required for: company-scoped order queries, company contacts, role
assignment writes, optional Draft Order mirror.

Scopes (minimum):
- `read_companies`, `write_companies`
- `read_company_locations`
- `read_company_contacts`, `write_company_contacts`
- `read_orders` (and `read_all_orders` if your store predates the
  recent order scope split)
- `read_draft_orders`, `write_draft_orders` (for the optional Draft
  Order mirror when `quoteMirrorToDraftOrder=true`)

## Markets / currencies

The portal reads the cart's `currencyCode` for display; multi-currency
behavior is whatever Shopify Markets returns. No explicit Markets
configuration is required beyond standard B2B catalog setup.

## API versions

Pinned in env: `SHOPIFY_STOREFRONT_API_VERSION`,
`SHOPIFY_ADMIN_API_VERSION`. Both default to `2024-10`. Update both
when bumping; queries in `apps/server/src/shopify/queries.ts` may need
to follow.
