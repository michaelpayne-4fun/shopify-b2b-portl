import type { CheckoutService } from '@/commerce/interfaces';
import type { BuyerContext, CheckoutHandoff } from '@/domain/models';
import type { BigCommerceConfig } from '../config';

export class BigCommerceCheckoutService implements CheckoutService {
  constructor(private readonly config: BigCommerceConfig) {}

  async beginCheckout(_ctx: BuyerContext, cartId: string): Promise<CheckoutHandoff> {
    // BC checkout is hosted by the storefront. We compute a redirect URL and
    // let the UI navigate to it; cookies on the storefront origin tie the
    // cart back to the active session.
    const base = this.config.storefrontUrl.replace(/\/$/, '');
    return { url: `${base}/checkout?cartId=${encodeURIComponent(cartId)}` };
  }
}
