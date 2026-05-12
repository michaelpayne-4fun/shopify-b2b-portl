# Portal Data Model

Tables live in `packages/db/src/schema/`. All identifiers that point to
Shopify entities (customers, companies, locations) are stored as
opaque GIDs.

## Tables

### sessions
Active server-side sessions. The browser only holds a signed cookie
carrying `sessions.id`. Shopify access/refresh tokens live here.

### oauth_states
Transient state for in-flight OAuth/PKCE flows. Inserted on
`/auth/login`, deleted on `/auth/callback`.

### buyers
Shadow row keyed by Shopify customer id. Lets `role_assignments` and
portal-owned records foreign-reference a stable buyer identifier.

### role_assignments
Portal-DB permission grants per buyer. Composite primary key on
(`buyer_id`, `permission`). Source of truth for `portal.admin`,
`approvals.act`, `shoppingLists.manage`, `quotes.*`. Merged with the
Shopify-derived role in `apps/server/src/auth/permissions.ts`.

### quotes / quote_lines
Portal-owned quote state machine. `status` is one of `draft`,
`submitted`, `approved`, `rejected`, `expired`, `ordered`. When the
quote is mirrored to a Shopify Draft Order, the GID lives in
`shopify_draft_order_gid`.

### shopping_lists / shopping_list_items
Portal-owned shopping lists. `is_shared=true` makes the list visible
to all company users.

### approval_rules / approvals
Approvals tables exist in v1 even though `FEATURE_APPROVALS=false`.
Flipping the flag activates the rule engine without a migration.

### company_settings
Per-company configuration edited via the admin UI. Defaults are set
on the column when the row is bootstrapped at first sign-in.

### admin_audit_log
Append-only. Every admin write goes through `withAudit(...)` and
lands one row here. Reads gated by `portal.admin`.

## Generating + applying migrations

```bash
# After editing schema/*.ts, generate a SQL diff:
yarn db:generate

# Apply against $DATABASE_URL:
yarn db:migrate
```

Migrations are checked into `packages/db/src/migrations/`.
