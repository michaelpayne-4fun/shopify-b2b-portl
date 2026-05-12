# Shopify B2B Buyer Portal

A native Shopify Plus B2B buyer portal, derivative of the BigCommerce
B2B buyer portal but built specifically for Shopify. Features that
Shopify doesn't supply natively (advanced quotes, shopping lists,
portal-augmented role grants, future approvals workflows) are owned by
this app's BFF + Postgres database. Features Shopify does supply
(companies, locations, catalog, cart, checkout, orders) are sourced
through the Storefront / Customer Account / Admin APIs.

## Monorepo

```
apps/portal/        # SPA: Vite + React + MUI 5
apps/server/        # BFF:  Hono on Node + Drizzle + Postgres
packages/domain/    # Shared TS types + policies
packages/db/        # Drizzle schema + migrations
docker-compose.yml  # Local Postgres
docs/               # Architecture, BFF surface, Shopify scopes, etc.
```

## Run it locally

Prereqs: Node ≥ 20, Yarn 1.x, Docker.

```bash
yarn install
cp .env.example apps/portal/.env
cp .env.example apps/server/.env
docker compose up -d postgres
yarn db:migrate
yarn dev
```

The SPA boots on `http://localhost:3000` and the BFF on
`http://localhost:8787`. Sign in via "Continue with Shopify" — the
adapter redirects to Shopify Customer Account API, completes the
PKCE handshake, and bootstraps the company + permission grants.

## Documentation

- `docs/ARCHITECTURE.md` — layered design, trust boundaries, data flow
- `docs/AUTH.md` — CAA OAuth/PKCE flow, session model
- `docs/BFF.md` — REST surface consumed by the SPA
- `docs/SHOPIFY.md` — required Shopify app config and API scopes
- `docs/ADMIN.md` — the admin configuration UI and audit semantics
- `docs/DATA_MODEL.md` — Postgres schema and lifecycle
- `docs/ENVIRONMENT.md` — every env var, in one place
- `docs/GAP_ANALYSIS.md` — what we built ourselves vs source from Shopify

## Scripts

| Script | What it does |
| --- | --- |
| `yarn dev` | Boots the SPA and the BFF together |
| `yarn build` | Builds every workspace |
| `yarn typecheck` | `tsc --noEmit` across the workspace |
| `yarn lint` | ESLint on every workspace |
| `yarn test` | Vitest in every workspace |
| `yarn db:generate` | Drizzle `generate` |
| `yarn db:migrate` | Drizzle migrate against `DATABASE_URL` |
