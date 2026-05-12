import type { BuyerContext, CheckoutHandoff } from '@/domain/models';

export interface CheckoutService {
  beginCheckout(context: BuyerContext, cartId: string): Promise<CheckoutHandoff>;
}
