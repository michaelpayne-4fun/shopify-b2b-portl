import { describe, expect, it } from 'vitest';
import { mapShopifyAddress } from '../addressMapper';
import { mapShopifyCart } from '../cartMapper';
import { mapShopifyCompany } from '../companyMapper';
import { mapShopifyCustomer } from '../customerMapper';
import { mapShopifyOrder } from '../orderMapper';
import { mapShopifyProduct } from '../productMapper';
import { mapShopifyRoleToPermissions } from '../permissionMapper';

describe('Shopify mappers', () => {
  it('permissionMapper drops portal-only perms', () => {
    expect(mapShopifyRoleToPermissions('Location admin')).toEqual(
      expect.arrayContaining(['orders.view', 'addresses.manage']),
    );
    expect(mapShopifyRoleToPermissions('Buyer', ['approvals.act'])).not.toContain('approvals.act');
    expect(mapShopifyRoleToPermissions('Unknown role')).toEqual([]);
  });

  it('addressMapper preserves scope + defaults', () => {
    const out = mapShopifyAddress(
      {
        firstName: 'A', lastName: 'B', address1: '1 Main', city: 'Austin',
        provinceCode: 'TX', zip: '78701', countryCode: 'US',
      },
      { scope: 'company', label: 'HQ', isDefaultShipping: true },
    );
    expect(out.scope).toBe('company');
    expect(out.label).toBe('HQ');
    expect(out.region).toBe('TX');
    expect(out.isDefaultShipping).toBe(true);
  });

  it('companyMapper folds locations', () => {
    const c = mapShopifyCompany({
      id: 'gid://shopify/Company/1',
      name: 'Acme',
      locations: { edges: [
        { node: { id: 'gid://Loc/1', name: 'HQ', shippingAddress: {
          firstName: 'A', lastName: 'B', address1: '1 Main', city: 'Austin',
          provinceCode: 'TX', zip: '78701', countryCode: 'US',
        } } },
      ] },
    });
    expect(c.name).toBe('Acme');
    expect(c.locations[0].isDefault).toBe(true);
    expect(c.locations[0].shopifyLocationGid).toBe('gid://Loc/1');
  });

  it('productMapper extracts SKU, price, inventory', () => {
    const p = mapShopifyProduct({
      id: 'gid://Product/1', title: 'Widget', handle: 'widget',
      images: { edges: [{ node: { url: 'http://x', altText: null } }] },
      options: [],
      variants: { edges: [{ node: {
        id: 'gid://Variant/1', sku: 'WID-1', title: 'Default',
        price: { amount: '12.50', currencyCode: 'USD' },
        quantityAvailable: 100, currentlyNotInStock: false, selectedOptions: [],
      } }] },
    });
    expect(p.variants[0].price.amount).toBe(12.5);
    expect(p.variants[0].inventory?.available).toBe(100);
    expect(p.variants[0].inventory?.backorderable).toBe(true);
  });

  it('cartMapper produces totals', () => {
    const cart = mapShopifyCart({
      id: 'gid://Cart/1', updatedAt: '2026-05-12', checkoutUrl: 'https://x/checkout',
      cost: {
        subtotalAmount: { amount: '10.00', currencyCode: 'USD' },
        totalAmount: { amount: '11.00', currencyCode: 'USD' },
      },
      lines: { edges: [{ node: {
        id: 'gid://L/1', quantity: 1,
        merchandise: { id: 'gid://V/1', sku: 'X', title: 'Default', product: { title: 'X' } },
        cost: {
          totalAmount: { amount: '10.00', currencyCode: 'USD' },
          amountPerQuantity: { amount: '10.00', currencyCode: 'USD' },
        },
      } }] },
    });
    expect(cart.items).toHaveLength(1);
    expect(cart.totals.total.amount).toBe(11);
  });

  it('orderMapper resolves status from fulfillment + financial', () => {
    const o = mapShopifyOrder({
      id: 'gid://Order/1', name: '#1001', processedAt: '2026-05-01',
      fulfillmentStatus: 'shipped', financialStatus: 'paid', poNumber: 'PO-1',
      totalPriceSet: { presentmentMoney: { amount: '100', currencyCode: 'USD' } },
      subtotalPriceSet: { presentmentMoney: { amount: '100', currencyCode: 'USD' } },
      lineItems: { edges: [{ node: {
        id: 'gid://LI/1', sku: 'X', title: 'X', quantity: 1,
        originalUnitPriceSet: { presentmentMoney: { amount: '100', currencyCode: 'USD' } },
        originalTotalSet: { presentmentMoney: { amount: '100', currencyCode: 'USD' } },
      } }] },
    });
    expect(o.status).toBe('shipped');
    expect(o.poNumber).toBe('PO-1');
  });

  it('customerMapper merges role into Buyer', () => {
    const b = mapShopifyCustomer(
      { id: 'gid://C/1', firstName: 'A', lastName: 'B', emailAddress: { emailAddress: 'a@b.test' } },
      { id: 'r', name: 'Buyer', isAdmin: false, permissions: ['orders.view'] },
    );
    expect(b.email).toBe('a@b.test');
    expect(b.role.permissions).toEqual(['orders.view']);
  });
});
