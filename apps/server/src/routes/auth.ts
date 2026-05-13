import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { oauthStates, sessions } from '@b2b/db';
import { NotAuthenticatedError, ValidationError } from '@b2b/domain';
import { env } from '../env';
import {
  buildAuthorizeUrl, exchangeCode, generatePkcePair, generateState,
} from '../shopify/oauth';
import {
  SESSION_TTL, clearSessionCookie, issueSessionCookie,
} from '../auth/session';
import { bootstrapPortalAdminIfFirst } from '../auth/permissions';
import { customerAccountQuery } from '../shopify/customerAccountClient';
import { COMPANY_FOR_CUSTOMER_QUERY, CUSTOMER_ME_QUERY } from '../shopify/queries';
import { isShopifyLocationAdmin } from '../shopify/mappers/permissionMapper';
import type { AppVariables } from '../middleware/types';
import { ensureCompanySettings } from '../portal/admin/companySettings';

export const authRoutes = new Hono<{ Variables: AppVariables }>();

authRoutes.post('/login', async (c) => {
  const state = generateState();
  const { codeVerifier, codeChallenge } = generatePkcePair();
  await c.var.db.insert(oauthStates).values({ state, codeVerifier });
  return c.json({ authorizeUrl: buildAuthorizeUrl({ state, codeChallenge }) });
});

const callbackSchema = z.object({ code: z.string().min(1), state: z.string().min(1) });

const tagStage = async <T>(stage: string, fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // eslint-disable-next-line no-console
    console.error(`[auth.callback] stage=${stage} failed:`, message);
    throw new Error(`stage=${stage}: ${message}`);
  }
};

authRoutes.post('/callback', zValidator('json', callbackSchema), async (c) => {
  const { code, state } = c.req.valid('json');
  const db = c.var.db;

  const stored = await tagStage('lookup_state', async () => {
    const rows = await db.select().from(oauthStates).where(eq(oauthStates.state, state)).limit(1);
    if (!rows[0]) throw new ValidationError('Unknown OAuth state');
    await db.delete(oauthStates).where(eq(oauthStates.state, state));
    return rows[0];
  });

  const tokens = await tagStage('token_exchange', () => exchangeCode(code, stored.codeVerifier));

  const me = await tagStage('customer_me', () =>
    customerAccountQuery<{ customer: { id: string } }>(tokens.access_token, CUSTOMER_ME_QUERY),
  );

  const companyData = await tagStage('company_lookup', () =>
    customerAccountQuery<{
      customer: {
        companyContactProfiles: Array<{
          company: { id: string };
          roleAssignments: { edges: Array<{ node: { role: { name: string }; companyLocation: { id: string } } }> };
        }>;
      };
    }>(tokens.access_token, COMPANY_FOR_CUSTOMER_QUERY, { customerId: me.customer.id }),
  );

  const profile = companyData.customer.companyContactProfiles[0];
  if (!profile) throw new ValidationError('Buyer is not associated with any Shopify B2B company');

  const companyId = profile.company.id;
  const firstRoleAssignment = profile.roleAssignments.edges[0]?.node;
  const isLocationAdmin = isShopifyLocationAdmin(firstRoleAssignment?.role.name ?? '');

  await tagStage('bootstrap_admin', () =>
    bootstrapPortalAdminIfFirst(db, {
      companyId,
      buyerId: me.customer.id,
      isShopifyLocationAdmin: isLocationAdmin,
    }),
  );
  await tagStage('ensure_company_settings', () => ensureCompanySettings(db, companyId));

  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL * 1000);
  await tagStage('session_persist', () =>
    db.insert(sessions).values({
      id: sessionId,
      shopifyCustomerId: me.customer.id,
      shopifyCompanyGid: companyId,
      activeLocationGid: firstRoleAssignment?.companyLocation.id ?? null,
      caaAccessToken: tokens.access_token,
      caaRefreshToken: tokens.refresh_token ?? null,
      caaExpiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
      expiresAt,
    }),
  );

  const cookie = await issueSessionCookie(sessionId);
  c.header('Set-Cookie', cookie);

  return c.json({
    publicPortalUrl: env().PUBLIC_PORTAL_URL,
    sessionId,
  });
});

authRoutes.post('/logout', async (c) => {
  // Best-effort: clear the session if present.
  c.header('Set-Cookie', clearSessionCookie());
  // The authn middleware is not applied here; we don't need an auth
  // context to invalidate. Cookie clearance suffices for v1.
  return c.body(null, 204);
});

authRoutes.get('/me', async (c) => {
  const auth = c.var.auth;
  if (!auth) throw new NotAuthenticatedError();
  return c.json({
    buyer: auth.buyer,
    company: auth.company,
    activeLocationId: auth.location?.id,
  });
});
