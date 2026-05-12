import type { OrderListFilter, QuoteListFilter } from '@/commerce/interfaces';
import type { PageRequest } from '@/domain/models';

export const queryKeys = {
  cart: ['cart'] as const,
  company: ['company'] as const,
  profile: ['profile'] as const,
  catalogSearch: (query: string, page?: PageRequest) =>
    ['catalog', 'search', query, page?.page ?? 1, page?.pageSize ?? 20] as const,
  productBySku: (sku: string) => ['catalog', 'product', sku] as const,
  ordersList: (filter?: OrderListFilter) => ['orders', 'list', filter ?? {}] as const,
  order: (orderId: string) => ['orders', 'detail', orderId] as const,
  quotesList: (filter?: QuoteListFilter) => ['quotes', 'list', filter ?? {}] as const,
  quote: (quoteId: string) => ['quotes', 'detail', quoteId] as const,
  addressesList: (page?: PageRequest) => ['addresses', 'list', page ?? {}] as const,
  usersList: (page?: PageRequest) => ['users', 'list', page ?? {}] as const,
  roles: ['roles'] as const,
};
