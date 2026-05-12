import { bff } from './bffClient';
import type { Company } from '@b2b/domain';

export const getCompany = () => bff.get<Company>('/me/company');
export const switchLocation = (locationId: string) =>
  bff.post<{ activeLocationId: string }>('/me/company/switch-location', { locationId });
