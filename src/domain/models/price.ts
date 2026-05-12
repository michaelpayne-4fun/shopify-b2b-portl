import type { Money } from './money';

export interface PriceTier {
  minQuantity: number;
  unitPrice: Money;
}

export interface ContractPrice {
  variantId: string;
  unitPrice: Money;
  tiers?: PriceTier[];
  validFrom?: string;
  validUntil?: string;
}

export interface PriceList {
  id: string;
  name: string;
  prices: ContractPrice[];
}
