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

// Storefront's @inContext(buyer:) directive needs both the buyer's
// CAA access token and the buyer's company location GID to scope the
// query to the B2B catalog. Passing the token via header alone reaches
// a default scope that excludes most catalog-only products.
const buyerCtx = (auth: NonNullable<AppVariables['auth']>) => ({
  companyLocationId: auth.location?.shopifyLocationGid ?? auth.company.shopifyCompanyGid,
  customerAccessToken: auth.caaAccessToken,
});

catalogRoutes.get('/catalog/search', zValidator('query', searchSchema), async (c) => {
  const { q, pageSize } = c.req.valid('query');
  const auth = c.var.auth!;
  const data = await storefrontQuery<ProductsSearchData>(
    PRODUCTS_SEARCH_QUERY,
    { query: q, first: pageSize, after: null, ...buyerCtx(auth) },
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
  // Plain text query (not `sku:${sku}`). The field-prefixed form
  // intermittently 5xx'd for SKUs like COMP-001/WIDGET-003 even when
  // the variants were demonstrably in the buyer's catalog and price
  // list, while the autocomplete (text search via /catalog/search)
  // returned them fine. Same query path as /catalog/search; the
  // exact-SKU post-filter below keeps results correct when text-
  // tokenization pulls in siblings (e.g., "WIDGET-001" can also
  // surface WIDGET-002 by shared "WIDGET" token).
  const data = await storefrontQuery<ProductsSearchData>(
    PRODUCTS_SEARCH_QUERY,
    { query: sku, first: 25, after: null, ...buyerCtx(auth) },
    { buyerAccessToken: auth.caaAccessToken },
  );
  for (const edge of data.products.edges) {
    // Per-edge try/catch: a single bad sibling product (e.g., a
    // variant Storefront returns with malformed price under buyer
    // context) shouldn't 500 the whole lookup. Log and skip — keep
    // iterating to find the exact-SKU match.
    let product;
    try {
      product = mapShopifyProduct(edge.node);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        `[catalog/sku] sku=${sku} mapShopifyProduct failed for product=${edge.node?.id}:`,
        err instanceof Error ? err.message : err,
      );
      continue;
    }
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
