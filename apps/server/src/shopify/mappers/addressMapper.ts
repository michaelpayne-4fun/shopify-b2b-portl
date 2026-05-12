import type { Address, AddressScope } from '@b2b/domain';

export interface ShopifyMailingAddress {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  provinceCode?: string | null;
  zip?: string | null;
  countryCode?: string | null;
  phone?: string | null;
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
  company: raw.company ?? undefined,
  line1: raw.address1 ?? '',
  line2: raw.address2 ?? undefined,
  city: raw.city ?? '',
  region: raw.provinceCode ?? '',
  postalCode: raw.zip ?? '',
  countryCode: raw.countryCode ?? '',
  phone: raw.phone ?? undefined,
  isDefaultBilling: opts.isDefaultBilling,
  isDefaultShipping: opts.isDefaultShipping,
});
