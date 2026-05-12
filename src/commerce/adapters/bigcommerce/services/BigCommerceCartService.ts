import type { AddCartItemInput, BuyerContext, Cart } from '@/domain/models';
import type { CartService } from '@/commerce/interfaces';
import type { StorefrontClient } from '../client/storefrontClient';
import type { BCCartResponse } from '../types/responses';
import { mapBcCart } from '../mappers/cartMapper';

export class BigCommerceCartService implements CartService {
  constructor(private readonly client: StorefrontClient) {}

  private async fetchActiveCart(): Promise<Cart> {
    const resp = await this.client.http.request<BCCartResponse>({
      url: '/api/storefront/carts',
    });
    return mapBcCart(resp.data);
  }

  async getCart(_ctx: BuyerContext): Promise<Cart> {
    return this.fetchActiveCart();
  }

  async addItem(_ctx: BuyerContext, input: AddCartItemInput): Promise<Cart> {
    const current = await this.fetchActiveCart();
    const resp = await this.client.http.request<BCCartResponse>({
      url: `/api/storefront/carts/${encodeURIComponent(current.id)}/items`,
      method: 'POST',
      body: {
        line_items: [
          { sku: input.sku, variant_id: input.variantId, quantity: input.quantity },
        ],
      },
    });
    return mapBcCart(resp.data);
  }

  async updateItem(_ctx: BuyerContext, itemId: string, quantity: number): Promise<Cart> {
    const current = await this.fetchActiveCart();
    const resp = await this.client.http.request<BCCartResponse>({
      url: `/api/storefront/carts/${encodeURIComponent(current.id)}/items/${encodeURIComponent(itemId)}`,
      method: 'PUT',
      body: { quantity },
    });
    return mapBcCart(resp.data);
  }

  async removeItem(_ctx: BuyerContext, itemId: string): Promise<Cart> {
    const current = await this.fetchActiveCart();
    const resp = await this.client.http.request<BCCartResponse>({
      url: `/api/storefront/carts/${encodeURIComponent(current.id)}/items/${encodeURIComponent(itemId)}`,
      method: 'DELETE',
    });
    return mapBcCart(resp.data);
  }

  async clearCart(_ctx: BuyerContext): Promise<void> {
    const current = await this.fetchActiveCart();
    await this.client.http.request<void>({
      url: `/api/storefront/carts/${encodeURIComponent(current.id)}`,
      method: 'DELETE',
    });
  }
}
