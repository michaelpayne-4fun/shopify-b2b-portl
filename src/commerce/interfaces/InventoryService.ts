import type { BuyerContext, Inventory } from '@/domain/models';

export interface InventoryService {
  getInventory(context: BuyerContext, variantIds: string[]): Promise<Record<string, Inventory>>;
}
