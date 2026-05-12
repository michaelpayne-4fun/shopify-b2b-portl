import type { Money } from './money';

export interface ProductImage {
  url: string;
  alt?: string;
}

export interface ProductOption {
  id: string;
  name: string;
  values: string[];
}

export interface Inventory {
  available: number | null;
  backorderable: boolean;
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  attributes: Record<string, string>;
  price: Money;
  inventory?: Inventory;
  minOrderQty?: number;
  maxOrderQty?: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug?: string;
  description?: string;
  images: ProductImage[];
  options: ProductOption[];
  variants: ProductVariant[];
  defaultVariantId: string;
}
