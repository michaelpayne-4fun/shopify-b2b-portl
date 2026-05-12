import { bff } from './bffClient';
import type { Order, OrderScope, Page } from '@b2b/domain';

export interface OrderListFilter {
  scope?: OrderScope;
  status?: string;
  search?: string;
}

export const listOrders = (filter: OrderListFilter = {}) => {
  const params = new URLSearchParams();
  if (filter.scope) params.set('scope', filter.scope);
  if (filter.status) params.set('status', filter.status);
  if (filter.search) params.set('search', filter.search);
  return bff.get<Page<Order>>(`/orders?${params.toString()}`);
};

export const getOrder = (id: string) => bff.get<Order>(`/orders/${encodeURIComponent(id)}`);

export const reorder = (id: string) =>
  bff.post<{ cartId: string }>(`/orders/${encodeURIComponent(id)}/reorder`);
