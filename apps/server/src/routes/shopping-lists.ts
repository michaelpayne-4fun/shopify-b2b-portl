import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { ValidationError } from '@b2b/domain';
import { requireFeatureFlag, requirePermission } from '../middleware/authz';
import type { AppVariables } from '../middleware/types';
import {
  addItem, createShoppingList, deleteShoppingList, getShoppingList,
  listShoppingLists, removeItem, updateShoppingList,
} from '../portal/shoppingLists/shoppingListService';
import { getCompanySettings } from '../portal/admin/companySettings';
import { ensureCart } from '../portal/cart/ensureCart';
import { CART_LINES_ADD_MUTATION, renderCartQuery } from '../shopify/queries';
import { storefrontQuery } from '../shopify/storefrontClient';
import { resolveVariantIdBySku } from '../shopify/resolveVariant';
import { mapShopifyCart, type ShopifyCartResponse } from '../shopify/mappers/cartMapper';

export const shoppingListRoutes = new Hono<{ Variables: AppVariables }>();
shoppingListRoutes.use('*', requireFeatureFlag('shoppingLists'));

shoppingListRoutes.get('/shopping-lists', requirePermission('shoppingLists.view'), async (c) => {
  const page = await listShoppingLists(c.var.db, c.var.auth!.company.id, c.var.auth!.buyer.id);
  return c.json(page);
});

shoppingListRoutes.get('/shopping-lists/:id', requirePermission('shoppingLists.view'), async (c) => {
  return c.json(await getShoppingList(c.var.db, c.req.param('id')));
});

const upsertSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isShared: z.boolean().optional(),
});

shoppingListRoutes.post(
  '/shopping-lists',
  requirePermission('shoppingLists.manage'),
  zValidator('json', upsertSchema),
  async (c) => {
    const settings = await getCompanySettings(c.var.db, c.var.auth!.company.id);
    const list = await createShoppingList(c.var.db, {
      companyId: c.var.auth!.company.id,
      ownerId: c.var.auth!.buyer.id,
      input: c.req.valid('json'),
      defaultIsShared: settings.shoppingListDefaultIsShared,
    });
    return c.json(list);
  },
);

shoppingListRoutes.patch(
  '/shopping-lists/:id',
  requirePermission('shoppingLists.manage'),
  zValidator('json', upsertSchema.partial()),
  async (c) => {
    const list = await updateShoppingList(c.var.db, c.req.param('id'), c.req.valid('json'));
    return c.json(list);
  },
);

shoppingListRoutes.delete('/shopping-lists/:id', requirePermission('shoppingLists.manage'), async (c) => {
  await deleteShoppingList(c.var.db, c.req.param('id'));
  return c.body(null, 204);
});

const itemSchema = z.object({ sku: z.string().min(1), quantity: z.number().int().positive(), name: z.string().optional() });

shoppingListRoutes.post(
  '/shopping-lists/:id/items',
  requirePermission('shoppingLists.manage'),
  zValidator('json', itemSchema),
  async (c) => {
    const list = await addItem(c.var.db, {
      listId: c.req.param('id'),
      sku: c.req.valid('json').sku,
      quantity: c.req.valid('json').quantity,
      name: c.req.valid('json').name,
    });
    return c.json(list);
  },
);

shoppingListRoutes.delete(
  '/shopping-lists/:id/items/:itemId',
  requirePermission('shoppingLists.manage'),
  async (c) => {
    const list = await removeItem(c.var.db, c.req.param('id'), c.req.param('itemId'));
    return c.json(list);
  },
);

shoppingListRoutes.post('/shopping-lists/:id/add-to-cart', requirePermission('cart.update'), async (c) => {
  const auth = c.var.auth!;
  const list = await getShoppingList(c.var.db, c.req.param('id'));

  if (list.items.length === 0) {
    throw new ValidationError('Shopping list has no items');
  }

  // Resolve any items that don't have a variantId stored — look up by SKU via Storefront.
  const resolvedLines: { merchandiseId: string; quantity: number }[] = [];
  const skuLookupNeeded = list.items.filter((it) => !it.variantId);
  const variantMap = new Map<string, string>(); // sku -> variantId

  if (skuLookupNeeded.length > 0) {
    // Per-SKU exact-match resolution. Shared with cart.ts via
    // resolveVariantIdBySku — keeps tokenised `sku:` mismatches from
    // pulling the wrong variant.
    await Promise.all(
      skuLookupNeeded.map(async (it) => {
        const vid = await resolveVariantIdBySku(it.sku, auth.caaAccessToken);
        if (vid) variantMap.set(it.sku, vid);
      }),
    );
  }

  // Build the lines array; skip items whose SKU couldn't be resolved.
  const skipped: string[] = [];
  for (const it of list.items) {
    const variantId = it.variantId ?? variantMap.get(it.sku);
    if (!variantId) { skipped.push(it.sku); continue; }
    resolvedLines.push({ merchandiseId: variantId, quantity: it.quantity });
  }

  if (resolvedLines.length === 0) {
    throw new ValidationError(
      `None of the SKUs in this list could be resolved: ${skipped.join(', ')}`,
    );
  }

  interface CartLinesAddData { cartLinesAdd: { cart: ShopifyCartResponse; userErrors: { field?: string[]; message: string }[] } }
  const cart = await ensureCart(c.var.db, auth.sessionId, auth.caaAccessToken, auth.location?.shopifyLocationGid);
  const result = await storefrontQuery<CartLinesAddData>(
    renderCartQuery(CART_LINES_ADD_MUTATION),
    { cartId: cart.id, lines: resolvedLines },
    { buyerAccessToken: auth.caaAccessToken },
  );
  if (result.cartLinesAdd.userErrors.length) {
    throw new ValidationError(result.cartLinesAdd.userErrors.map((e) => e.message).join('; '));
  }

  const response = c.json(mapShopifyCart(result.cartLinesAdd.cart));
  if (skipped.length > 0) {
    response.headers.set('X-Warning', `SKUs not found in catalog: ${skipped.join(', ')}`);
  }
  return response;
});
