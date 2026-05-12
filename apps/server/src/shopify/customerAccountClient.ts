import { env } from '../env';
import type { GraphQLResult } from './storefrontClient';

/**
 * Customer Account API. Each call must carry the buyer's CAA access
 * token (issued during the OAuth flow and stored on the session row).
 */
const url = () =>
  `https://${env().SHOPIFY_SHOP_DOMAIN}/customer/api/${env().SHOPIFY_STOREFRONT_API_VERSION}/graphql`;

export const customerAccountQuery = async <T>(
  accessToken: string,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> => {
  const res = await fetch(url(), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`CAA ${res.status} ${res.statusText}`);
  const body = (await res.json()) as GraphQLResult<T>;
  if (body.errors?.length) throw new Error(`CAA: ${body.errors.map((e) => e.message).join('; ')}`);
  return body.data as T;
};
