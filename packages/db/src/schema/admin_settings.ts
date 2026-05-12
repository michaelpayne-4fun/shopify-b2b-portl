import {
  pgTable, text, timestamp, boolean, integer,
} from 'drizzle-orm/pg-core';

export const companySettings = pgTable('company_settings', {
  companyId: text('company_id').primaryKey(),
  quoteDefaultExpiryDays: integer('quote_default_expiry_days').notNull().default(14),
  quoteMirrorToDraftOrder: boolean('quote_mirror_to_draft_order').notNull().default(true),
  quoteAllowCustomExpiry: boolean('quote_allow_custom_expiry').notNull().default(true),
  shoppingListDefaultIsShared: boolean('shopping_list_default_is_shared').notNull().default(false),
  shoppingListMaxItems: integer('shopping_list_max_items').notNull().default(500),
  shoppingListMaxListsPerUser: integer('shopping_list_max_lists_per_user').notNull().default(50),
  displayNameOverride: text('display_name_override'),
  supportEmail: text('support_email'),
  logoUrl: text('logo_url'),
  defaultLocationId: text('default_location_id'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: text('updated_by'),
});
