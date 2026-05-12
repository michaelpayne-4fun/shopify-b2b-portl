export interface Address {
  id: string;
  label?: string;
  firstName: string;
  lastName: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode: string;
  phone?: string;
  isDefaultBilling?: boolean;
  isDefaultShipping?: boolean;
}

export type AddressInput = Omit<Address, 'id'>;
