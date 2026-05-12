import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
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

const isProduction = process.env.NODE_ENV === 'production';

const app = new Hono<{ Variables: AppVariables }>();

app.use('*', errorHandler);

app.use('*', async (c, next) => {
  c.set('db', createDb(env().DATABASE_URL));
  await next();
});

app.get('/healthz', (c) => c.json({ ok: true }));

// API subtree: everything authenticated lives here, plus auth/login etc.
const api = new Hono<{ Variables: AppVariables }>();

// CORS only in non-production. In production the SPA is served from
// the same origin, so CORS headers are unnecessary.
if (!isProduction) {
  api.use('*', async (c, next) => {
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
}

api.route('/auth', authRoutes);
api.use('/auth/me', optionalAuth);

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
api.route('/', authed);

app.route('/api', api);

// In production, the BFF also serves the built SPA from ./public so
// the whole portal is one origin. In dev, Vite serves the SPA on a
// different port and proxies /api here.
if (isProduction) {
  app.use('/assets/*', serveStatic({ root: './public' }));
  app.get('/favicon.ico', serveStatic({ path: './public/favicon.ico' }));
  // SPA fallback: any non-API GET returns index.html so React Router
  // can take over (including Shopify's /auth/callback redirect).
  app.get('*', serveStatic({ path: './public/index.html' }));
}

const port = env().PORT;
serve({ fetch: app.fetch, port }, ({ port: p }) => {
  // eslint-disable-next-line no-console
  console.log(`BFF listening on http://localhost:${p}`);
});

export type AppType = typeof app;
export default app;
