import { eq } from 'drizzle-orm';
import type { Database } from '@b2b/db';
import { sessions } from '@b2b/db';

/**
 * The active Shopify cart GID for a session. Persisted on the
 * `sessions` row so the cart survives BFF restarts and works across
 * multiple BFF instances behind a load balancer.
 */

export const getCartId = async (db: Database, sessionId: string): Promise<string | null> => {
  const rows = await db
    .select({ gid: sessions.shopifyCartGid })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);
  return rows[0]?.gid ?? null;
};

export const setCartId = async (db: Database, sessionId: string, cartId: string): Promise<void> => {
  await db
    .update(sessions)
    .set({ shopifyCartGid: cartId })
    .where(eq(sessions.id, sessionId));
};

export const clearCartId = async (db: Database, sessionId: string): Promise<void> => {
  await db
    .update(sessions)
    .set({ shopifyCartGid: null })
    .where(eq(sessions.id, sessionId));
};
