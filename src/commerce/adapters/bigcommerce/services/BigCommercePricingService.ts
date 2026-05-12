import type { PricingService } from '@/commerce/interfaces';
import type { BuyerContext, ContractPrice } from '@/domain/models';
import type { B2bClient } from '../client/b2bClient';

interface BCContractPriceResponse {
  data: {
    variant_id: string;
    currency_code: string;
    unit_price: number;
    tiers?: { min_quantity: number; unit_price: number }[];
    valid_from?: string;
    valid_until?: string;
  }[];
}

export class BigCommercePricingService implements PricingService {
  constructor(private readonly client: B2bClient) {}

  async getContractPrices(_ctx: BuyerContext, variantIds: string[]): Promise<ContractPrice[]> {
    if (variantIds.length === 0) return [];
    const params = new URLSearchParams();
    params.set('variant_ids', variantIds.join(','));
    const resp = await this.client.http.request<BCContractPriceResponse>({
      url: `/v3/io/pricing/contract?${params.toString()}`,
    });
    return resp.data.map((p) => ({
      variantId: p.variant_id,
      unitPrice: { amount: p.unit_price, currency: p.currency_code },
      tiers: p.tiers?.map((t) => ({
        minQuantity: t.min_quantity,
        unitPrice: { amount: t.unit_price, currency: p.currency_code },
      })),
      validFrom: p.valid_from,
      validUntil: p.valid_until,
    }));
  }
}
