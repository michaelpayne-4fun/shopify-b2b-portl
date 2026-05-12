import type { Buyer, Role } from '@b2b/domain';

export interface ShopifyCustomerResponse {
  id: string;
  emailAddress?: { emailAddress: string } | null;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: { phoneNumber: string } | null;
  defaultAddress?: { id: string } | null;
}

export const mapShopifyCustomer = (
  raw: ShopifyCustomerResponse,
  role: Role,
): Buyer => ({
  id: raw.id,
  email: raw.emailAddress?.emailAddress ?? '',
  firstName: raw.firstName ?? '',
  lastName: raw.lastName ?? '',
  phone: raw.phoneNumber?.phoneNumber ?? undefined,
  role,
});
