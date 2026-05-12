import { bff } from './bffClient';
import type { AddCartItemInput, Cart } from '@b2b/domain';

export const getCart = () => bff.get<Cart>('/cart');
export const addToCart = (input: AddCartItemInput) => bff.post<Cart>('/cart/items', input);
export const updateCartItem = (id: string, quantity: number) =>
  bff.patch<Cart>(`/cart/items/${encodeURIComponent(id)}`, { quantity });
export const removeCartItem = (id: string) =>
  bff.delete<Cart>(`/cart/items/${encodeURIComponent(id)}`);
export const clearCart = () => bff.delete<void>('/cart');
export const beginCheckout = () => bff.post<{ url: string }>('/cart/checkout');
