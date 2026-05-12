import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { requireFeatureFlag, requirePermission } from '../middleware/authz';
import type { AppVariables } from '../middleware/types';
import {
  addItem, createShoppingList, deleteShoppingList, getShoppingList,
  listShoppingLists, removeItem, updateShoppingList,
} from '../portal/shoppingLists/shoppingListService';
import { getCompanySettings } from '../portal/admin/companySettings';

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

const itemSchema = z.object({ sku: z.string().min(1), quantity: z.number().int().positive() });

shoppingListRoutes.post(
  '/shopping-lists/:id/items',
  requirePermission('shoppingLists.manage'),
  zValidator('json', itemSchema),
  async (c) => {
    const list = await addItem(c.var.db, {
      listId: c.req.param('id'),
      sku: c.req.valid('json').sku,
      quantity: c.req.valid('json').quantity,
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

shoppingListRoutes.post('/shopping-lists/:id/add-to-cart', requirePermission('cart.update'), async () => {
  // v1: returns a placeholder. Wire to cart.ts addItem in a follow-up.
  return Response.json({ cartId: 'pending-cart-id' });
});
