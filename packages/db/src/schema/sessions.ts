import { pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core';

/**
 * Active server-side sessions. The browser holds only a signed cookie
 * carrying this row's id. The Shopify CAA access/refresh tokens live
 * here, never in the browser.
 */
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  shopifyCustomerId: text('shopify_customer_id').notNull(),
  shopifyCompanyGid: text('shopify_company_gid').notNull(),
  activeLocationGid: text('active_location_gid'),
  caaAccessToken: text('caa_access_token').notNull(),
  caaRefreshToken: text('caa_refresh_token'),
  caaExpiresAt: integer('caa_expires_at').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

/**
 * Transient state for in-flight OAuth/PKCE flows. Inserted on
 * /auth/login, deleted on /auth/callback (or by a sweeper after TTL).
 */
export const oauthStates = pgTable('oauth_states', {
  state: text('state').primaryKey(),
  codeVerifier: text('code_verifier').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
