import type { Address } from './address';
import type { Money } from './money';

export type QuoteStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'expired' | 'ordered';

export interface QuoteLine {
  id: string;
  sku: string;
  variantId: string;
  name: string;
  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
  notes?: string;
}

export interface Quote {
  id: string;
  number: string;
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  buyerId: string;
  companyId: string;
  lines: QuoteLine[];
  subtotal: Money;
  total: Money;
  shippingAddress?: Address;
  billingAddress?: Address;
  notes?: string;
}

export interface QuoteDraftInput {
  lines: Array<{ sku: string; quantity: number; notes?: string }>;
  notes?: string;
  shippingAddressId?: string;
  billingAddressId?: string;
}
