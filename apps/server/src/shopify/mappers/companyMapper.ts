import type { Company, CompanyLocation, CompanyStatus } from '@b2b/domain';
import { mapShopifyAddress, type ShopifyMailingAddress } from './addressMapper';

export interface ShopifyCompanyResponse {
  id: string;
  name: string;
  externalId?: string | null;
  lifetimeDuration?: string | null;
  locations: {
    edges: Array<{
      node: {
        id: string;
        name: string;
        shippingAddress?: ShopifyMailingAddress | null;
        billingAddress?: ShopifyMailingAddress | null;
        buyerExperienceConfiguration?: {
          checkoutToDraft?: boolean | null;
        } | null;
      };
    }>;
  };
}

const STATUS: CompanyStatus = 'approved'; // Shopify doesn't expose a "pending" state to us in this flow.

const toLocation = (node: ShopifyCompanyResponse['locations']['edges'][number]['node'], idx: number): CompanyLocation => ({
  id: node.id,
  name: node.name,
  isDefault: idx === 0,
  shopifyLocationGid: node.id,
  address: node.shippingAddress
    ? mapShopifyAddress(node.shippingAddress, { scope: 'company', label: node.name })
    : {
        id: '',
        scope: 'company',
        firstName: '',
        lastName: '',
        line1: '',
        city: '',
        region: '',
        postalCode: '',
        countryCode: '',
      },
});

export const mapShopifyCompany = (raw: ShopifyCompanyResponse): Company => {
  const locations = raw.locations.edges.map((edge, i) => toLocation(edge.node, i));
  return {
    id: raw.id,
    name: raw.name,
    status: STATUS,
    shopifyCompanyGid: raw.id,
    locations,
    defaultLocationId: locations[0]?.id,
  };
};
