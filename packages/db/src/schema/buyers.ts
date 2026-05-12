import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Shadow row keyed by Shopify customer id. Used as the join target
 * for role_assignments and as the authoritative `requestedBy` /
 * `actorId` for portal-owned records.
 */
export const buyers = pgTable('buyers', {
  id: text('id').primaryKey(), // shopify customer id (gid suffix or numeric)
  email: text('email').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  companyId: text('company_id').notNull(), // shopify company id
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
