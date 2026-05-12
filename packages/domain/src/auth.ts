import type { Buyer } from './buyer';
import type { Company } from './company';

/**
 * What the BFF returns to the SPA on auth/me and auth/callback. The
 * SPA never holds Shopify tokens; the session cookie is sufficient.
 */
export interface AuthMeResponse {
  buyer: Buyer;
  company: Company;
  activeLocationId?: string;
}

export interface InviteUserInput {
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
}
