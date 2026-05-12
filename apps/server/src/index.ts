import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { createDb } from '@b2b/db';
import { env } from './env';
import { errorHandler } from './middleware/errorHandler';
import { optionalAuth, requireAuth } from './middleware/authn';
import type { AppVariables } from './middleware/types';
import { authRoutes } from './routes/auth';
import { companyRoutes } from './routes/company';
import { catalogRoutes } from './routes/catalog';
import { cartRoutes } from './routes/cart';
import { orderRoutes } from './routes/orders';
import { addressRoutes } from './routes/addresses';
import { userRoutes } from './routes/users';
import { quoteRoutes } from './routes/quotes';
import { shoppingListRoutes } from './routes/shopping-lists';
import { approvalRoutes } from './routes/approvals';
import { adminRoutes } from './routes/admin';

const app = new Hono<{ Variables: AppVariables }>();

app.use('*', errorHandler);

// Database is created once; routes read it from c.var.db.
app.use('*', async (c, next) => {
  c.set('db', createDb(env().DATABASE_URL));
  await next();
});

app.get('/healthz', (c) => c.json({ ok: true }));

// CORS for local dev. In production, place the BFF on the same origin
// as the SPA so cookies work without CORS gymnastics.
app.use('*', async (c, next) => {
  const origin = c.req.header('origin');
  if (origin && origin === env().PUBLIC_PORTAL_URL) {
    c.header('Access-Control-Allow-Origin', origin);
    c.header('Access-Control-Allow-Credentials', 'true');
    c.header('Access-Control-Allow-Headers', 'content-type');
    c.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
    if (c.req.method === 'OPTIONS') return c.body(null, 204);
  }
  await next();
});

// Auth (login/callback/logout are open; /auth/me requires optional auth).
app.route('/auth', authRoutes);
app.use('/auth/me', optionalAuth);

// All subsequent routes require an authenticated session.
const authed = new Hono<{ Variables: AppVariables }>();
authed.use('*', requireAuth);
authed.route('/', companyRoutes);
authed.route('/', catalogRoutes);
authed.route('/', cartRoutes);
authed.route('/', orderRoutes);
authed.route('/', addressRoutes);
authed.route('/', userRoutes);
authed.route('/', quoteRoutes);
authed.route('/', shoppingListRoutes);
authed.route('/', approvalRoutes);
authed.route('/', adminRoutes);
app.route('/', authed);

const port = env().PORT;
serve({ fetch: app.fetch, port }, ({ port: p }) => {
  // eslint-disable-next-line no-console
  console.log(`BFF listening on http://localhost:${p}`);
});

export type AppType = typeof app;
export default app;
