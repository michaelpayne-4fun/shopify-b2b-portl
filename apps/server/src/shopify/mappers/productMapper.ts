import type { Product, ProductVariant } from '@b2b/domain';

export interface ShopifyProductNode {
  id: string;
  title: string;
  handle: string;
  description?: string | null;
  images: { edges: Array<{ node: { url: string; altText?: string | null } }> };
  options: Array<{ id: string; name: string; values: string[] }>;
  variants: {
    edges: Array<{
      node: {
        id: string;
        sku: string | null;
        title: string;
        price: { amount: string; currencyCode: string };
        quantityAvailable?: number | null;
        currentlyNotInStock?: boolean | null;
        selectedOptions: Array<{ name: string; value: string }>;
      };
    }>;
  };
}

const toVariant = (node: ShopifyProductNode['variants']['edges'][number]['node']): ProductVariant => ({
  id: node.id,
  sku: node.sku ?? '',
  name: node.title,
  attributes: Object.fromEntries(node.selectedOptions.map((o) => [o.name, o.value])),
  price: { amount: Number(node.price.amount), currency: node.price.currencyCode },
  inventory:
    node.quantityAvailable != null
      ? { available: node.quantityAvailable, backorderable: !node.currentlyNotInStock }
      : undefined,
});

export const mapShopifyProduct = (raw: ShopifyProductNode): Product => {
  const variants = raw.variants.edges.map((e) => toVariant(e.node));
  return {
    id: raw.id,
    sku: variants[0]?.sku ?? '',
    name: raw.title,
    slug: raw.handle,
    description: raw.description ?? undefined,
    images: raw.images.edges.map((e) => ({ url: e.node.url, alt: e.node.altText ?? undefined })),
    options: raw.options.map((o) => ({ id: o.id, name: o.name, values: o.values })),
    variants,
    defaultVariantId: variants[0]?.id ?? '',
  };
};
