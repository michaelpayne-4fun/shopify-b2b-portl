import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { NotFoundError, type OrderScope } from '@b2b/domain';
import { customerAccountQuery } from '../shopify/customerAccountClient';
import { adminQuery } from '../shopify/adminClient';
import { mapShopifyOrder, type ShopifyOrderNode } from '../shopify/mappers/orderMapper';
import type { AppVariables } from '../middleware/types';
import { createCartFromLines } from '../portal/cart/cartCreate';

export const orderRoutes = new Hono<{ Variables: AppVariables }>();

const listSchema = z.object({
  scope: z.enum(['mine', 'company']).default('mine'),
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

// ---------- CAA-specific order shapes ----------
interface CaaMoney { amount: string; currencyCode: string }

interface CaaLineItem {
  id: string;
  name: string;
  quantity: number;
  variantId?: string | null;
  currentTotalPrice?: CaaMoney | null;
  unitPrice?: { price: CaaMoney } | null;
}

interface CaaOrderNode {
  id: string;
  name: string;
  processedAt: string;
  financialStatus?: string | null;
  fulfillmentStatus?: string | null;
  totalPrice: CaaMoney;
  subtotal?: CaaMoney | null;
  lineItems: { edges: Array<{ node: CaaLineItem }> };
  shippingAddress?: {
    firstName?: string | null; lastName?: string | null;
    address1?: string | null; address2?: string | null;
    city?: string | null; zoneCode?: string | null;
    zip?: string | null; territoryCode?: string | null; phone?: string | null;
  } | null;
  billingAddress?: {
    firstName?: string | null; lastName?: string | null;
    address1?: string | null; address2?: string | null;
    city?: string | null; zoneCode?: string | null;
    zip?: string | null; territoryCode?: string | null; phone?: string | null;
  } | null;
}

const normalizeCaaOrder = (caa: CaaOrderNode): ShopifyOrderNode => {
  const toMoney = (m: CaaMoney) => ({ presentmentMoney: m });
  const currency = caa.totalPrice.currencyCode;
  const zero: CaaMoney = { amount: '0', currencyCode: currency };
  return {
    id: caa.id,
    name: caa.name,
    processedAt: caa.processedAt,
    financialStatus: caa.financialStatus ?? null,
    fulfillmentStatus: caa.fulfillmentStatus ?? null,
    totalPriceSet: toMoney(caa.totalPrice),
    subtotalPriceSet: toMoney(caa.subtotal ?? zero),
    lineItems: {
      edges: caa.lineItems.edges.map(({ node }) => {
        const unit = node.unitPrice?.price ?? zero;
        const total = node.currentTotalPrice ?? {
          amount: String(Number(unit.amount) * node.quantity),
          currencyCode: unit.currencyCode,
        };
        return {
          node: {
            id: node.id,
            title: node.name,
            quantity: node.quantity,
            // CAA's LineItem doesn't expose variant SKU directly; we
            // keep null here and let the reorder flow's Admin fallback
            // resolve full variant detail when needed.
            sku: null,
            variant: node.variantId ? { id: node.variantId } : null,
            originalUnitPriceSet: toMoney(unit),
            originalTotalSet: toMoney(total),
          },
        };
      }),
    },
    poNumber: null,
    purchasingEntity: null,
    customer: null,
    shippingAddress: caa.shippingAddress ? {
      firstName: caa.shippingAddress.firstName,
      lastName: caa.shippingAddress.lastName,
      address1: caa.shippingAddress.address1,
      city: caa.shippingAddress.city,
      zoneCode: caa.shippingAddress.zoneCode,
      zip: caa.shippingAddress.zip,
      territoryCode: caa.shippingAddress.territoryCode,
      phoneNumber: caa.shippingAddress.phone,
    } : null,
    billingAddress: caa.billingAddress ? {
      firstName: caa.billingAddress.firstName,
      lastName: caa.billingAddress.lastName,
      address1: caa.billingAddress.address1,
      city: caa.billingAddress.city,
      zoneCode: caa.billingAddress.zoneCode,
      zip: caa.billingAddress.zip,
      territoryCode: caa.billingAddress.territoryCode,
      phoneNumber: caa.billingAddress.phone,
    } : null,
  };
};

const CAA_ORDER_FIELDS = `
  id name processedAt fulfillmentStatus financialStatus
  totalPrice { amount currencyCode }
  subtotal { amount currencyCode }
  lineItems(first: 50) {
    edges {
      node {
        id name quantity variantId
        currentTotalPrice { amount currencyCode }
        unitPrice { price { amount currencyCode } }
      }
    }
  }
  shippingAddress {
    firstName lastName address1 address2 city zoneCode zip territoryCode
    phone: phoneNumber
  }
  billingAddress {
    firstName lastName address1 address2 city zoneCode zip territoryCode
    phone: phoneNumber
  }
`;


const ADMIN_ORDER_FIELDS = `
  id name processedAt poNumber
  fulfillmentStatus: displayFulfillmentStatus
  financialStatus: displayFinancialStatus
  totalPriceSet { presentmentMoney { amount currencyCode } }
  subtotalPriceSet { presentmentMoney { amount currencyCode } }
  lineItems(first: 50) {
    edges {
      node {
        id title quantity sku
        variant { id }
        originalUnitPriceSet { presentmentMoney { amount currencyCode } }
        originalTotalSet { presentmentMoney { amount currencyCode } }
      }
    }
  }
  shippingAddress {
    firstName lastName company address1 address2 city provinceCode zip countryCodeV2 phone
  }
  billingAddress {
    firstName lastName company address1 address2 city provinceCode zip countryCodeV2 phone
  }
  purchasingEntity { __typename ... on PurchasingCompany { company { id } location { id } } }
  customer { id }
`;

const MINE_ORDERS_QUERY = `
  query MyOrders($first: Int!) {
    customer { orders(first: $first) { edges { node { ${CAA_ORDER_FIELDS} } } } }
  }
`;

const COMPANY_ORDERS_QUERY = `
  query CompanyOrders($first: Int!, $query: String!) {
    orders(first: $first, query: $query) {
      edges { node { ${ADMIN_ORDER_FIELDS} } }
    }
  }
`;

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
    try {
      const d = await customerAccountQuery<{ customer: { orders: { edges: Array<{ node: CaaOrderNode }> } } }>(
        auth.caaAccessToken,
        MINE_ORDERS_QUERY,
        { first: pageSize },
      );
      return d.customer.orders.edges.map((e) => mapShopifyOrder(normalizeCaaOrder(e.node)));
    } catch {
      // CAA unavailable or token expired — fall through to Admin API
    }
    // Admin fallback: filter by customer email is unreliable; use company scope
    // scoped to this contact's location as a best-effort mine approximation
    const buyerFilter = `company_location_id:${auth.location?.shopifyLocationGid ?? auth.company.shopifyCompanyGid}`;
    const d = await adminQuery<CompanyOrdersData>(COMPANY_ORDERS_QUERY, { first: pageSize, query: buyerFilter });
    return d.orders.edges.map((e) => mapShopifyOrder(e.node));
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

// Single-order CAA query — Customer.order(id:) does NOT exist in the CAA
// schema (verified with validate_graphql_codeblocks); the top-level
// order(id:) query is the right surface and is scoped to the buyer
// automatically by the CAA access token.
const CAA_ONE_ORDER_QUERY = `query OneOrder($id: ID!) { order(id: $id) { ${CAA_ORDER_FIELDS} } }`;
const ADMIN_ONE_ORDER_QUERY = `query OneOrder($id: ID!) { order(id: $id) { ${ADMIN_ORDER_FIELDS} } }`;

orderRoutes.get('/orders/:id', async (c) => {
  const id = c.req.param('id');
  const auth = c.var.auth!;
  // Try CAA first; fall back to admin.
  try {
    const d = await customerAccountQuery<{ order: CaaOrderNode | null }>(
      auth.caaAccessToken,
      CAA_ONE_ORDER_QUERY,
      { id },
    );
    if (d.order) return c.json(mapShopifyOrder(normalizeCaaOrder(d.order)));
  } catch {
    // fall through
  }
  const d = await adminQuery<{ order: ShopifyOrderNode | null }>(
    ADMIN_ONE_ORDER_QUERY,
    { id },
  );
  if (!d.order) throw new NotFoundError('Order', id);
  return c.json(mapShopifyOrder(d.order));
});

orderRoutes.post('/orders/:id/reorder', async (c) => {
  const id = c.req.param('id');
  const auth = c.var.auth!;

  // Reuse the same lookup used by GET /orders/:id (CAA preferred, Admin fallback).
  let node: ShopifyOrderNode | null = null;
  try {
    const d = await customerAccountQuery<{ order: CaaOrderNode | null }>(
      auth.caaAccessToken,
      CAA_ONE_ORDER_QUERY,
      { id },
    );
    node = d.order ? normalizeCaaOrder(d.order) : null;
  } catch {
    // fall through to admin
  }
  if (!node) {
    const d = await adminQuery<{ order: ShopifyOrderNode | null }>(
      ADMIN_ONE_ORDER_QUERY,
      { id },
    );
    node = d.order;
  }
  if (!node) throw new NotFoundError('Order', id);

  const order = mapShopifyOrder(node);
  const lines: { merchandiseId: string; quantity: number }[] = [];
  const skippedLines: { sku: string; reason: string }[] = [];
  for (const line of order.lines) {
    if (!line.variantId) {
      skippedLines.push({ sku: line.sku, reason: 'variant_unknown' });
      continue;
    }
    lines.push({ merchandiseId: line.variantId, quantity: line.quantity });
  }
  if (lines.length === 0) {
    throw new NotFoundError('reorder', 'no_reorderable_lines');
  }

  const cartId = await createCartFromLines({
    db: c.var.db,
    sessionId: auth.sessionId,
    buyerAccessToken: auth.caaAccessToken,
    companyLocationGid: auth.location?.shopifyLocationGid,
    lines,
  });
  return c.json({ cartId, skippedLines });
});
