import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { ValidationError, type ShoppingList } from '@b2b/domain';
import { requireFeatureFlag, requirePermission } from '../middleware/authz';
import type { AppVariables } from '../middleware/types';
import {
  addItem, createShoppingList, deleteShoppingList, getShoppingList,
  listShoppingLists, removeItem, updateItem, updateShoppingList,
} from '../portal/shoppingLists/shoppingListService';
import { getCompanySettings } from '../portal/admin/companySettings';
import { ensureCart } from '../portal/cart/ensureCart';
import { CART_LINES_ADD_MUTATION, renderCartQuery } from '../shopify/queries';
import { storefrontQuery } from '../shopify/storefrontClient';
import { resolveVariantIdBySku, resolveVariantsBySkus } from '../shopify/resolveVariant';
import { mapShopifyCart, type ShopifyCartResponse } from '../shopify/mappers/cartMapper';

export const shoppingListRoutes = new Hono<{ Variables: AppVariables }>();
shoppingListRoutes.use('*', requireFeatureFlag('shoppingLists'));

/**
 * Enrich a list's items with current B2B unit prices resolved via the
 * buyer's CAA token. Best-effort: a failure logs and returns the list
 * un-priced rather than failing the whole response.
 */
const enrichWithPrices = async (
  list: ShoppingList,
  buyerAccessToken: string,
): Promise<ShoppingList> => {
  if (list.items.length === 0) return list;
  try {
    const summaries = await resolveVariantsBySkus(
      list.items.map((it) => it.sku),
      buyerAccessToken,
    );
    return {
      ...list,
      items: list.items.map((it) => {
        const s = summaries.get(it.sku);
        if (!s) return it;
        return {
          ...it,
          variantId: it.variantId ?? s.variantId,
          unitPrice: s.price,
        };
      }),
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[shopping-lists] price enrichment failed:', err);
    return list;
  }
};

shoppingListRoutes.get('/shopping-lists', requirePermission('shoppingLists.view'), async (c) => {
  const page = await listShoppingLists(c.var.db, c.var.auth!.company.id, c.var.auth!.buyer.id);
  return c.json(page);
});

shoppingListRoutes.get('/shopping-lists/:id', requirePermission('shoppingLists.view'), async (c) => {
  const list = await getShoppingList(c.var.db, c.req.param('id'));
  return c.json(await enrichWithPrices(list, c.var.auth!.caaAccessToken));
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

const itemSchema = z.object({
  sku: z.string().min(1),
  quantity: z.number().int().positive(),
  name: z.string().optional(),
  // When the buyer adds via ProductSearch the variantId is known. Storing
  // it avoids a Storefront SKU resolution round-trip on add-to-cart.
  variantId: z.string().optional(),
});

shoppingListRoutes.post(
  '/shopping-lists/:id/items',
  requirePermission('shoppingLists.manage'),
  zValidator('json', itemSchema),
  async (c) => {
    const input = c.req.valid('json');
    const list = await addItem(c.var.db, {
      listId: c.req.param('id'),
      sku: input.sku,
      quantity: input.quantity,
      name: input.name,
      variantId: input.variantId,
    });
    return c.json(await enrichWithPrices(list, c.var.auth!.caaAccessToken));
  },
);

const itemPatchSchema = z.object({
  quantity: z.number().int().positive().optional(),
  name: z.string().min(1).optional(),
}).refine((v) => v.quantity !== undefined || v.name !== undefined, {
  message: 'At least one of quantity or name must be provided',
});

shoppingListRoutes.patch(
  '/shopping-lists/:id/items/:itemId',
  requirePermission('shoppingLists.manage'),
  zValidator('json', itemPatchSchema),
  async (c) => {
    const list = await updateItem(
      c.var.db,
      c.req.param('id'),
      c.req.param('itemId'),
      c.req.valid('json'),
    );
    return c.json(await enrichWithPrices(list, c.var.auth!.caaAccessToken));
  },
);

shoppingListRoutes.delete(
  '/shopping-lists/:id/items/:itemId',
  requirePermission('shoppingLists.manage'),
  async (c) => {
    const list = await removeItem(c.var.db, c.req.param('id'), c.req.param('itemId'));
    return c.json(await enrichWithPrices(list, c.var.auth!.caaAccessToken));
  },
);

const tagStage = async <T>(stage: string, fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // eslint-disable-next-line no-console
    console.error(`[shopping-list.add-to-cart] stage=${stage} failed:`, message);
    throw new Error(`stage=${stage}: ${message}`);
  }
};

shoppingListRoutes.post('/shopping-lists/:id/add-to-cart', requirePermission('cart.update'), async (c) => {
  const auth = c.var.auth!;
  const list = await tagStage('load_list', () => getShoppingList(c.var.db, c.req.param('id')));

  if (list.items.length === 0) {
    throw new ValidationError('Shopping list has no items');
  }

  // Resolve any items that don't have a variantId stored — look up by
  // SKU via Storefront. Per-item try/catch so one upstream failure
  // doesn't kill the whole request; failed lookups land in `skipped`.
  const variantMap = new Map<string, string>();
  const skipped: string[] = [];
  const skuLookupNeeded = list.items.filter((it) => !it.variantId);

  if (skuLookupNeeded.length > 0) {
    await tagStage('resolve_skus', () =>
      Promise.all(
        skuLookupNeeded.map(async (it) => {
          try {
            const vid = await resolveVariantIdBySku(it.sku, auth.caaAccessToken);
            if (vid) variantMap.set(it.sku, vid);
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error(`[shopping-list.add-to-cart] sku=${it.sku} lookup error:`, err);
            // leave variant unresolved; item will be reported as skipped
          }
        }),
      ),
    );
  }

  const resolvedLines: { merchandiseId: string; quantity: number }[] = [];
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
  const cart = await tagStage('ensure_cart', () =>
    ensureCart(c.var.db, auth.sessionId, auth.caaAccessToken, auth.location?.shopifyLocationGid),
  );
  const result = await tagStage('cart_lines_add', () =>
    storefrontQuery<CartLinesAddData>(
      renderCartQuery(CART_LINES_ADD_MUTATION),
      { cartId: cart.id, lines: resolvedLines },
      { buyerAccessToken: auth.caaAccessToken },
    ),
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
