import type { Address, AddressInput, BuyerContext, Page, PageRequest } from '@/domain/models';

export interface AddressService {
  list(context: BuyerContext, pageRequest?: PageRequest): Promise<Page<Address>>;
  get(context: BuyerContext, id: string): Promise<Address>;
  create(context: BuyerContext, input: AddressInput): Promise<Address>;
  update(context: BuyerContext, id: string, input: AddressInput): Promise<Address>;
  delete(context: BuyerContext, id: string): Promise<void>;
}
