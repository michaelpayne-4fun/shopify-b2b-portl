import { storefrontQuery } from './storefrontClient';

export interface VariantSummary {
  variantId: string;
  price: { amount: number; currency: string };
}

interface ProductsBySkuResult {
  products: {
    edges: Array<{
      node: {
        variants: {
          edges: Array<{
            node: {
              id: string;
              sku: string | null;
              price?: { amount: string; currencyCode: string } | null;
            };
          }>;
        };
      };
    }>;
  };
}

export interface BuyerContext {
  companyLocationId: string;
  customerAccessToken: string;
}

/**
 * Resolve a single SKU to a variant ID via the Storefront API.
 *
 * Uses @inContext(buyer:) so the search is scoped to the buyer's B2B
 * catalog — passing the buyer access token via header alone reaches
 * a default scope that often excludes catalog-only products.
 *
 * Shopify's storefront `query: sku:XYZ` is tokenized: searching for
 * "WIDGET-003" can return WIDGET-001 because they share the WIDGET
 * token. We fetch up to 10 candidate products and pick the variant
 * whose SKU is exactly the one requested. Returns null if no exact
 * match is found.
 */
export const resolveVariantIdBySku = async (
  sku: string,
  ctx: BuyerContext,
): Promise<string | null> => {
  const data = await storefrontQuery<ProductsBySkuResult>(
    `query Sku(
       $q: String!,
       $companyLocationId: ID!,
       $customerAccessToken: String!
     ) @inContext(buyer: { companyLocationId: $companyLocationId, customerAccessToken: $customerAccessToken }) {
       products(query: $q, first: 10) {
         edges { node { variants(first: 25) { edges { node { id sku } } } } }
       }
     }`,
    { q: `sku:${sku}`, ...ctx },
    { buyerAccessToken: ctx.customerAccessToken },
  );
  for (const productEdge of data.products.edges) {
    for (const variantEdge of productEdge.node.variants.edges) {
      if (variantEdge.node.sku === sku) return variantEdge.node.id;
    }
  }
  return null;
};

/**
 * Resolve a list of SKUs to {variantId, price} via Storefront. One
 * query per SKU in parallel, each scoped to the buyer's catalog via
 * @inContext(buyer:). An earlier batched `OR`-joined `sku:` filter
 * returned empty results even for SKUs known to be in the buyer's
 * catalog, so we deliberately do N small queries instead of one big
 * one. Per-SKU errors are logged and the SKU is skipped.
 */
export const resolveVariantsBySkus = async (
  skus: string[],
  ctx: BuyerContext,
): Promise<Map<string, VariantSummary>> => {
  const out = new Map<string, VariantSummary>();
  const unique = Array.from(new Set(skus.filter(Boolean)));
  if (unique.length === 0) return out;
  await Promise.all(
    unique.map(async (sku) => {
      try {
        const data = await storefrontQuery<ProductsBySkuResult>(
          `query Sku(
             $q: String!,
             $companyLocationId: ID!,
             $customerAccessToken: String!
           ) @inContext(buyer: { companyLocationId: $companyLocationId, customerAccessToken: $customerAccessToken }) {
             products(query: $q, first: 10) {
               edges {
                 node {
                   variants(first: 25) {
                     edges { node { id sku price { amount currencyCode } } }
                   }
                 }
               }
             }
           }`,
          { q: `sku:${sku}`, ...ctx },
          { buyerAccessToken: ctx.customerAccessToken },
        );
        for (const productEdge of data.products.edges) {
          for (const variantEdge of productEdge.node.variants.edges) {
            const v = variantEdge.node;
            if (v.sku !== sku) continue;
            if (!v.price) continue;
            out.set(sku, {
              variantId: v.id,
              price: { amount: Number(v.price.amount), currency: v.price.currencyCode },
            });
            return;
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[resolveVariantsBySkus] sku=${sku} lookup failed:`, err);
      }
    }),
  );
  return out;
};
