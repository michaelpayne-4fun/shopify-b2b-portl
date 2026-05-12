import type { Money } from './money';

export interface CartItem {
  id: string;
  variantId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
  imageUrl?: string;
}

export interface CartTotals {
  subtotal: Money;
  discount?: Money;
  tax?: Money;
  shipping?: Money;
  total: Money;
}

export interface Cart {
  id: string;
  items: CartItem[];
  totals: CartTotals;
  currency: string;
  updatedAt: string;
}

export interface AddCartItemInput {
  sku: string;
  variantId?: string;
  quantity: number;
}
