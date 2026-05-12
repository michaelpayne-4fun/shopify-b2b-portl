# Admin Configuration UI

Every portal-owned feature ships with at least one admin screen so
company admins can tune behavior without code or environment changes.

## Access

- Gated by the `portal.admin` permission.
- `portal.admin` is **never** sourced from Shopify; it is granted
  exclusively through `/admin/role-grants` plus a bootstrap rule:
  - First sign-in by a Shopify `Location admin` for a company that has
    no `portal.admin` grant yet auto-grants the buyer.
- The grant table is `role_assignments` (see `packages/db/src/schema/roles.ts`).

## Screens

| Route | v1? | Purpose |
|---|---|---|
| `/admin` | ✓ | Overview tiles + landing |
| `/admin/role-grants` | ✓ | Toggle portal-only permissions per buyer |
| `/admin/company-settings` | ✓ | Quote/list/branding defaults |
| `/admin/quote-settings` | ✓ | Redirect to Company settings (Quotes section) |
| `/admin/shopping-list-settings` | ✓ | Redirect to Company settings (Shopping lists section) |
| `/admin/audit-log` | ✓ | Append-only history of admin writes |
| `/admin/features` | ✓ | Read-only view of server feature flags |
| `/admin/approval-rules` | — | Hidden until `FEATURE_APPROVALS=true` |

## Audit trail

Every admin write runs inside `withAudit(...)` (see
`apps/server/src/portal/audit/withAudit.ts`):

1. Capture `before` snapshot.
2. Run the mutation.
3. Insert an `admin_audit_log` row with `actor_id`, `action`,
   `subject_type`, `subject_id`, `before`, `after`, `at`.

Audit rows are append-only. The audit-log read view (`/admin/audit-log`)
is also gated by `portal.admin`.

## Adding a new admin surface

1. Add a Drizzle table (and migration) for the new setting.
2. Add a service file under `apps/server/src/portal/admin/` exposing
   pure functions.
3. Wire a route in `apps/server/src/routes/admin.ts` — write paths must
   call `withAudit(...)`.
4. Add a screen under `apps/portal/src/features/admin/pages/` and register
   it in `apps/portal/src/app/routing/router.tsx` behind
   `RequirePermission permission="portal.admin"`.
5. Add the link to `apps/portal/src/ui/components/AppSidebar.tsx`
   `ADMIN` array.
6. Document the new screen in this file.
