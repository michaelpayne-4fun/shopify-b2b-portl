import type { Quote, QuoteLine, QuoteStatus } from '@/domain/models';
import type { BCQuoteLine, BCQuoteResponse } from '../types/responses';

const STATUS_MAP: Record<string, QuoteStatus> = {
  draft: 'draft',
  submitted: 'submitted',
  approved: 'approved',
  rejected: 'rejected',
  expired: 'expired',
  ordered: 'ordered',
};

const toLine = (raw: BCQuoteLine, currency: string): QuoteLine => ({
  id: String(raw.id),
  sku: raw.sku,
  variantId: raw.variant_id,
  name: raw.name,
  quantity: raw.quantity,
  unitPrice: { amount: raw.unit_price, currency },
  lineTotal: { amount: raw.line_total, currency },
  notes: raw.notes,
});

export const mapBcQuote = (raw: BCQuoteResponse['data']): Quote => {
  const currency = raw.currency_code;
  return {
    id: String(raw.id),
    number: raw.quote_number,
    status: STATUS_MAP[raw.status] ?? 'draft',
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    expiresAt: raw.expires_at,
    buyerId: raw.buyer_id,
    companyId: raw.company_id,
    subtotal: { amount: raw.subtotal, currency },
    total: { amount: raw.total, currency },
    lines: raw.items.map((it) => toLine(it, currency)),
    notes: raw.notes,
  };
};
