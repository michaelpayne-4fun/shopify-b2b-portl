import type { Database } from '@b2b/db';
import type { Buyer, BuyerContext, Company } from '@b2b/domain';
import type { AuthContext } from '../middleware/types';
import { customerAccountQuery } from './customerAccountClient';
import { CUSTOMER_ME_QUERY, COMPANY_FOR_CUSTOMER_QUERY } from './queries';
import { mapShopifyCompany, type ShopifyCompanyResponse } from './mappers/companyMapper';
import { mapShopifyCustomer, type ShopifyCustomerResponse } from './mappers/customerMapper';
import { mapShopifyRoleToPermissions, isShopifyLocationAdmin } from './mappers/permissionMapper';
import { buildMergedRole } from '../auth/permissions';

interface SessionRow {
  id: string;
  shopifyCustomerId: string;
  shopifyCompanyGid: string;
  activeLocationGid: string | null;
  caaAccessToken: string;
}

type ShopifyLocationNode = ShopifyCompanyResponse['locations']['edges'][number]['node'];

interface CompanyContactNode {
  id: string;
  company: (Omit<ShopifyCompanyResponse, 'locations'> & {
    locations: {
      edges: Array<{
        node: ShopifyLocationNode & {
          roleAssignments: {
            edges: Array<{ node: { role: { name: string }; contact: { id: string } } }>;
          };
        };
      }>;
    };
  }) | null;
}

interface CompanyForCustomerData {
  customer: {
    id: string;
    companyContacts: { edges: Array<{ node: CompanyContactNode }> };
  };
}

/**
 * Builds the AuthContext from a session row by re-resolving the
 * buyer's profile + company + role from Shopify (with portal-DB
 * permission layering merged in).
 *
 * Production code should cache this per-request and TTL it; v1 keeps
 * it simple and re-queries Shopify each time.
 */
export const resolveAuthContext = async (
  db: Database,
  session: SessionRow,
): Promise<AuthContext> => {
  const me = await customerAccountQuery<{ customer: ShopifyCustomerResponse }>(
    session.caaAccessToken,
    CUSTOMER_ME_QUERY,
  );

  const data = await customerAccountQuery<CompanyForCustomerData>(
    session.caaAccessToken,
    COMPANY_FOR_CUSTOMER_QUERY,
  );

  const contactNodes = data.customer.companyContacts.edges.map((e) => e.node);
  const contact =
    contactNodes.find((n) => n.company?.id === session.shopifyCompanyGid) ?? contactNodes[0];

  if (!contact?.company) {
    throw new Error('Buyer is not associated with any Shopify B2B company');
  }

  const company: Company = mapShopifyCompany(contact.company);
  const activeLocationId =
    session.activeLocationGid ?? company.defaultLocationId ?? company.locations[0]?.id;
  const location = company.locations.find((l) => l.id === activeLocationId);

  // Determine role: among each location's roleAssignments, find the one
  // whose contact is us. Prefer the assignment on the active location.
  const findRoleOnLocation = (locId: string | undefined): string | null => {
    if (!locId) return null;
    const locEdge = contact.company!.locations.edges.find((e) => e.node.id === locId);
    const ra = locEdge?.node.roleAssignments.edges.find((e) => e.node.contact.id === contact.id);
    return ra?.node.role.name ?? null;
  };
  const findAnyRole = (): string | null => {
    for (const locEdge of contact.company!.locations.edges) {
      const ra = locEdge.node.roleAssignments.edges.find((e) => e.node.contact.id === contact.id);
      if (ra) return ra.node.role.name;
    }
    return null;
  };
  const shopifyRoleName = findRoleOnLocation(activeLocationId) ?? findAnyRole() ?? 'Buyer';
  const shopifyPermissions = mapShopifyRoleToPermissions(shopifyRoleName);
  const role = await buildMergedRole(db, {
    buyerId: me.customer.id,
    shopifyRoleName,
    shopifyPermissions,
    isShopifyLocationAdmin: isShopifyLocationAdmin(shopifyRoleName),
  });

  const buyer: Buyer = mapShopifyCustomer(me.customer, role);
  const buyerContext: BuyerContext = {
    buyer,
    company,
    location,
    currency: 'USD', // TODO: derive from location/market
    locale: 'en-US',
  };

  return {
    sessionId: session.id,
    buyer,
    company,
    location,
    caaAccessToken: session.caaAccessToken,
    buyerContext,
  };
};
