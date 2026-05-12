import type { InventoryService } from '@/commerce/interfaces';
import type { BuyerContext, Inventory } from '@/domain/models';
import { getStore } from '../data/store';

export class MockInventoryService implements InventoryService {
  async getInventory(
    _ctx: BuyerContext,
    variantIds: string[],
  ): Promise<Record<string, Inventory>> {
    const out: Record<string, Inventory> = {};
    for (const product of getStore().products) {
      for (const variant of product.variants) {
        if (variantIds.includes(variant.id) && variant.inventory) {
          out[variant.id] = variant.inventory;
        }
      }
    }
    return out;
  }
}
