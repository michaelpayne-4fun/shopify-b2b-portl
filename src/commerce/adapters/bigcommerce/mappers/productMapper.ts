import type { Product, ProductVariant } from '@/domain/models';
import type { BCProduct, BCVariant } from '../types/responses';

const toVariant = (raw: BCVariant): ProductVariant => ({
  id: String(raw.id),
  sku: raw.sku,
  name: raw.name,
  attributes: raw.option_values ?? {},
  price: { amount: raw.price, currency: raw.currency_code },
  inventory:
    raw.inventory_level != null
      ? { available: raw.inventory_level, backorderable: !!raw.is_backorder_allowed }
      : undefined,
});

export const mapBcProduct = (raw: BCProduct): Product => {
  const variants = raw.variants.map(toVariant);
  return {
    id: String(raw.id),
    sku: raw.sku,
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    images: raw.images.map((img) => ({ url: img.url_standard, alt: img.alt })),
    options: raw.options.map((o) => ({
      id: o.id,
      name: o.display_name,
      values: o.values.map((v) => v.label),
    })),
    variants,
    defaultVariantId: raw.default_variant_id != null ? String(raw.default_variant_id) : variants[0]?.id,
  };
};
