import type { Buyer, BuyerContext } from '@/domain/models';

export interface UpdateBuyerInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  locale?: string;
}

export interface CustomerService {
  getProfile(context: BuyerContext): Promise<Buyer>;
  updateProfile(context: BuyerContext, input: UpdateBuyerInput): Promise<Buyer>;
  changePassword(context: BuyerContext, current: string, next: string): Promise<void>;
}
