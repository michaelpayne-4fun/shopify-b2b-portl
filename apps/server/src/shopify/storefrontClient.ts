import { env } from '../env';

interface Options {
  buyerAccessToken?: string;
  companyLocationGid?: string;
}

export interface GraphQLResult<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

const url = () =>
  `https://${env().SHOPIFY_SHOP_DOMAIN}/api/${env().SHOPIFY_STOREFRONT_API_VERSION}/graphql.json`;

export const storefrontQuery = async <T>(
  query: string,
  variables: Record<string, unknown>,
  opts: Options = {},
): Promise<T> => {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-shopify-storefront-access-token': env().SHOPIFY_STOREFRONT_ACCESS_TOKEN,
  };
  if (opts.buyerAccessToken) {
    headers['shopify-storefront-buyer-access-token'] = opts.buyerAccessToken;
  }
  const res = await fetch(url(), {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Storefront API ${res.status} ${res.statusText}`);
  const body = (await res.json()) as GraphQLResult<T>;
  if (body.errors?.length) throw new Error(`Storefront API: ${body.errors.map((e) => e.message).join('; ')}`);
  return body.data as T;
};
