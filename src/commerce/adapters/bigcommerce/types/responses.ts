/**
 * Subset of BigCommerce response shapes that this adapter cares about.
 * Intentionally narrow: only the fields used by the mappers. These types must
 * NEVER be exported beyond the BigCommerce adapter package.
 */

export interface BCAuthLoginResponse {
  data: {
    token: string;
    refresh_token?: string;
    expires_at?: number;
    user: {
      id: number | string;
      email: string;
      first_name: string;
      last_name: string;
      role: {
        id: number | string;
        name: string;
        permissions: string[];
        is_admin?: boolean;
      };
      locale?: string;
      phone_number?: string;
    };
  };
}

export interface BCCompanyResponse {
  data: {
    id: number | string;
    company_name: string;
    company_status: 'pending' | 'approved' | 'rejected' | 'inactive';
    default_address_id?: number | string;
    addresses: BCCompanyAddress[];
  };
}

export interface BCCompanyAddress {
  id: number | string;
  label?: string;
  first_name: string;
  last_name: string;
  company?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  zip_code: string;
  country_code: string;
  phone_number?: string;
  is_default_billing?: boolean;
  is_default_shipping?: boolean;
  is_default?: boolean;
  channel_id?: string;
}

export interface BCCartResponse {
  data: {
    cart_id: string;
    currency: { code: string };
    updated_time: string;
    line_items: BCCartLineItem[];
    cart_amount: number;
    base_amount?: number;
    discount_amount?: number;
    tax_amount?: number;
    shipping_amount?: number;
  };
}

export interface BCCartLineItem {
  id: string;
  variant_id: string;
  sku: string;
  name: string;
  quantity: number;
  list_price: number;
  sale_price?: number;
  extended_list_price: number;
  image_url?: string;
}

export interface BCOrderResponse {
  data: {
    id: number | string;
    order_number: string;
    placed_at: string;
    status: string;
    buyer_id: string;
    company_id: string;
    location_id?: string;
    po_number?: string;
    currency: { code: string };
    subtotal_amount: number;
    total_amount: number;
    items: BCOrderLine[];
    shipping_address?: BCCompanyAddress;
    billing_address?: BCCompanyAddress;
  };
}

export interface BCOrderLine {
  id: number | string;
  sku: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface BCProductResponse {
  data: BCProduct;
}

export interface BCProduct {
  id: number | string;
  sku: string;
  name: string;
  slug?: string;
  description?: string;
  images: { url_standard: string; alt?: string }[];
  options: { id: string; display_name: string; values: { label: string }[] }[];
  variants: BCVariant[];
  default_variant_id?: string;
}

export interface BCVariant {
  id: number | string;
  sku: string;
  name: string;
  option_values?: Record<string, string>;
  price: number;
  currency_code: string;
  inventory_level?: number;
  inventory_warning_level?: number;
  is_backorder_allowed?: boolean;
}

export interface BCQuoteResponse {
  data: {
    id: number | string;
    quote_number: string;
    status: string;
    created_at: string;
    updated_at: string;
    expires_at?: string;
    buyer_id: string;
    company_id: string;
    currency_code: string;
    subtotal: number;
    total: number;
    items: BCQuoteLine[];
    notes?: string;
  };
}

export interface BCQuoteLine {
  id: number | string;
  sku: string;
  variant_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  notes?: string;
}
