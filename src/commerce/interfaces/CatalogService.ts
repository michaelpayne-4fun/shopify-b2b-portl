import type { BuyerContext, Page, PageRequest, Product } from '@/domain/models';

export interface CatalogService {
  searchProducts(
    context: BuyerContext,
    query: string,
    pageRequest?: PageRequest,
  ): Promise<Page<Product>>;
  getProductBySku(context: BuyerContext, sku: string): Promise<Product | null>;
  getProductsBySkus(context: BuyerContext, skus: string[]): Promise<Product[]>;
}
