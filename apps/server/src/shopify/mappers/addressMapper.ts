import type { Address, AddressScope } from '@b2b/domain';

/**
 * Address payloads come from two different Shopify GraphQL APIs that
 * give the same logical fields different names. The mapper accepts
 * any of them so the rest of the codebase doesn't care which API the
 * data came from.
 *
 *   Field          Admin (MailingAddress)   Customer Account (CustomerAddress / CompanyAddress)
 *   ------------   ----------------------   --------------------------------------------------
 *   company name   company                  company / companyName
 *   region code    provinceCode             zoneCode
 *   country code   countryCodeV2            territoryCode
 *   phone          phone                    phone
 */
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
  countryCodeV2?: string | null;
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
  countryCode: raw.countryCodeV2 ?? raw.territoryCode ?? raw.countryCode ?? '',
  phone: raw.phone ?? raw.phoneNumber ?? undefined,
  isDefaultBilling: opts.isDefaultBilling,
  isDefaultShipping: opts.isDefaultShipping,
});
