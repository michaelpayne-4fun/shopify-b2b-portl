import type { BuyerContext, Order, OrderScope, Page, PageRequest } from '@/domain/models';

export interface OrderListFilter extends PageRequest {
  scope?: OrderScope;
  status?: string;
  search?: string;
}

export interface OrderService {
  list(context: BuyerContext, filter?: OrderListFilter): Promise<Page<Order>>;
  get(context: BuyerContext, orderId: string): Promise<Order>;
  reorder(context: BuyerContext, orderId: string): Promise<{ cartId: string }>;
}
