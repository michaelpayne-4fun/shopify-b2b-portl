import { storefrontQuery } from './storefrontClient';

interface ProductsBySkuResult {
  products: {
    edges: Array<{
      node: {
        variants: {
          edges: Array<{ node: { id: string; sku: string | null } }>;
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
