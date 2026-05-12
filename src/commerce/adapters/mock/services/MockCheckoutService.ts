import type { CheckoutService } from '@/commerce/interfaces';
import type { BuyerContext, CheckoutHandoff } from '@/domain/models';

export class MockCheckoutService implements CheckoutService {
  async beginCheckout(_ctx: BuyerContext, cartId: string): Promise<CheckoutHandoff> {
    return { url: `#/mock-checkout?cart=${encodeURIComponent(cartId)}` };
  }
}
