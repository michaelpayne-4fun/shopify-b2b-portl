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

interface CompanyForCustomerData {
  customer: {
    id: string;
    companyContactProfiles: Array<{
      company: ShopifyCompanyResponse;
      roleAssignments: { edges: Array<{ node: { role: { name: string }; companyLocation: { id: string } } }> };
    }>;
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
    { customerId: me.customer.id },
  );

  const profile = data.customer.companyContactProfiles.find(
    (p) => p.company.id === session.shopifyCompanyGid,
  ) ?? data.customer.companyContactProfiles[0];

  if (!profile) {
    throw new Error('Buyer is not associated with any Shopify B2B company');
  }

  const company: Company = mapShopifyCompany(profile.company);
  const activeLocationId =
    session.activeLocationGid ?? company.defaultLocationId ?? company.locations[0]?.id;
  const location = company.locations.find((l) => l.id === activeLocationId);

  // Determine role: pick the role for the active location (or the first
  // assignment if no location match).
  const roleAssignment =
    profile.roleAssignments.edges.find((e) => e.node.companyLocation.id === activeLocationId) ??
    profile.roleAssignments.edges[0];
  const shopifyRoleName = roleAssignment?.node.role.name ?? 'Buyer';
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
