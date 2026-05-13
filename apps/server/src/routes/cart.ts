import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { ValidationError } from '@b2b/domain';
import {
  CART_LINES_ADD_MUTATION,
  CART_LINES_REMOVE_MUTATION, CART_LINES_UPDATE_MUTATION,
  renderCartQuery,
} from '../shopify/queries';
import { storefrontQuery } from '../shopify/storefrontClient';
import { checkoutUrlOf, mapShopifyCart, type ShopifyCartResponse } from '../shopify/mappers/cartMapper';
import type { AppVariables } from '../middleware/types';
import { clearCartId, getCartId } from '../portal/cart/cartStore';
import { ensureCart as _ensureCart } from '../portal/cart/ensureCart';

export const cartRoutes = new Hono<{ Variables: AppVariables }>();

interface CartLinesAddData { cartLinesAdd: { cart: ShopifyCartResponse; userErrors: { field?: string[]; message: string }[] } }
interface CartLinesUpdateData { cartLinesUpdate: { cart: ShopifyCartResponse; userErrors: { field?: string[]; message: string }[] } }
interface CartLinesRemoveData { cartLinesRemove: { cart: ShopifyCartResponse; userErrors: { field?: string[]; message: string }[] } }

const ensureCart = _ensureCart;

cartRoutes.get('/cart', async (c) => {
  const auth = c.var.auth!;
  const cart = await ensureCart(c.var.db, auth.sessionId, auth.caaAccessToken, auth.location?.shopifyLocationGid);
  return c.json(mapShopifyCart(cart));
});

const addItemSchema = z.object({
  sku: z.string().optional(),
  variantId: z.string().optional(),
  quantity: z.number().int().positive(),
}).refine((v) => v.sku || v.variantId, { message: 'sku or variantId required' });

cartRoutes.post('/cart/items', zValidator('json', addItemSchema), async (c) => {
  const auth = c.var.auth!;
  const input = c.req.valid('json');
  const cart = await ensureCart(c.var.db, auth.sessionId, auth.caaAccessToken, auth.location?.shopifyLocationGid);

  // Resolve sku -> variantId if needed.
  let variantId = input.variantId;
  if (!variantId && input.sku) {
    const res = await storefrontQuery<{
      products: { edges: Array<{ node: { variants: { edges: Array<{ node: { id: string } }> } } }> };
    }>(
      `query Sku($q: String!) { products(query: $q, first: 1) { edges { node { variants(first: 1) { edges { node { id } } } } } } }`,
      { q: `sku:${input.sku}` },
      { buyerAccessToken: auth.caaAccessToken },
    );
    variantId = res.products.edges[0]?.node.variants.edges[0]?.node.id;
    if (!variantId) throw new ValidationError(`Unknown SKU "${input.sku}"`);
  }

  const result = await storefrontQuery<CartLinesAddData>(
    renderCartQuery(CART_LINES_ADD_MUTATION),
    { cartId: cart.id, lines: [{ merchandiseId: variantId, quantity: input.quantity }] },
    { buyerAccessToken: auth.caaAccessToken },
  );
  if (result.cartLinesAdd.userErrors.length) {
    throw new ValidationError(result.cartLinesAdd.userErrors.map((e) => e.message).join('; '));
  }
  return c.json(mapShopifyCart(result.cartLinesAdd.cart));
});

const addItemsSchema = z.object({
  items: z.array(z.object({
    variantId: z.string().min(1),
    quantity: z.number().int().positive(),
  })).min(1).max(100),
});

cartRoutes.post('/cart/items/bulk', zValidator('json', addItemsSchema), async (c) => {
  const auth = c.var.auth!;
  const { items } = c.req.valid('json');
  const cart = await ensureCart(c.var.db, auth.sessionId, auth.caaAccessToken, auth.location?.shopifyLocationGid);

  const result = await storefrontQuery<CartLinesAddData>(
    renderCartQuery(CART_LINES_ADD_MUTATION),
    {
      cartId: cart.id,
      lines: items.map((i) => ({ merchandiseId: i.variantId, quantity: i.quantity })),
    },
    { buyerAccessToken: auth.caaAccessToken },
  );
  if (result.cartLinesAdd.userErrors.length) {
    throw new ValidationError(result.cartLinesAdd.userErrors.map((e) => e.message).join('; '));
  }
  return c.json(mapShopifyCart(result.cartLinesAdd.cart));
});

const updateSchema = z.object({ quantity: z.number().int().nonnegative() });

cartRoutes.patch('/cart/items/:id', zValidator('json', updateSchema), async (c) => {
  const auth = c.var.auth!;
  const lineId = c.req.param('id');
  const { quantity } = c.req.valid('json');
  const cartId = await getCartId(c.var.db, auth.sessionId);
  if (!cartId) throw new ValidationError('No active cart');
  if (quantity === 0) {
    const result = await storefrontQuery<CartLinesRemoveData>(
      renderCartQuery(CART_LINES_REMOVE_MUTATION),
      { cartId, lineIds: [lineId] },
      { buyerAccessToken: auth.caaAccessToken },
    );
    return c.json(mapShopifyCart(result.cartLinesRemove.cart));
  }
  const result = await storefrontQuery<CartLinesUpdateData>(
    renderCartQuery(CART_LINES_UPDATE_MUTATION),
    { cartId, lines: [{ id: lineId, quantity }] },
    { buyerAccessToken: auth.caaAccessToken },
  );
  return c.json(mapShopifyCart(result.cartLinesUpdate.cart));
});

cartRoutes.delete('/cart/items/:id', async (c) => {
  const auth = c.var.auth!;
  const lineId = c.req.param('id');
  const cartId = await getCartId(c.var.db, auth.sessionId);
  if (!cartId) throw new ValidationError('No active cart');
  const result = await storefrontQuery<CartLinesRemoveData>(
    renderCartQuery(CART_LINES_REMOVE_MUTATION),
    { cartId, lineIds: [lineId] },
    { buyerAccessToken: auth.caaAccessToken },
  );
  return c.json(mapShopifyCart(result.cartLinesRemove.cart));
});

cartRoutes.delete('/cart', async (c) => {
  await clearCartId(c.var.db, c.var.auth!.sessionId);
  return c.body(null, 204);
});

cartRoutes.post('/cart/checkout', async (c) => {
  const auth = c.var.auth!;
  const cart = await ensureCart(c.var.db, auth.sessionId, auth.caaAccessToken, auth.location?.shopifyLocationGid);
  return c.json({ url: checkoutUrlOf(cart) });
});
