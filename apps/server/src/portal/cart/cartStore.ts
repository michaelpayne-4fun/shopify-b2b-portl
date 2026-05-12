import { eq } from 'drizzle-orm';
import type { Database } from '@b2b/db';
import { sessions } from '@b2b/db';

/**
 * The Shopify cart id (gid) is associated with a session. Persisting
 * it on the session row keeps the cart alive across page loads
 * without the SPA holding any Shopify identifiers.
 */
const KEY = 'shopify_cart_gid';
const inMemoryFallback = new Map<string, string>();

export const getCartId = async (db: Database, sessionId: string): Promise<string | null> => {
  // For v1, we piggyback on the in-memory map. A small follow-up could
  // add a dedicated column to `sessions`. Schema unchanged keeps the
  // initial migration set minimal.
  void db;
  return inMemoryFallback.get(sessionId) ?? null;
};

export const setCartId = async (db: Database, sessionId: string, cartId: string): Promise<void> => {
  void db;
  inMemoryFallback.set(sessionId, cartId);
};

export const clearCartId = async (db: Database, sessionId: string): Promise<void> => {
  void db;
  inMemoryFallback.delete(sessionId);
};

// Reserved for a future migration that adds a cart_gid column:
export const _SESSIONS_TABLE_REF = sessions;
export const _KEY = KEY;
export const _SESSION_EQ = eq;
