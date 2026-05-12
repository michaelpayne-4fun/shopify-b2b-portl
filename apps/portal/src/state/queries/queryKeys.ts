import type { OrderListFilter } from '@/services/orderService';

export const queryKeys = {
  me: ['auth', 'me'] as const,
  company: ['company'] as const,
  cart: ['cart'] as const,
  catalog: {
    search: (q: string) => ['catalog', 'search', q] as const,
    sku: (sku: string) => ['catalog', 'sku', sku] as const,
  },
  orders: {
    list: (filter: OrderListFilter) => ['orders', 'list', filter] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
  },
  quotes: {
    list: (status?: string) => ['quotes', 'list', status ?? 'any'] as const,
    detail: (id: string) => ['quotes', 'detail', id] as const,
  },
  shoppingLists: {
    list: ['shopping-lists', 'list'] as const,
    detail: (id: string) => ['shopping-lists', 'detail', id] as const,
  },
  addresses: ['addresses'] as const,
  users: ['users'] as const,
  roles: ['roles'] as const,
  admin: {
    overview: ['admin', 'overview'] as const,
    settings: ['admin', 'company-settings'] as const,
    grants: ['admin', 'role-grants'] as const,
    audit: ['admin', 'audit-log'] as const,
    features: ['admin', 'features'] as const,
  },
};
