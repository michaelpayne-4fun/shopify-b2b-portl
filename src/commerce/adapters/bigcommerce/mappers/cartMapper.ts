import type { Cart, CartItem } from '@/domain/models';
import type { BCCartLineItem, BCCartResponse } from '../types/responses';

const toCartItem = (raw: BCCartLineItem, currency: string): CartItem => {
  const unit = raw.sale_price ?? raw.list_price;
  return {
    id: raw.id,
    variantId: raw.variant_id,
    sku: raw.sku,
    name: raw.name,
    quantity: raw.quantity,
    unitPrice: { amount: unit, currency },
    lineTotal: { amount: raw.extended_list_price, currency },
    imageUrl: raw.image_url,
  };
};

export const mapBcCart = (raw: BCCartResponse['data']): Cart => {
  const currency = raw.currency.code;
  return {
    id: raw.cart_id,
    currency,
    updatedAt: raw.updated_time,
    items: raw.line_items.map((li) => toCartItem(li, currency)),
    totals: {
      subtotal: { amount: raw.base_amount ?? raw.cart_amount, currency },
      discount:
        raw.discount_amount !== undefined ? { amount: raw.discount_amount, currency } : undefined,
      tax: raw.tax_amount !== undefined ? { amount: raw.tax_amount, currency } : undefined,
      shipping:
        raw.shipping_amount !== undefined ? { amount: raw.shipping_amount, currency } : undefined,
      total: { amount: raw.cart_amount, currency },
    },
  };
};
