import { bff } from './bffClient';
import type { Page, ShoppingList, ShoppingListInput } from '@b2b/domain';

export const listShoppingLists = () => bff.get<Page<ShoppingList>>('/shopping-lists');
export const getShoppingList = (id: string) =>
  bff.get<ShoppingList>(`/shopping-lists/${encodeURIComponent(id)}`);
export const createShoppingList = (input: ShoppingListInput) =>
  bff.post<ShoppingList>('/shopping-lists', input);
export const updateShoppingList = (id: string, input: Partial<ShoppingListInput>) =>
  bff.patch<ShoppingList>(`/shopping-lists/${encodeURIComponent(id)}`, input);
export const deleteShoppingList = (id: string) =>
  bff.delete<void>(`/shopping-lists/${encodeURIComponent(id)}`);
export const addItemToList = (id: string, sku: string, quantity: number) =>
  bff.post<ShoppingList>(`/shopping-lists/${encodeURIComponent(id)}/items`, { sku, quantity });
export const removeItemFromList = (id: string, itemId: string) =>
  bff.delete<ShoppingList>(
    `/shopping-lists/${encodeURIComponent(id)}/items/${encodeURIComponent(itemId)}`,
  );
export const addListToCart = (id: string) =>
  bff.post<{ cartId: string }>(`/shopping-lists/${encodeURIComponent(id)}/add-to-cart`);
