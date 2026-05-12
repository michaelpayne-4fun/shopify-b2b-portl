import type { AddCartItemInput, BuyerContext, Cart } from '@/domain/models';
import type { CartService } from '@/commerce/interfaces';
import { NotFoundError, ValidationError } from '@/domain/errors';
import { getStore } from '../data/store';

const recalcTotals = (cart: Cart): Cart => {
  const subtotal = cart.items.reduce((sum, item) => sum + item.lineTotal.amount, 0);
  const totals = {
    subtotal: { amount: subtotal, currency: cart.currency },
    total: { amount: subtotal, currency: cart.currency },
  };
  return { ...cart, totals, updatedAt: new Date().toISOString() };
};

export class MockCartService implements CartService {
  async getCart(_ctx: BuyerContext): Promise<Cart> {
    return getStore().cart;
  }

  async addItem(_ctx: BuyerContext, input: AddCartItemInput): Promise<Cart> {
    if (input.quantity <= 0) throw new ValidationError('Quantity must be positive');
    const store = getStore();
    const product = store.products.find((p) => p.sku.toLowerCase() === input.sku.toLowerCase());
    if (!product) throw new NotFoundError('Product', input.sku);
    const variant =
      product.variants.find((v) => v.id === input.variantId) ??
      product.variants.find((v) => v.id === product.defaultVariantId)!;

    const existing = store.cart.items.find((it) => it.variantId === variant.id);
    if (existing) {
      existing.quantity += input.quantity;
      existing.lineTotal = {
        amount: existing.unitPrice.amount * existing.quantity,
        currency: existing.unitPrice.currency,
      };
    } else {
      store.cart.items.push({
        id: `ci-${store.cart.items.length + 1}-${Date.now()}`,
        variantId: variant.id,
        sku: variant.sku,
        name: product.name,
        quantity: input.quantity,
        unitPrice: variant.price,
        lineTotal: {
          amount: variant.price.amount * input.quantity,
          currency: variant.price.currency,
        },
        imageUrl: product.images[0]?.url,
      });
    }
    store.cart = recalcTotals(store.cart);
    return store.cart;
  }

  async updateItem(_ctx: BuyerContext, itemId: string, quantity: number): Promise<Cart> {
    const store = getStore();
    const item = store.cart.items.find((it) => it.id === itemId);
    if (!item) throw new NotFoundError('CartItem', itemId);
    if (quantity <= 0) {
      store.cart.items = store.cart.items.filter((it) => it.id !== itemId);
    } else {
      item.quantity = quantity;
      item.lineTotal = {
        amount: item.unitPrice.amount * quantity,
        currency: item.unitPrice.currency,
      };
    }
    store.cart = recalcTotals(store.cart);
    return store.cart;
  }

  async removeItem(_ctx: BuyerContext, itemId: string): Promise<Cart> {
    const store = getStore();
    store.cart.items = store.cart.items.filter((it) => it.id !== itemId);
    store.cart = recalcTotals(store.cart);
    return store.cart;
  }

  async clearCart(_ctx: BuyerContext): Promise<void> {
    const store = getStore();
    store.cart.items = [];
    store.cart = recalcTotals(store.cart);
  }
}
