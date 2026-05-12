import type { AddCartItemInput, BuyerContext, Cart } from '@/domain/models';

export interface CartService {
  getCart(context: BuyerContext): Promise<Cart>;
  addItem(context: BuyerContext, item: AddCartItemInput): Promise<Cart>;
  updateItem(context: BuyerContext, itemId: string, quantity: number): Promise<Cart>;
  removeItem(context: BuyerContext, itemId: string): Promise<Cart>;
  clearCart(context: BuyerContext): Promise<void>;
}
