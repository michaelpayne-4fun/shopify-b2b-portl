import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { ValidationError } from '@b2b/domain';
import { requireFeatureFlag, requirePermission } from '../middleware/authz';
import type { AppVariables } from '../middleware/types';
import {
  createQuoteDraft, deleteQuote, getQuote, listQuotes, submitQuote, updateQuoteDraft,
} from '../portal/quotes/quoteService';

export const quoteRoutes = new Hono<{ Variables: AppVariables }>();

quoteRoutes.use('*', requireFeatureFlag('quotes'));

const listSchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

quoteRoutes.get(
  '/quotes',
  requirePermission('quotes.view'),
  zValidator('query', listSchema),
  async (c) => {
    const { status } = c.req.valid('query');
    const page = await listQuotes(c.var.db, c.var.auth!.company.id, status);
    return c.json(page);
  },
);

quoteRoutes.get('/quotes/:id', requirePermission('quotes.view'), async (c) => {
  const q = await getQuote(c.var.db, c.var.auth!.company.id, c.req.param('id'));
  return c.json(q);
});

const draftSchema = z.object({
  lines: z.array(z.object({
    sku: z.string().min(1),
    quantity: z.number().int().positive(),
    notes: z.string().optional(),
  })).min(1),
  notes: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

quoteRoutes.post('/quotes', requirePermission('quotes.create'), zValidator('json', draftSchema), async (c) => {
  const auth = c.var.auth!;
  const quote = await createQuoteDraft(c.var.db, {
    companyId: auth.company.id,
    buyerId: auth.buyer.id,
    locationId: auth.location?.id,
    input: c.req.valid('json'),
    buyerAccessToken: auth.caaAccessToken,
  });
  return c.json(quote);
});

quoteRoutes.patch('/quotes/:id', requirePermission('quotes.update'), zValidator('json', draftSchema), async (c) => {
  const auth = c.var.auth!;
  const quote = await updateQuoteDraft(c.var.db, {
    companyId: auth.company.id,
    id: c.req.param('id'),
    input: c.req.valid('json'),
    buyerAccessToken: auth.caaAccessToken,
  });
  return c.json(quote);
});

quoteRoutes.delete('/quotes/:id', requirePermission('quotes.delete'), async (c) => {
  await deleteQuote(c.var.db, c.var.auth!.company.id, c.req.param('id'));
  return c.body(null, 204);
});

quoteRoutes.post('/quotes/:id/submit', requirePermission('quotes.submit'), async (c) => {
  const quote = await submitQuote(c.var.db, {
    companyId: c.var.auth!.company.id,
    id: c.req.param('id'),
  });
  return c.json(quote);
});

quoteRoutes.post('/quotes/:id/convert-to-cart', requirePermission('checkout.begin'), async (c) => {
  const quote = await getQuote(c.var.db, c.var.auth!.company.id, c.req.param('id'));
  if (quote.status !== 'approved') {
    throw new ValidationError('Only approved quotes can be converted to a cart');
  }
  // For v1, return a placeholder; full draft-order mirror lives in
  // portal/quotes/draftOrderMirror.ts (to be implemented when
  // quote_mirror_to_draft_order setting is true).
  return c.json({ cartId: 'pending-cart-id' });
});
