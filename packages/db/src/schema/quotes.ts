import {
  pgTable, text, timestamp, integer, numeric, jsonb,
} from 'drizzle-orm/pg-core';

export const quotes = pgTable('quotes', {
  id: text('id').primaryKey(),
  number: text('number').notNull(),
  status: text('status').notNull(), // QuoteStatus
  companyId: text('company_id').notNull(),
  locationId: text('location_id'),
  buyerId: text('buyer_id').notNull(),
  currency: text('currency').notNull(),
  subtotalCents: integer('subtotal_cents').notNull(),
  totalCents: integer('total_cents').notNull(),
  notes: text('notes'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  shopifyDraftOrderGid: text('shopify_draft_order_gid'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const quoteLines = pgTable('quote_lines', {
  id: text('id').primaryKey(),
  quoteId: text('quote_id').notNull(),
  sku: text('sku').notNull(),
  variantId: text('variant_id'),
  name: text('name').notNull(),
  quantity: integer('quantity').notNull(),
  unitPriceCents: integer('unit_price_cents').notNull(),
  lineTotalCents: integer('line_total_cents').notNull(),
  notes: text('notes'),
  /** Snapshot of resolved variant attributes at quote-line creation time. */
  attributes: jsonb('attributes'),
  /** Position within the quote for ordering. */
  position: numeric('position').notNull(),
});
