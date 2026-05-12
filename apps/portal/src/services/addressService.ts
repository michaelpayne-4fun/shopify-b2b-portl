import { bff } from './bffClient';
import type { Address, AddressScope, Page } from '@b2b/domain';

export const listAddresses = (scope: AddressScope = 'personal') =>
  bff.get<Page<Address>>(`/addresses?scope=${scope}`);
