import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { NotFoundError, type OrderScope } from '@b2b/domain';
import { customerAccountQuery } from '../shopify/customerAccountClient';
import { adminQuery } from '../shopify/adminClient';
import { mapShopifyOrder, type ShopifyOrderNode } from '../shopify/mappers/orderMapper';
import type { AppVariables } from '../middleware/types';

export const orderRoutes = new Hono<{ Variables: AppVariables }>();

const listSchema = z.object({
  scope: z.enum(['mine', 'company']).default('mine'),
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

const ORDER_FIELDS = `
  id name processedAt fulfillmentStatus financialStatus poNumber
  totalPriceSet { presentmentMoney { amount currencyCode } }
  subtotalPriceSet { presentmentMoney { amount currencyCode } }
  lineItems(first: 50) {
    edges {
      node {
        id sku title quantity
        variant { id }
        originalUnitPriceSet { presentmentMoney { amount currencyCode } }
        originalTotalSet { presentmentMoney { amount currencyCode } }
      }
    }
  }
  shippingAddress { firstName lastName company address1 address2 city provinceCode zip countryCode phone }
  billingAddress { firstName lastName company address1 address2 city provinceCode zip countryCode phone }
  purchasingEntity { __typename ... on PurchasingCompany { company { id } location { id } } }
  customer { id }
`;

const MINE_ORDERS_QUERY = `
  query MyOrders($first: Int!) {
    customer { orders(first: $first) { edges { node { ${ORDER_FIELDS} } } } }
  }
`;

const COMPANY_ORDERS_QUERY = `
  query CompanyOrders($first: Int!, $query: String!) {
    orders(first: $first, query: $query) {
      edges { node { ${ORDER_FIELDS} } }
    }
  }
`;

interface MineOrdersData {
  customer: { orders: { edges: Array<{ node: ShopifyOrderNode }> } };
}
interface CompanyOrdersData {
  orders: { edges: Array<{ node: ShopifyOrderNode }> };
}

const list = async (
  auth: AppVariables['auth'],
  scope: OrderScope,
  pageSize: number,
  search?: string,
) => {
  if (!auth) throw new Error('unauthorized');
  if (scope === 'mine') {
    const d = await customerAccountQuery<MineOrdersData>(
      auth.caaAccessToken,
      MINE_ORDERS_QUERY,
      { first: pageSize },
    );
    return d.customer.orders.edges.map((e) => mapShopifyOrder(e.node));
  }
  const filter = [
    `company_location_id:${auth.location?.shopifyLocationGid ?? auth.company.shopifyCompanyGid}`,
    search ? `name:*${search}*` : '',
  ].filter(Boolean).join(' ');
  const d = await adminQuery<CompanyOrdersData>(COMPANY_ORDERS_QUERY, { first: pageSize, query: filter });
  return d.orders.edges.map((e) => mapShopifyOrder(e.node));
};

orderRoutes.get('/orders', zValidator('query', listSchema), async (c) => {
  const { scope, pageSize, search } = c.req.valid('query');
  const items = await list(c.var.auth, scope, pageSize, search);
  return c.json({
    items, page: 1, pageSize, totalItems: items.length, totalPages: 1,
  });
});

orderRoutes.get('/orders/:id', async (c) => {
  const id = c.req.param('id');
  const auth = c.var.auth!;
  // Try CAA first; fall back to admin.
  try {
    const d = await customerAccountQuery<{ customer: { order: ShopifyOrderNode | null } }>(
      auth.caaAccessToken,
      `query OneOrder($id: ID!) { customer { order(id: $id) { ${ORDER_FIELDS} } } }`,
      { id },
    );
    if (d.customer.order) return c.json(mapShopifyOrder(d.customer.order));
  } catch {
    // fall through
  }
  const d = await adminQuery<{ order: ShopifyOrderNode | null }>(
    `query OneOrder($id: ID!) { order(id: $id) { ${ORDER_FIELDS} } }`,
    { id },
  );
  if (!d.order) throw new NotFoundError('Order', id);
  return c.json(mapShopifyOrder(d.order));
});

orderRoutes.post('/orders/:id/reorder', async (c) => {
  // Compose: read order lines via Admin; create a new Storefront cart
  // with those lines via cart routes. v1 returns a placeholder cartId
  // wired through cart create; full implementation in apps/server/src/portal/cart.
  throw new NotFoundError('reorder', 'not-implemented-in-v1');
});
