import type { CatalogService } from '@/commerce/interfaces';
import type { BuyerContext, Page, PageRequest, Product } from '@/domain/models';
import { getStore } from '../data/store';
import { paginate } from '../data/page';

export class MockCatalogService implements CatalogService {
  async searchProducts(
    _ctx: BuyerContext,
    query: string,
    pageRequest?: PageRequest,
  ): Promise<Page<Product>> {
    const store = getStore();
    const q = query.trim().toLowerCase();
    const matched = q
      ? store.products.filter(
          (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
        )
      : store.products;
    return paginate(matched, pageRequest);
  }

  async getProductBySku(_ctx: BuyerContext, sku: string): Promise<Product | null> {
    const store = getStore();
    return store.products.find((p) => p.sku.toLowerCase() === sku.toLowerCase()) ?? null;
  }

  async getProductsBySkus(_ctx: BuyerContext, skus: string[]): Promise<Product[]> {
    const store = getStore();
    const set = new Set(skus.map((s) => s.toLowerCase()));
    return store.products.filter((p) => set.has(p.sku.toLowerCase()));
  }
}
