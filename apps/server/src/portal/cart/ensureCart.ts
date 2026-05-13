import { ValidationError } from '@b2b/domain';
import {
  CART_CREATE_MUTATION, CART_QUERY, renderCartQuery,
} from '../../shopify/queries';
import { storefrontQuery } from '../../shopify/storefrontClient';
import type { ShopifyCartResponse } from '../../shopify/mappers/cartMapper';
import { clearCartId, getCartId, setCartId } from './cartStore';

type Db = Parameters<typeof getCartId>[0];

/**
 * Return the current Storefront cart for this session, creating one
 * if needed. The cart is tied to the buyer's company location for
 * correct B2B pricing.
 */
export const ensureCart = async (
  db: Db,
  sessionId: string,
  buyerAccessToken: string,
  companyLocationId: string | undefined,
): Promise<ShopifyCartResponse> => {
  interface CartFetchData { cart: ShopifyCartResponse | null }
  interface CartCreateData { cartCreate: { cart: ShopifyCartResponse; userErrors: { field?: string[]; message: string }[] } }

  const existing = await getCartId(db, sessionId);
  if (existing) {
    const fetched = await storefrontQuery<CartFetchData>(
      renderCartQuery(CART_QUERY),
      { id: existing },
      { buyerAccessToken },
    );
    if (fetched.cart) return fetched.cart;
    await clearCartId(db, sessionId);
  }

  const result = await storefrontQuery<CartCreateData>(
    renderCartQuery(CART_CREATE_MUTATION),
    {
      input: {
        buyerIdentity: companyLocationId
          ? { companyLocationId, customerAccessToken: buyerAccessToken }
          : { customerAccessToken: buyerAccessToken },
      },
    },
    { buyerAccessToken },
  );
  if (result.cartCreate.userErrors.length) {
    throw new ValidationError(result.cartCreate.userErrors.map((e) => e.message).join('; '));
  }
  await setCartId(db, sessionId, result.cartCreate.cart.id);
  return result.cartCreate.cart;
};
