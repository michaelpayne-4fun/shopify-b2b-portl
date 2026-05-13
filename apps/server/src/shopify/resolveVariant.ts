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

/**
 * Resolve a single SKU to a variant ID via the Storefront API.
 *
 * Shopify's storefront `query: sku:XYZ` is tokenized: searching for
 * "WIDGET-003" can return WIDGET-001 because they share the WIDGET
 * token. We fetch up to 10 candidate products and pick the variant
 * whose SKU is exactly the one requested. Returns null if no exact
 * match is found.
 *
 * Centralised here so cart, shopping-list bulk-add, and any future
 * SKU-based lookups stay consistent with /catalog/sku/:sku.
 */
export const resolveVariantIdBySku = async (
  sku: string,
  buyerAccessToken: string,
): Promise<string | null> => {
  const data = await storefrontQuery<ProductsBySkuResult>(
    `query Sku($q: String!) {
       products(query: $q, first: 10) {
         edges { node { variants(first: 25) { edges { node { id sku } } } } }
       }
     }`,
    { q: `sku:${sku}` },
    { buyerAccessToken },
  );
  for (const productEdge of data.products.edges) {
    for (const variantEdge of productEdge.node.variants.edges) {
      if (variantEdge.node.sku === sku) return variantEdge.node.id;
    }
  }
  return null;
};

/**
 * Batch-resolve a list of SKUs to {variantId, price} via a single
 * Storefront query. Uses an `OR`-joined `sku:` filter and then
 * exact-matches in code (since the tokeniser otherwise drags in
 * unrelated products that share a name token). Missing SKUs are
 * silently absent from the returned map; callers should treat
 * absence as "not in this buyer's catalog".
 */
export const resolveVariantsBySkus = async (
  skus: string[],
  buyerAccessToken: string,
): Promise<Map<string, VariantSummary>> => {
  const out = new Map<string, VariantSummary>();
  if (skus.length === 0) return out;
  // De-dupe to keep the query payload small.
  const unique = Array.from(new Set(skus));
  // Cap per-query to keep Shopify's query-string length comfortable.
  // 25 SKUs * (~30 chars each) is ~750 chars — well under the limit.
  const CHUNK = 25;
  for (let i = 0; i < unique.length; i += CHUNK) {
    const slice = unique.slice(i, i + CHUNK);
    const filter = slice.map((s) => `sku:${s}`).join(' OR ');
    const data = await storefrontQuery<ProductsBySkuResult>(
      `query VariantsBySkus($q: String!, $first: Int!) {
         products(query: $q, first: $first) {
           edges { node { variants(first: 50) { edges { node { id sku price { amount currencyCode } } } } } }
         }
       }`,
      { q: filter, first: Math.max(slice.length * 2, 10) },
      { buyerAccessToken },
    );
    for (const productEdge of data.products.edges) {
      for (const variantEdge of productEdge.node.variants.edges) {
        const v = variantEdge.node;
        if (!v.sku || out.has(v.sku)) continue;
        if (!slice.includes(v.sku)) continue;
        out.set(v.sku, {
          variantId: v.id,
          price: v.price
            ? { amount: Number(v.price.amount), currency: v.price.currencyCode }
            : { amount: 0, currency: 'USD' },
        });
      }
    }
  }
  return out;
};
