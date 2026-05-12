import type { Cart, CartItem } from '@b2b/domain';

export interface ShopifyCartResponse {
  id: string;
  updatedAt: string;
  checkoutUrl: string;
  cost: {
    subtotalAmount: { amount: string; currencyCode: string };
    totalAmount: { amount: string; currencyCode: string };
    totalTaxAmount?: { amount: string; currencyCode: string } | null;
  };
  lines: {
    edges: Array<{
      node: {
        id: string;
        quantity: number;
        merchandise: {
          id: string;
          sku?: string | null;
          title?: string | null;
          image?: { url: string } | null;
          product: { title: string };
        };
        cost: {
          totalAmount: { amount: string; currencyCode: string };
          amountPerQuantity: { amount: string; currencyCode: string };
        };
      };
    }>;
  };
}

const toItem = (node: ShopifyCartResponse['lines']['edges'][number]['node']): CartItem => {
  const currency = node.cost.totalAmount.currencyCode;
  return {
    id: node.id,
    variantId: node.merchandise.id,
    sku: node.merchandise.sku ?? '',
    name: node.merchandise.product.title + (node.merchandise.title ? ` — ${node.merchandise.title}` : ''),
    quantity: node.quantity,
    unitPrice: { amount: Number(node.cost.amountPerQuantity.amount), currency },
    lineTotal: { amount: Number(node.cost.totalAmount.amount), currency },
    imageUrl: node.merchandise.image?.url,
  };
};

export const mapShopifyCart = (raw: ShopifyCartResponse): Cart => {
  const currency = raw.cost.totalAmount.currencyCode;
  return {
    id: raw.id,
    currency,
    updatedAt: raw.updatedAt,
    items: raw.lines.edges.map((e) => toItem(e.node)),
    totals: {
      subtotal: { amount: Number(raw.cost.subtotalAmount.amount), currency },
      total: { amount: Number(raw.cost.totalAmount.amount), currency },
      tax: raw.cost.totalTaxAmount
        ? { amount: Number(raw.cost.totalTaxAmount.amount), currency }
        : undefined,
    },
  };
};

export const checkoutUrlOf = (raw: ShopifyCartResponse): string => raw.checkoutUrl;
