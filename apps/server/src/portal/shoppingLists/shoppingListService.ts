import { randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import type { Database } from '@b2b/db';
import { shoppingListItems, shoppingLists } from '@b2b/db';
import type { ShoppingList, ShoppingListInput } from '@b2b/domain';
import { NotFoundError } from '@b2b/domain';

const rowToDomain = (
  row: typeof shoppingLists.$inferSelect,
  items: Array<typeof shoppingListItems.$inferSelect>,
): ShoppingList => ({
  id: row.id,
  companyId: row.companyId,
  ownerId: row.ownerId,
  name: row.name,
  description: row.description ?? undefined,
  isShared: row.isShared,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
  items: items.map((it) => ({
    id: it.id,
    sku: it.sku,
    variantId: it.variantId ?? undefined,
    name: it.name,
    quantity: it.quantity,
    notes: it.notes ?? undefined,
  })),
});

export const listShoppingLists = async (
  db: Database,
  companyId: string,
  ownerId: string,
) => {
  const rows = await db
    .select()
    .from(shoppingLists)
    .where(eq(shoppingLists.companyId, companyId))
    .orderBy(desc(shoppingLists.updatedAt));
  // Buyers see their own lists + any shared list in the company.
  const visible = rows.filter((r) => r.isShared || r.ownerId === ownerId);
  if (visible.length === 0) return { items: [], page: 1, pageSize: 0, totalItems: 0, totalPages: 1 };
  const allItems = await db.select().from(shoppingListItems);
  const byList = new Map<string, Array<typeof shoppingListItems.$inferSelect>>();
  for (const it of allItems) {
    const arr = byList.get(it.listId) ?? [];
    arr.push(it);
    byList.set(it.listId, arr);
  }
  const items = visible.map((r) => rowToDomain(r, byList.get(r.id) ?? []));
  return { items, page: 1, pageSize: items.length, totalItems: items.length, totalPages: 1 };
};

export const getShoppingList = async (db: Database, id: string): Promise<ShoppingList> => {
  const rows = await db.select().from(shoppingLists).where(eq(shoppingLists.id, id)).limit(1);
  if (!rows[0]) throw new NotFoundError('ShoppingList', id);
  const items = await db.select().from(shoppingListItems).where(eq(shoppingListItems.listId, id));
  return rowToDomain(rows[0], items);
};

export const createShoppingList = async (
  db: Database,
  args: { companyId: string; ownerId: string; input: ShoppingListInput; defaultIsShared: boolean },
): Promise<ShoppingList> => {
  const id = randomUUID();
  const now = new Date();
  await db.insert(shoppingLists).values({
    id,
    companyId: args.companyId,
    ownerId: args.ownerId,
    name: args.input.name,
    description: args.input.description,
    isShared: args.input.isShared ?? args.defaultIsShared,
    createdAt: now,
    updatedAt: now,
  });
  return getShoppingList(db, id);
};

export const updateShoppingList = async (
  db: Database,
  id: string,
  input: Partial<ShoppingListInput>,
): Promise<ShoppingList> => {
  await db.update(shoppingLists)
    .set({
      name: input.name,
      description: input.description,
      isShared: input.isShared,
      updatedAt: new Date(),
    })
    .where(eq(shoppingLists.id, id));
  return getShoppingList(db, id);
};

export const deleteShoppingList = async (db: Database, id: string): Promise<void> => {
  await db.delete(shoppingListItems).where(eq(shoppingListItems.listId, id));
  await db.delete(shoppingLists).where(eq(shoppingLists.id, id));
};

export const addItem = async (
  db: Database,
  args: { listId: string; sku: string; quantity: number; name?: string; variantId?: string },
): Promise<ShoppingList> => {
  await db.insert(shoppingListItems).values({
    id: randomUUID(),
    listId: args.listId,
    sku: args.sku,
    name: args.name ?? args.sku,
    quantity: args.quantity,
    variantId: args.variantId ?? null,
    notes: null,
  });
  await db.update(shoppingLists).set({ updatedAt: new Date() }).where(eq(shoppingLists.id, args.listId));
  return getShoppingList(db, args.listId);
};

export const updateItem = async (
  db: Database,
  listId: string,
  itemId: string,
  patch: { quantity?: number; name?: string },
): Promise<ShoppingList> => {
  const updates: Record<string, unknown> = {};
  if (patch.quantity !== undefined) updates.quantity = patch.quantity;
  if (patch.name !== undefined) updates.name = patch.name;
  if (Object.keys(updates).length > 0) {
    await db.update(shoppingListItems)
      .set(updates)
      .where(and(eq(shoppingListItems.listId, listId), eq(shoppingListItems.id, itemId)));
    await db.update(shoppingLists).set({ updatedAt: new Date() }).where(eq(shoppingLists.id, listId));
  }
  return getShoppingList(db, listId);
};

export const removeItem = async (
  db: Database,
  listId: string,
  itemId: string,
): Promise<ShoppingList> => {
  await db.delete(shoppingListItems).where(and(eq(shoppingListItems.listId, listId), eq(shoppingListItems.id, itemId)));
  await db.update(shoppingLists).set({ updatedAt: new Date() }).where(eq(shoppingLists.id, listId));
  return getShoppingList(db, listId);
};
