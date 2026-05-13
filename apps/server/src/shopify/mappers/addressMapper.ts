import type { Address, AddressScope } from '@b2b/domain';

export interface ShopifyMailingAddress {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  companyName?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  provinceCode?: string | null;
  zoneCode?: string | null;
  zip?: string | null;
  countryCode?: string | null;
  territoryCode?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
}

export const mapShopifyAddress = (
  raw: ShopifyMailingAddress,
  opts: { scope: AddressScope; label?: string; isDefaultBilling?: boolean; isDefaultShipping?: boolean } = { scope: 'personal' },
): Address => ({
  id: raw.id ?? '',
  scope: opts.scope,
  label: opts.label,
  firstName: raw.firstName ?? '',
  lastName: raw.lastName ?? '',
  company: raw.company ?? raw.companyName ?? undefined,
  line1: raw.address1 ?? '',
  line2: raw.address2 ?? undefined,
  city: raw.city ?? '',
  region: raw.zoneCode ?? raw.provinceCode ?? '',
  postalCode: raw.zip ?? '',
  countryCode: raw.countryCode ?? raw.territoryCode ?? '',
  phone: raw.phone ?? raw.phoneNumber ?? undefined,
  isDefaultBilling: opts.isDefaultBilling,
  isDefaultShipping: opts.isDefaultShipping,
});
