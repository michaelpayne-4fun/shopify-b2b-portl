import { bff } from './bffClient';
import type { Page, Product } from '@b2b/domain';

export const searchProducts = (q: string, pageSize = 20) =>
  bff.get<Page<Product>>(`/catalog/search?q=${encodeURIComponent(q)}&pageSize=${pageSize}`);

export const getProductBySku = (sku: string) =>
  bff.get<Product>(`/catalog/sku/${encodeURIComponent(sku)}`);
