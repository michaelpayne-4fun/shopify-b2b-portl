import type { Company, CompanyLocation, CompanyStatus } from '@/domain/models';
import type { BCCompanyAddress, BCCompanyResponse } from '../types/responses';
import { mapBcAddress } from './addressMapper';

const STATUS_MAP: Record<string, CompanyStatus> = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
  inactive: 'inactive',
};

const toLocation = (raw: BCCompanyAddress): CompanyLocation => ({
  id: String(raw.id),
  name: raw.label ?? raw.company ?? 'Location',
  address: mapBcAddress(raw),
  isDefault: !!raw.is_default,
  channelHint: raw.channel_id,
});

export const mapBcCompany = (raw: BCCompanyResponse['data']): Company => {
  const locations = raw.addresses.map(toLocation);
  return {
    id: String(raw.id),
    name: raw.company_name,
    status: STATUS_MAP[raw.company_status] ?? 'pending',
    defaultLocationId:
      raw.default_address_id != null ? String(raw.default_address_id) : locations[0]?.id,
    locations,
  };
};
