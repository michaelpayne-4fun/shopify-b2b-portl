import { beforeEach, describe, expect, it } from 'vitest';
import { createMockAdapter, resetStore } from '../index';
import { appConfig } from '@/app/config';
import type { BuyerContext } from '@/domain/models';

const buildContext = async () => {
  const adapter = createMockAdapter();
  const session = await adapter.auth.login({ email: 'buyer@acme.test', password: 'password' });
  const { company, activeLocationId } = await adapter.company.resolveContext(session);
  const ctx: BuyerContext = {
    buyer: session.buyer,
    company,
    location: company.locations.find((l) => l.id === activeLocationId),
    currency: appConfig.defaultCurrency,
    locale: appConfig.defaultLocale,
  };
  return { adapter, ctx };
};

describe('cart workflow (mock adapter)', () => {
  beforeEach(() => resetStore());

  it('adds, updates, and removes items, with totals recomputed', async () => {
    const { adapter, ctx } = await buildContext();

    let cart = await adapter.cart.addItem(ctx, { sku: 'BOLT-001', quantity: 10 });
    expect(cart.items).toHaveLength(1);
    expect(cart.totals.total.amount).toBeCloseTo(12.5, 2);

    cart = await adapter.cart.addItem(ctx, { sku: 'NUT-002', quantity: 4 });
    expect(cart.items).toHaveLength(2);
    expect(cart.totals.total.amount).toBeCloseTo(12.5 + 3.0, 2);

    cart = await adapter.cart.updateItem(ctx, cart.items[0].id, 20);
    expect(cart.items[0].quantity).toBe(20);
    expect(cart.totals.total.amount).toBeCloseTo(20 * 1.25 + 4 * 0.75, 2);

    cart = await adapter.cart.removeItem(ctx, cart.items[0].id);
    expect(cart.items).toHaveLength(1);
  });

  it('rejects non-existent SKUs', async () => {
    const { adapter, ctx } = await buildContext();
    await expect(adapter.cart.addItem(ctx, { sku: 'NOPE', quantity: 1 })).rejects.toThrow();
  });
});
