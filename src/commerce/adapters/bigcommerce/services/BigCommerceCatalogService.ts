import type { CatalogService } from '@/commerce/interfaces';
import type { BuyerContext, Page, PageRequest, Product } from '@/domain/models';
import type { StorefrontClient } from '../client/storefrontClient';
import type { BCProduct } from '../types/responses';
import { mapBcProduct } from '../mappers/productMapper';

interface BCProductListResponse {
  data: BCProduct[];
  meta: { pagination: { current_page: number; per_page: number; total: number; total_pages: number } };
}

export class BigCommerceCatalogService implements CatalogService {
  constructor(private readonly client: StorefrontClient) {}

  async searchProducts(
    _ctx: BuyerContext,
    query: string,
    pageRequest?: PageRequest,
  ): Promise<Page<Product>> {
    const params = new URLSearchParams();
    if (query) params.set('keyword', query);
    params.set('page', String(pageRequest?.page ?? 1));
    params.set('limit', String(pageRequest?.pageSize ?? 20));
    const resp = await this.client.http.request<BCProductListResponse>({
      url: `/api/storefront/products?${params.toString()}`,
    });
    return {
      items: resp.data.map(mapBcProduct),
      page: resp.meta.pagination.current_page,
      pageSize: resp.meta.pagination.per_page,
      totalItems: resp.meta.pagination.total,
      totalPages: resp.meta.pagination.total_pages,
    };
  }

  async getProductBySku(_ctx: BuyerContext, sku: string): Promise<Product | null> {
    const params = new URLSearchParams({ sku });
    const resp = await this.client.http.request<BCProductListResponse>({
      url: `/api/storefront/products?${params.toString()}`,
    });
    return resp.data[0] ? mapBcProduct(resp.data[0]) : null;
  }

  async getProductsBySkus(_ctx: BuyerContext, skus: string[]): Promise<Product[]> {
    const params = new URLSearchParams();
    for (const s of skus) params.append('sku:in', s);
    const resp = await this.client.http.request<BCProductListResponse>({
      url: `/api/storefront/products?${params.toString()}`,
    });
    return resp.data.map(mapBcProduct);
  }
}
