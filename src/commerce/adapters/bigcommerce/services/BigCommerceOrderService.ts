import type { OrderListFilter, OrderService } from '@/commerce/interfaces';
import type { BuyerContext, Order, Page } from '@/domain/models';
import type { B2bClient } from '../client/b2bClient';
import type { BCOrderResponse } from '../types/responses';
import { mapBcOrder } from '../mappers/orderMapper';

interface BCOrderListResponse {
  data: BCOrderResponse['data'][];
  meta: { pagination: { current_page: number; per_page: number; total: number; total_pages: number } };
}

export class BigCommerceOrderService implements OrderService {
  constructor(private readonly client: B2bClient) {}

  async list(context: BuyerContext, filter?: OrderListFilter): Promise<Page<Order>> {
    const params = new URLSearchParams();
    params.set('page', String(filter?.page ?? 1));
    params.set('per_page', String(filter?.pageSize ?? 20));
    if (filter?.status) params.set('status', filter.status);
    if (filter?.search) params.set('search', filter.search);
    if ((filter?.scope ?? 'mine') === 'company') {
      params.set('scope', 'company');
    } else {
      params.set('buyer_id', context.buyer.id);
    }
    const resp = await this.client.http.request<BCOrderListResponse>({
      url: `/v3/io/orders?${params.toString()}`,
    });
    return {
      items: resp.data.map(mapBcOrder),
      page: resp.meta.pagination.current_page,
      pageSize: resp.meta.pagination.per_page,
      totalItems: resp.meta.pagination.total,
      totalPages: resp.meta.pagination.total_pages,
    };
  }

  async get(_ctx: BuyerContext, orderId: string): Promise<Order> {
    const resp = await this.client.http.request<BCOrderResponse>({
      url: `/v3/io/orders/${encodeURIComponent(orderId)}`,
    });
    return mapBcOrder(resp.data);
  }

  async reorder(_ctx: BuyerContext, orderId: string): Promise<{ cartId: string }> {
    const resp = await this.client.http.request<{ data: { cart_id: string } }>({
      url: `/v3/io/orders/${encodeURIComponent(orderId)}/reorder`,
      method: 'POST',
    });
    return { cartId: resp.data.cart_id };
  }
}
