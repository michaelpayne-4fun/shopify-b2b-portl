import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { NotFoundError } from '@b2b/domain';
import { storefrontQuery } from '../shopify/storefrontClient';
import { PRODUCTS_SEARCH_QUERY } from '../shopify/queries';
import { mapShopifyProduct, type ShopifyProductNode } from '../shopify/mappers/productMapper';
import type { AppVariables } from '../middleware/types';

export const catalogRoutes = new Hono<{ Variables: AppVariables }>();

interface ProductsSearchData {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    edges: Array<{ node: ShopifyProductNode }>;
  };
}

const searchSchema = z.object({
  q: z.string().optional().default(''),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

catalogRoutes.get('/catalog/search', zValidator('query', searchSchema), async (c) => {
  const { q, pageSize } = c.req.valid('query');
  const auth = c.var.auth!;
  const data = await storefrontQuery<ProductsSearchData>(
    PRODUCTS_SEARCH_QUERY,
    { query: q, first: pageSize, after: null },
    { buyerAccessToken: auth.caaAccessToken },
  );
  const items = data.products.edges.map((e) => mapShopifyProduct(e.node));
  return c.json({
    items,
    page: 1,
    pageSize,
    totalItems: items.length,
    totalPages: 1, // Shopify uses cursors; v1 surfaces a single page.
  });
});

catalogRoutes.get('/catalog/sku/:sku', async (c) => {
  const sku = c.req.param('sku');
  const auth = c.var.auth!;
  const data = await storefrontQuery<ProductsSearchData>(
    PRODUCTS_SEARCH_QUERY,
    { query: `sku:${sku}`, first: 10, after: null },
    { buyerAccessToken: auth.caaAccessToken },
  );
  // Shopify's storefront search tokenises `sku:` queries, so
  // "sku:WIDGET-003" can return WIDGET-001 (shared "WIDGET" token).
  // Pick the product/variant whose SKU is exactly the one requested.
  for (const edge of data.products.edges) {
    const product = mapShopifyProduct(edge.node);
    const match = product.variants.find((v) => v.sku === sku);
    if (match) {
      return c.json({
        ...product,
        sku: match.sku,
        defaultVariantId: match.id,
        variants: [match, ...product.variants.filter((v) => v.id !== match.id)],
      });
    }
  }
  throw new NotFoundError('Product', sku);
});
