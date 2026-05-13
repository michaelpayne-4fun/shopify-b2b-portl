import type { Role } from './role';

export interface Buyer {
  id: string;
  /**
   * Shopify CompanyContact GID. Distinct from `id`, which is the
   * Customer GID. Required when calling B2B contact mutations
   * (companyContactAssignRole, companyContactDelete, etc.) — those
   * mutations operate on the contact, not the underlying customer.
   */
  contactId?: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  locale?: string;
  phone?: string;
}
