import type { BuyerContext, ContractPrice } from '@/domain/models';

export interface PricingService {
  /**
   * Returns contract / buyer-specific prices for the given variants. Adapters
   * that do not support contract pricing should return an empty array.
   */
  getContractPrices(context: BuyerContext, variantIds: string[]): Promise<ContractPrice[]>;
}
