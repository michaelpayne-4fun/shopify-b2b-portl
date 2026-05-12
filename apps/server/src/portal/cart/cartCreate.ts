import type { Database } from '@b2b/db';
import { ValidationError } from '@b2b/domain';
import { storefrontQuery } from '../../shopify/storefrontClient';
import { CART_CREATE_MUTATION, renderCartQuery } from '../../shopify/queries';
import type { ShopifyCartResponse } from '../../shopify/mappers/cartMapper';
import { setCartId } from './cartStore';

export interface CartLine {
  merchandiseId: string;
  quantity: number;
}

interface CartCreateData {
  cartCreate: {
    cart: ShopifyCartResponse;
    userErrors: { field?: string[]; message: string }[];
  };
}

/**
 * Creates a fresh Storefront cart with the given lines + buyer
 * identity, persists the new cart GID on the session, and returns
 * the cart GID. Used by reorder and quote-convert.
 */
export const createCartFromLines = async (args: {
  db: Database;
  sessionId: string;
  buyerAccessToken: string;
  companyLocationGid?: string;
  lines: CartLine[];
}): Promise<string> => {
  if (args.lines.length === 0) {
    throw new ValidationError('Cannot create cart with zero lines');
  }
  const result = await storefrontQuery<CartCreateData>(
    renderCartQuery(CART_CREATE_MUTATION),
    {
      input: {
        lines: args.lines,
        buyerIdentity: args.companyLocationGid
          ? { companyLocationId: args.companyLocationGid }
          : undefined,
      },
    },
    { buyerAccessToken: args.buyerAccessToken },
  );
  if (result.cartCreate.userErrors.length) {
    throw new ValidationError(result.cartCreate.userErrors.map((e) => e.message).join('; '));
  }
  await setCartId(args.db, args.sessionId, result.cartCreate.cart.id);
  return result.cartCreate.cart.id;
};
