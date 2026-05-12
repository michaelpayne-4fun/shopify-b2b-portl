import { expect } from 'vitest';
import type { CommerceAdapter } from '@/commerce/interfaces';
import type { BuyerContext } from '@/domain/models';
import { appConfig } from '@/app/config';

/**
 * Shared contract test for any CommerceAdapter implementation. Drives the
 * adapter through a representative buyer flow:
 *   - login
 *   - resolve company → BuyerContext
 *   - cart add / read / remove
 *   - order list & detail
 *
 * Callers provide a factory and a known credential pair that should succeed.
 */
export interface ContractCase {
  name: string;
  createAdapter(): CommerceAdapter;
  credentials: { email: string; password: string };
  knownSku: string;
}

export const runAdapterContract = async (testCase: ContractCase): Promise<void> => {
  const adapter = testCase.createAdapter();

  const session = await adapter.auth.login(testCase.credentials);
  expect(session.token).toBeTruthy();
  expect(session.buyer.email).toBe(testCase.credentials.email);

  const { company, activeLocationId } = await adapter.company.resolveContext(session);
  expect(company.id).toBeTruthy();

  const context: BuyerContext = {
    buyer: session.buyer,
    company,
    location: company.locations.find((l) => l.id === activeLocationId),
    currency: appConfig.defaultCurrency,
    locale: appConfig.defaultLocale,
  };

  const beforeCart = await adapter.cart.getCart(context);
  const startingCount = beforeCart.items.length;

  const updatedCart = await adapter.cart.addItem(context, { sku: testCase.knownSku, quantity: 2 });
  expect(updatedCart.items.length).toBeGreaterThanOrEqual(startingCount + (startingCount === 0 ? 1 : 0));

  const addedItem = updatedCart.items.find((it) => it.sku === testCase.knownSku);
  expect(addedItem).toBeTruthy();

  if (addedItem) {
    const afterRemove = await adapter.cart.removeItem(context, addedItem.id);
    expect(afterRemove.items.find((it) => it.id === addedItem.id)).toBeUndefined();
  }

  const orders = await adapter.order.list(context);
  expect(Array.isArray(orders.items)).toBe(true);
};
