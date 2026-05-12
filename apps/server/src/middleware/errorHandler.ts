import type { MiddlewareHandler } from 'hono';
import { DomainError } from '@b2b/domain';

export const errorHandler: MiddlewareHandler = async (c, next) => {
  try {
    await next();
  } catch (err) {
    if (err instanceof DomainError) {
      return c.json({ error: err.code, message: err.message }, err.status as 400 | 401 | 403 | 404 | 409);
    }
    // eslint-disable-next-line no-console
    console.error('Unhandled error', err);
    return c.json({ error: 'INTERNAL', message: 'Unexpected server error' }, 500);
  }
};
