import type { InventoryService } from '@/commerce/interfaces';
import type { BuyerContext, Inventory } from '@/domain/models';
import type { StorefrontClient } from '../client/storefrontClient';

interface BCInventoryResponse {
  data: { variant_id: string; available: number | null; backorderable?: boolean }[];
}

export class BigCommerceInventoryService implements InventoryService {
  constructor(private readonly client: StorefrontClient) {}

  async getInventory(
    _ctx: BuyerContext,
    variantIds: string[],
  ): Promise<Record<string, Inventory>> {
    if (variantIds.length === 0) return {};
    const params = new URLSearchParams({ ids: variantIds.join(',') });
    const resp = await this.client.http.request<BCInventoryResponse>({
      url: `/api/storefront/inventory?${params.toString()}`,
    });
    const out: Record<string, Inventory> = {};
    for (const row of resp.data) {
      out[row.variant_id] = { available: row.available, backorderable: !!row.backorderable };
    }
    return out;
  }
}
