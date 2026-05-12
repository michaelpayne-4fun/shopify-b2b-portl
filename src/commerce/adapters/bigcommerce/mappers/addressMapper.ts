import type { Address } from '@/domain/models';
import type { BCCompanyAddress } from '../types/responses';

export const mapBcAddress = (raw: BCCompanyAddress): Address => ({
  id: String(raw.id),
  label: raw.label,
  firstName: raw.first_name,
  lastName: raw.last_name,
  company: raw.company,
  line1: raw.address_line_1,
  line2: raw.address_line_2,
  city: raw.city,
  region: raw.state,
  postalCode: raw.zip_code,
  countryCode: raw.country_code,
  phone: raw.phone_number,
  isDefaultBilling: raw.is_default_billing ?? raw.is_default,
  isDefaultShipping: raw.is_default_shipping ?? raw.is_default,
});
