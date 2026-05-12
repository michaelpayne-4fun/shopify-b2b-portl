import type { Money } from './money';

/**
 * v1 state machine (FEATURE_APPROVALS=false):
 *   draft → approved (auto on submit) → ordered
 *           └─► expired (if expiresAt < now)
 *
 * v2 (FEATURE_APPROVALS=true) adds a `submitted` waypoint and a
 * `rejected` terminal state. Schema accommodates both.
 */
export type QuoteStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'expired' | 'ordered';

export interface QuoteLine {
  id: string;
  sku: string;
  variantId?: string;
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
  locationId?: string;
  lines: QuoteLine[];
  subtotal: Money;
  total: Money;
  notes?: string;
  /** Shopify Draft Order GID when the BFF has mirrored this quote. */
  shopifyDraftOrderGid?: string;
}

export interface QuoteDraftInput {
  lines: Array<{ sku: string; quantity: number; notes?: string }>;
  notes?: string;
  expiresAt?: string;
}
