import type { AddressService } from '@/commerce/interfaces';
import type { Address, AddressInput, BuyerContext, Page, PageRequest } from '@/domain/models';
import { NotFoundError } from '@/domain/errors';
import { getStore } from '../data/store';
import { paginate } from '../data/page';

export class MockAddressService implements AddressService {
  async list(_ctx: BuyerContext, pageRequest?: PageRequest): Promise<Page<Address>> {
    return paginate(getStore().addresses, pageRequest);
  }

  async get(_ctx: BuyerContext, id: string): Promise<Address> {
    const address = getStore().addresses.find((a) => a.id === id);
    if (!address) throw new NotFoundError('Address', id);
    return address;
  }

  async create(_ctx: BuyerContext, input: AddressInput): Promise<Address> {
    const store = getStore();
    const address: Address = { id: `addr-${store.addresses.length + 1}-${Date.now()}`, ...input };
    store.addresses.push(address);
    return address;
  }

  async update(_ctx: BuyerContext, id: string, input: AddressInput): Promise<Address> {
    const store = getStore();
    const idx = store.addresses.findIndex((a) => a.id === id);
    if (idx < 0) throw new NotFoundError('Address', id);
    store.addresses[idx] = { ...store.addresses[idx], ...input };
    return store.addresses[idx];
  }

  async delete(_ctx: BuyerContext, id: string): Promise<void> {
    const store = getStore();
    const idx = store.addresses.findIndex((a) => a.id === id);
    if (idx < 0) throw new NotFoundError('Address', id);
    store.addresses.splice(idx, 1);
  }
}
