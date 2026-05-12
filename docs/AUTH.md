# Authentication: Customer Account API OAuth/PKCE

The portal never accepts a password. All sign-in flows go through
Shopify Customer Account API (CAA) using authorization-code + PKCE.

## Flow

```
1. LoginPage          POST /auth/login                BFF
                                                        - generates state + PKCE pair
                                                        - persists in oauth_states
                                                        - returns authorizeUrl
2. Browser            window.location.assign(authorizeUrl)
                      302 to https://shopify.com/authentication/<shop>/oauth/authorize
3. Shopify-hosted     buyer signs in
                      302 to /auth/callback?code&state
4. AuthCallbackPage   POST /auth/callback             BFF
                                                        - validates state, deletes oauth_states row
                                                        - exchanges code for CAA access + refresh tokens
                                                        - fetches customer + company via CAA
                                                        - bootstraps portal_admin if first Location admin
                                                        - inserts company_settings if missing
                                                        - inserts sessions row
                                                        - Set-Cookie b2b_session=<signed JWT>
5. SPA                React Query invalidates /auth/me
                                                        - hydrates BuyerContext
                                                        - router lets the user in
```

## Session cookie

`apps/server/src/auth/session.ts`:
- Signs a JOSE HS256 JWT containing only `sid` (the `sessions` row id).
- 8-hour TTL.
- HTTP-only, SameSite=Lax. Bound to the BFF origin.

## CAA tokens

- Live in the `sessions` row, never in the browser.
- `caa_expires_at` is tracked; `refreshAccessToken()` rotates them
  transparently. (TODO in v1: auto-refresh on the next request when
  expiry is imminent.)

## Logout

- `POST /auth/logout` clears the cookie. (TODO in v1: also delete the
  `sessions` row server-side.)

## Permission resolution

`resolveAuthContext()`:
1. Reads the `sessions` row from the cookie.
2. Calls CAA `customer` and `customer.companyContactProfiles`.
3. Maps the Shopify role name to a base `Permission[]` via
   `permissionMapper`.
4. Loads portal `role_assignments` and merges the two sets.
5. Returns a `BuyerContext` to the route handler.

## Why no password flow

CAA is the official path. A BFF-mediated Multipass flow (Plus-only)
would re-introduce password storage in the portal's UX and shift the
attack surface; we opted out in v1.

## Required scopes

Configure your CAA app with at least:
- `openid`
- `email`
- `customer-account-api:full`

Adjust per the current Shopify documentation; the values above are the
v1 baseline. Document the exact scope strings in `docs/SHOPIFY.md`
after verifying against the deployed API version.
