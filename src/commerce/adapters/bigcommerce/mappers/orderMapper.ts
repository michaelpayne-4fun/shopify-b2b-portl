import type { Order, OrderLine, OrderStatus } from '@/domain/models';
import type { BCOrderLine, BCOrderResponse } from '../types/responses';
import { mapBcAddress } from './addressMapper';

const STATUS_MAP: Record<string, OrderStatus> = {
  pending: 'pending',
  awaiting_payment: 'awaitingPayment',
  awaiting_fulfillment: 'awaitingFulfillment',
  shipped: 'shipped',
  completed: 'completed',
  cancelled: 'cancelled',
  refunded: 'refunded',
};

const toLine = (raw: BCOrderLine, currency: string): OrderLine => ({
  id: String(raw.id),
  sku: raw.sku,
  name: raw.name,
  quantity: raw.quantity,
  unitPrice: { amount: raw.price, currency },
  lineTotal: { amount: raw.total, currency },
});

export const mapBcOrder = (raw: BCOrderResponse['data']): Order => {
  const currency = raw.currency.code;
  return {
    id: String(raw.id),
    number: raw.order_number,
    placedAt: raw.placed_at,
    status: STATUS_MAP[raw.status] ?? 'pending',
    buyerId: raw.buyer_id,
    companyId: raw.company_id,
    locationId: raw.location_id,
    poNumber: raw.po_number,
    subtotal: { amount: raw.subtotal_amount, currency },
    total: { amount: raw.total_amount, currency },
    lines: raw.items.map((it) => toLine(it, currency)),
    shippingAddress: raw.shipping_address ? mapBcAddress(raw.shipping_address) : undefined,
    billingAddress: raw.billing_address ? mapBcAddress(raw.billing_address) : undefined,
  };
};
