import { env } from '../env';
import type { GraphQLResult } from './storefrontClient';

const url = () =>
  `https://${env().SHOPIFY_SHOP_DOMAIN}/admin/api/${env().SHOPIFY_ADMIN_API_VERSION}/graphql.json`;

export const adminQuery = async <T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> => {
  const res = await fetch(url(), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-shopify-access-token': env().SHOPIFY_ADMIN_ACCESS_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Admin API ${res.status} ${res.statusText}`);
  const body = (await res.json()) as GraphQLResult<T>;
  if (body.errors?.length) throw new Error(`Admin API: ${body.errors.map((e) => e.message).join('; ')}`);
  return body.data as T;
};
