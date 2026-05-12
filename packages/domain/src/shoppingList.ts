export interface ShoppingListItem {
  id: string;
  sku: string;
  variantId?: string;
  name: string;
  quantity: number;
  notes?: string;
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
