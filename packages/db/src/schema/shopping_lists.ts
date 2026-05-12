import {
  pgTable, text, timestamp, boolean, integer,
} from 'drizzle-orm/pg-core';

export const shoppingLists = pgTable('shopping_lists', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  ownerId: text('owner_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  isShared: boolean('is_shared').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const shoppingListItems = pgTable('shopping_list_items', {
  id: text('id').primaryKey(),
  listId: text('list_id').notNull(),
  sku: text('sku').notNull(),
  variantId: text('variant_id'),
  name: text('name').notNull(),
  quantity: integer('quantity').notNull(),
  notes: text('notes'),
  addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
});
