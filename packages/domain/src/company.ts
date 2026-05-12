import type { Address } from './address';

export type CompanyStatus = 'pending' | 'approved' | 'rejected' | 'inactive';

export interface CompanyLocation {
  id: string;
  name: string;
  address: Address;
  isDefault: boolean;
  /**
   * Opaque Shopify CompanyLocation GID. The BFF uses it as
   * `buyerIdentity.companyLocationId` on cart mutations; the SPA does
   * not interpret the value.
   */
  shopifyLocationGid: string;
}

export interface Company {
  id: string;
  name: string;
  status: CompanyStatus;
  /** Opaque Shopify Company GID. */
  shopifyCompanyGid: string;
  locations: CompanyLocation[];
  defaultLocationId?: string;
}
