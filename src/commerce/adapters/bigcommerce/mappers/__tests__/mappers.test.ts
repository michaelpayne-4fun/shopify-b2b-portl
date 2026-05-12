import { describe, expect, it } from 'vitest';
import { mapBcPermissions } from '../permissionMapper';
import { mapBcAddress } from '../addressMapper';
import { mapBcCompany } from '../companyMapper';
import { mapBcCart } from '../cartMapper';
import { mapBcOrder } from '../orderMapper';
import { mapBcQuote } from '../quoteMapper';
import { mapBcProduct } from '../productMapper';
import { mapBcAuthSession } from '../buyerMapper';

describe('BC permission mapper', () => {
  it('translates BC permission strings into domain permissions', () => {
    expect(mapBcPermissions(['order:view', 'cart:edit', 'unknown:thing'])).toEqual([
      'orders.view',
      'cart.update',
    ]);
  });

  it('deduplicates and accepts already-canonical names', () => {
    expect(mapBcPermissions(['order:view', 'orders.view'])).toEqual(['orders.view']);
  });
});

describe('BC address mapper', () => {
  it('maps snake_case to camelCase', () => {
    const out = mapBcAddress({
      id: 11,
      first_name: 'A',
      last_name: 'B',
      address_line_1: '1 Main',
      city: 'Austin',
      state: 'TX',
      zip_code: '78701',
      country_code: 'US',
      is_default: true,
    });
    expect(out).toEqual({
      id: '11',
      label: undefined,
      firstName: 'A',
      lastName: 'B',
      company: undefined,
      line1: '1 Main',
      line2: undefined,
      city: 'Austin',
      region: 'TX',
      postalCode: '78701',
      countryCode: 'US',
      phone: undefined,
      isDefaultBilling: true,
      isDefaultShipping: true,
    });
  });
});

describe('BC company mapper', () => {
  it('produces locations with mapped addresses', () => {
    const company = mapBcCompany({
      id: 'c1',
      company_name: 'Acme',
      company_status: 'approved',
      addresses: [
        {
          id: 1,
          label: 'HQ',
          first_name: 'A',
          last_name: 'B',
          address_line_1: '1 Main',
          city: 'Austin',
          state: 'TX',
          zip_code: '78701',
          country_code: 'US',
          is_default: true,
        },
      ],
    });
    expect(company.id).toBe('c1');
    expect(company.locations[0].name).toBe('HQ');
    expect(company.locations[0].address.region).toBe('TX');
    expect(company.status).toBe('approved');
  });
});

describe('BC cart / order / quote / product / auth mappers', () => {
  it('cart maps line items and totals', () => {
    const cart = mapBcCart({
      cart_id: 'c1',
      currency: { code: 'USD' },
      updated_time: '2026-05-01',
      cart_amount: 10,
      line_items: [
        {
          id: 'i1',
          variant_id: 'v1',
          sku: 'SKU1',
          name: 'Thing',
          quantity: 2,
          list_price: 5,
          extended_list_price: 10,
        },
      ],
    });
    expect(cart.items).toHaveLength(1);
    expect(cart.totals.total.amount).toBe(10);
  });

  it('order maps lines and status', () => {
    const order = mapBcOrder({
      id: 'o1',
      order_number: '1001',
      placed_at: '2026-05-01',
      status: 'shipped',
      buyer_id: 'b1',
      company_id: 'c1',
      currency: { code: 'USD' },
      subtotal_amount: 50,
      total_amount: 50,
      items: [{ id: 'l1', sku: 'X', name: 'X', quantity: 1, price: 50, total: 50 }],
    });
    expect(order.status).toBe('shipped');
    expect(order.lines[0].lineTotal.amount).toBe(50);
  });

  it('quote maps status & currency', () => {
    const quote = mapBcQuote({
      id: 'q1',
      quote_number: 'Q-1',
      status: 'submitted',
      created_at: '2026-05-01',
      updated_at: '2026-05-01',
      buyer_id: 'b1',
      company_id: 'c1',
      currency_code: 'USD',
      subtotal: 100,
      total: 100,
      items: [
        { id: 'i1', sku: 'X', variant_id: 'v1', name: 'X', quantity: 1, unit_price: 100, line_total: 100 },
      ],
    });
    expect(quote.status).toBe('submitted');
    expect(quote.total.currency).toBe('USD');
  });

  it('product maps variants and images', () => {
    const product = mapBcProduct({
      id: 1,
      sku: 'X',
      name: 'X',
      images: [{ url_standard: 'http://example/x.png', alt: 'x' }],
      options: [],
      variants: [{ id: 9, sku: 'X', name: 'X', price: 1.5, currency_code: 'USD' }],
    });
    expect(product.id).toBe('1');
    expect(product.variants[0].price.amount).toBe(1.5);
    expect(product.defaultVariantId).toBe('9');
  });

  it('auth session maps user and role via permission mapper', () => {
    const session = mapBcAuthSession({
      token: 'tok',
      user: {
        id: 11,
        email: 'a@b.test',
        first_name: 'A',
        last_name: 'B',
        role: { id: 1, name: 'Buyer', permissions: ['order:view'] },
      },
    });
    expect(session.token).toBe('tok');
    expect(session.buyer.email).toBe('a@b.test');
    expect(session.buyer.role.permissions).toEqual(['orders.view']);
  });
});
