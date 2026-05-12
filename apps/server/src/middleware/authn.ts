import type { MiddlewareHandler } from 'hono';
import { eq } from 'drizzle-orm';
import { sessions } from '@b2b/db';
import { NotAuthenticatedError } from '@b2b/domain';
import { readSessionCookie, verifySessionToken } from '../auth/session';
import { resolveAuthContext } from '../shopify/resolveContext';
import type { AppVariables } from './types';

/**
 * Resolves the session cookie -> AuthContext on c.var.auth. Throws
 * NotAuthenticatedError if no valid session.
 */
export const requireAuth: MiddlewareHandler<{ Variables: AppVariables }> = async (c, next) => {
  const token = readSessionCookie(c.req.header('cookie'));
  if (!token) throw new NotAuthenticatedError();
  const claims = await verifySessionToken(token);
  if (!claims) throw new NotAuthenticatedError();

  const db = c.var.db;
  const rows = await db.select().from(sessions).where(eq(sessions.id, claims.sid)).limit(1);
  const session = rows[0];
  if (!session || session.expiresAt.getTime() < Date.now()) {
    throw new NotAuthenticatedError();
  }

  const auth = await resolveAuthContext(db, session);
  c.set('auth', auth);
  await next();
};

/**
 * Like requireAuth but allows the handler to run unauthenticated.
 * Useful for /auth/me which must return 401 cleanly.
 */
export const optionalAuth: MiddlewareHandler<{ Variables: AppVariables }> = async (c, next) => {
  try {
    const token = readSessionCookie(c.req.header('cookie'));
    if (!token) return next();
    const claims = await verifySessionToken(token);
    if (!claims) return next();
    const db = c.var.db;
    const rows = await db.select().from(sessions).where(eq(sessions.id, claims.sid)).limit(1);
    const session = rows[0];
    if (!session || session.expiresAt.getTime() < Date.now()) return next();
    const auth = await resolveAuthContext(db, session);
    c.set('auth', auth);
  } catch {
    // swallow; downstream sees no auth
  }
  await next();
};
