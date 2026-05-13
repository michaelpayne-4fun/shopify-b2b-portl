import type { Money } from './money';

export interface ShoppingListItem {
  id: string;
  sku: string;
  variantId?: string;
  name: string;
  quantity: number;
  notes?: string;
  /**
   * Current B2B unit price as resolved on the most recent list read.
   * Not persisted — derived server-side from Shopify with the buyer's
   * CAA token. Optional because pricing lookups can fail (network,
   * SKU no longer in catalog, etc.) and the list should still render.
   */
  unitPrice?: Money;
}

export interface ShoppingList {
  id: string;
  name: string;
  description?: string;
  isShared: boolean;
  ownerId: string;
  companyId: string;
  items: ShoppingListItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingListInput {
  name: string;
  description?: string;
  isShared?: boolean;
}
