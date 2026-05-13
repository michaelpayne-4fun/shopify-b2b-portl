import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { NotFoundError } from '@b2b/domain';
import { customerAccountQuery } from '../shopify/customerAccountClient';
import { mapShopifyAddress, type ShopifyMailingAddress } from '../shopify/mappers/addressMapper';
import type { AppVariables } from '../middleware/types';

export const addressRoutes = new Hono<{ Variables: AppVariables }>();

const ADDR_FIELDS = `id firstName lastName company address1 address2 city zoneCode zip territoryCode phoneNumber`;

interface PersonalAddressesData {
  customer: {
    addresses: { edges: Array<{ node: ShopifyMailingAddress }> };
    defaultAddress: { id: string } | null;
  };
}

const listSchema = z.object({
  scope: z.enum(['personal', 'company']).default('personal'),
});

addressRoutes.get('/addresses', zValidator('query', listSchema), async (c) => {
  const { scope } = c.req.valid('query');
  const auth = c.var.auth!;
  if (scope === 'personal') {
    const d = await customerAccountQuery<PersonalAddressesData>(
      auth.caaAccessToken,
      `query MyAddresses { customer { defaultAddress { id } addresses(first: 50) { edges { node { ${ADDR_FIELDS} } } } } }`,
    );
    const defaultId = d.customer.defaultAddress?.id;
    const items = d.customer.addresses.edges.map((e) =>
      mapShopifyAddress(e.node, {
        scope: 'personal',
        isDefaultBilling: e.node.id === defaultId,
        isDefaultShipping: e.node.id === defaultId,
      }),
    );
    return c.json({ items, page: 1, pageSize: items.length, totalItems: items.length, totalPages: 1 });
  }
  // Company-scope addresses live on the Shopify CompanyLocation. We
  // surface each location's shipping address as a company-scope
  // entry. Editing those requires Admin API mutations not covered in v1.
  const items = auth.company.locations.map((l) => ({ ...l.address, scope: 'company' as const }));
  return c.json({ items, page: 1, pageSize: items.length, totalItems: items.length, totalPages: 1 });
});

// v1 keeps personal-address writes deferred to Shopify's hosted account
// pages (CAA does support them but the customer-account UI handles it
// natively and avoids form duplication).
addressRoutes.post('/addresses', () => {
  throw new NotFoundError('addresses.create', 'not-implemented-in-v1');
});
addressRoutes.patch('/addresses/:id', () => {
  throw new NotFoundError('addresses.update', 'not-implemented-in-v1');
});
addressRoutes.delete('/addresses/:id', () => {
  throw new NotFoundError('addresses.delete', 'not-implemented-in-v1');
});
