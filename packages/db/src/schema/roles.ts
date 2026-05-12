import { pgTable, text, primaryKey, timestamp } from 'drizzle-orm/pg-core';

/**
 * Portal-owned permission grants per buyer. Merged with the
 * Shopify-derived role in apps/server/src/auth/permissions.ts to
 * produce the Role returned to the SPA.
 *
 * `permission` values must be members of @b2b/domain `Permission`
 * union. The DB doesn't enforce that constraint; the BFF validates on
 * write (admin UI is the only writer).
 */
export const roleAssignments = pgTable(
  'role_assignments',
  {
    buyerId: text('buyer_id').notNull(),
    companyId: text('company_id').notNull(),
    permission: text('permission').notNull(),
    grantedBy: text('granted_by').notNull(),
    grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.buyerId, t.permission] }),
  }),
);
