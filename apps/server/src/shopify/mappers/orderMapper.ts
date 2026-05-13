import type { Order, OrderLine, OrderStatus } from '@b2b/domain';
import { mapShopifyAddress, type ShopifyMailingAddress } from './addressMapper';

type MoneySet = { presentmentMoney: { amount: string; currencyCode: string } };

export interface ShopifyOrderNode {
  id: string;
  name: string;
  processedAt: string;
  fulfillmentStatus?: string | null;
  financialStatus?: string | null;
  poNumber?: string | null;
  customerJourney?: { customerOrderId?: string } | null;
  totalPriceSet: MoneySet;
  subtotalPriceSet: MoneySet;
  totalShippingPriceSet?: MoneySet | null;
  totalTaxSet?: MoneySet | null;
  totalRefundedSet?: MoneySet | null;
  totalDutiesSet?: MoneySet | null;
  lineItems: {
    edges: Array<{
      node: {
        id: string;
        sku?: string | null;
        title: string;
        quantity: number;
        variant?: { id: string } | null;
        originalUnitPriceSet: MoneySet;
        originalTotalSet: MoneySet;
      };
    }>;
  };
  shippingAddress?: ShopifyMailingAddress | null;
  billingAddress?: ShopifyMailingAddress | null;
  purchasingEntity?: { __typename: string; company?: { id: string }; location?: { id: string } } | null;
  customer?: { id: string } | null;
}

const STATUS_MAP: Record<string, OrderStatus> = {
  pending: 'pending',
  authorized: 'awaitingPayment',
  paid: 'awaitingFulfillment',
  partially_paid: 'awaitingPayment',
  fulfilled: 'shipped',
  shipped: 'shipped',
  delivered: 'completed',
  cancelled: 'cancelled',
  refunded: 'refunded',
  partially_refunded: 'refunded',
};

const inferStatus = (financial?: string | null, fulfillment?: string | null): OrderStatus => {
  if (fulfillment) {
    const f = STATUS_MAP[fulfillment.toLowerCase()];
    if (f) return f;
  }
  if (financial) {
    const f = STATUS_MAP[financial.toLowerCase()];
    if (f) return f;
  }
  return 'pending';
};

const toLine = (
  node: ShopifyOrderNode['lineItems']['edges'][number]['node'],
): OrderLine => {
  const currency = node.originalTotalSet.presentmentMoney.currencyCode;
  return {
    id: node.id,
    sku: node.sku ?? '',
    variantId: node.variant?.id,
    name: node.title,
    quantity: node.quantity,
    unitPrice: { amount: Number(node.originalUnitPriceSet.presentmentMoney.amount), currency },
    lineTotal: { amount: Number(node.originalTotalSet.presentmentMoney.amount), currency },
  };
};

const moneyOrUndefined = (
  s: MoneySet | null | undefined,
  currency: string,
): { amount: number; currency: string } | undefined => {
  if (!s) return undefined;
  const amount = Number(s.presentmentMoney.amount);
  if (!Number.isFinite(amount) || amount === 0) return undefined;
  return { amount, currency: s.presentmentMoney.currencyCode || currency };
};

export const mapShopifyOrder = (raw: ShopifyOrderNode): Order => {
  const currency = raw.totalPriceSet.presentmentMoney.currencyCode;
  return {
    id: raw.id,
    number: raw.name,
    placedAt: raw.processedAt,
    status: inferStatus(raw.financialStatus, raw.fulfillmentStatus),
    buyerId: raw.customer?.id ?? '',
    companyId: raw.purchasingEntity?.company?.id ?? '',
    locationId: raw.purchasingEntity?.location?.id,
    poNumber: raw.poNumber ?? undefined,
    subtotal: { amount: Number(raw.subtotalPriceSet.presentmentMoney.amount), currency },
    shipping: moneyOrUndefined(raw.totalShippingPriceSet, currency),
    tax: moneyOrUndefined(raw.totalTaxSet, currency),
    refunded: moneyOrUndefined(raw.totalRefundedSet, currency),
    duties: moneyOrUndefined(raw.totalDutiesSet, currency),
    total: { amount: Number(raw.totalPriceSet.presentmentMoney.amount), currency },
    lines: raw.lineItems.edges.map((e) => toLine(e.node)),
    shippingAddress: raw.shippingAddress
      ? mapShopifyAddress(raw.shippingAddress, { scope: 'personal' })
      : undefined,
    billingAddress: raw.billingAddress
      ? mapShopifyAddress(raw.billingAddress, { scope: 'personal' })
      : undefined,
  };
};
