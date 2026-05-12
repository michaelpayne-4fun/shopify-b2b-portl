import type { PricingService } from '@/commerce/interfaces';
import type { BuyerContext, ContractPrice } from '@/domain/models';
import { getStore } from '../data/store';

export class MockPricingService implements PricingService {
  async getContractPrices(_ctx: BuyerContext, variantIds: string[]): Promise<ContractPrice[]> {
    const set = new Set(variantIds);
    return getStore().contractPrices.filter((p) => set.has(p.variantId));
  }
}
