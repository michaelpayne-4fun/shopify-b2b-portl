import type { Address } from './address';
import type { Money } from './money';

export type OrderStatus =
  | 'pending'
  | 'awaitingPayment'
  | 'awaitingFulfillment'
  | 'shipped'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export interface OrderLine {
  id: string;
  sku: string;
  variantId?: string;
  name: string;
  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
}

export interface Order {
  id: string;
  number: string;
  placedAt: string;
  status: OrderStatus;
  buyerId: string;
  companyId: string;
  locationId?: string;
  poNumber?: string;
  lines: OrderLine[];
  subtotal: Money;
  shipping?: Money;
  tax?: Money;
  refunded?: Money;
  duties?: Money;
  total: Money;
  shippingAddress?: Address;
  billingAddress?: Address;
}

export type OrderScope = 'mine' | 'company';
