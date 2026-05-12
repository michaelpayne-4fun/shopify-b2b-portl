import type { CustomerService, UpdateBuyerInput } from '@/commerce/interfaces';
import type { Buyer, BuyerContext } from '@/domain/models';
import { NotFoundError, ValidationError } from '@/domain/errors';
import { getStore } from '../data/store';

export class MockCustomerService implements CustomerService {
  async getProfile(context: BuyerContext): Promise<Buyer> {
    const store = getStore();
    const buyer = store.buyers.find((b) => b.id === context.buyer.id);
    if (!buyer) throw new NotFoundError('Buyer', context.buyer.id);
    return buyer;
  }

  async updateProfile(context: BuyerContext, input: UpdateBuyerInput): Promise<Buyer> {
    const store = getStore();
    const idx = store.buyers.findIndex((b) => b.id === context.buyer.id);
    if (idx < 0) throw new NotFoundError('Buyer', context.buyer.id);
    store.buyers[idx] = { ...store.buyers[idx], ...input };
    return store.buyers[idx];
  }

  async changePassword(context: BuyerContext, current: string, next: string): Promise<void> {
    const store = getStore();
    const email = context.buyer.email;
    if (store.passwords[email] !== current) {
      throw new ValidationError('Current password is incorrect');
    }
    if (next.length < 8) throw new ValidationError('New password must be at least 8 characters');
    store.passwords[email] = next;
  }
}
