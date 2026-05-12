import type {
  Address,
  Buyer,
  Cart,
  Company,
  ContractPrice,
  Invoice,
  Order,
  Product,
  Quote,
  Role,
  ShoppingList,
} from '@/domain/models';
import {
  SEED_ADDRESSES,
  SEED_BUYERS,
  SEED_COMPANY,
  SEED_CONTRACT_PRICES,
  SEED_INVOICES,
  SEED_ORDERS,
  SEED_PRODUCTS,
  SEED_QUOTES,
  SEED_ROLES,
  SEED_SHOPPING_LISTS,
  buildEmptyCart,
} from './seed';

/**
 * Single in-memory store backing the mock adapter. Lives for the lifetime of
 * the JS runtime; reset() lets tests start from a clean slate.
 */
export interface MockStore {
  buyers: Buyer[];
  passwords: Record<string, string>;
  roles: Role[];
  company: Company;
  addresses: Address[];
  products: Product[];
  contractPrices: ContractPrice[];
  orders: Order[];
  quotes: Quote[];
  shoppingLists: ShoppingList[];
  invoices: Invoice[];
  cart: Cart;
}

const buildStore = (): MockStore => ({
  buyers: structuredClone(SEED_BUYERS),
  passwords: {
    'admin@acme.test': 'password',
    'senior@acme.test': 'password',
    'buyer@acme.test': 'password',
  },
  roles: structuredClone(SEED_ROLES),
  company: structuredClone(SEED_COMPANY),
  addresses: structuredClone(SEED_ADDRESSES),
  products: structuredClone(SEED_PRODUCTS),
  contractPrices: structuredClone(SEED_CONTRACT_PRICES),
  orders: structuredClone(SEED_ORDERS),
  quotes: structuredClone(SEED_QUOTES),
  shoppingLists: structuredClone(SEED_SHOPPING_LISTS),
  invoices: structuredClone(SEED_INVOICES),
  cart: buildEmptyCart('USD'),
});

let store: MockStore = buildStore();

export const getStore = (): MockStore => store;
export const resetStore = (): void => {
  store = buildStore();
};
