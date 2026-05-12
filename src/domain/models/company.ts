import type { Address } from './address';

export type CompanyStatus = 'pending' | 'approved' | 'rejected' | 'inactive';

export interface CompanyLocation {
  id: string;
  name: string;
  address: Address;
  isDefault: boolean;
  /**
   * Optional opaque hint a commerce adapter can use to route requests
   * (e.g. a BC channel id). The UI does not interpret this value.
   */
  channelHint?: string;
}

export interface Company {
  id: string;
  name: string;
  status: CompanyStatus;
  locations: CompanyLocation[];
  defaultLocationId?: string;
}
