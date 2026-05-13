import { env } from '../env';
import type { GraphQLResult } from './storefrontClient';

/**
 * Customer Account API. Each call must carry the buyer's CAA access
 * token (issued during the OAuth flow and stored on the session row).
 */
const STORE_ID = '98578891115';

const url = () =>
  `https://shopify.com/${STORE_ID}/account/customer/api/${env().SHOPIFY_STOREFRONT_API_VERSION}/graphql`;

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
      origin: env().PUBLIC_PORTAL_URL,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`CAA ${res.status} ${res.statusText}: ${text}`);
  }
  const body = (await res.json()) as GraphQLResult<T>;
  if (body.errors?.length) throw new Error(`CAA: ${body.errors.map((e) => e.message).join('; ')}`);
  return body.data as T;
};
