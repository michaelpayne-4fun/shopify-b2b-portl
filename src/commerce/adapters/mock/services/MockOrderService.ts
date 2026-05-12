import type { OrderListFilter, OrderService } from '@/commerce/interfaces';
import type { BuyerContext, Order, Page } from '@/domain/models';
import { NotFoundError } from '@/domain/errors';
import { getStore } from '../data/store';
import { paginate } from '../data/page';

export class MockOrderService implements OrderService {
  async list(context: BuyerContext, filter?: OrderListFilter): Promise<Page<Order>> {
    const store = getStore();
    const scope = filter?.scope ?? 'mine';
    let items = store.orders;
    items = items.filter((o) => o.companyId === context.company.id);
    if (scope === 'mine') {
      items = items.filter((o) => o.buyerId === context.buyer.id);
    }
    if (filter?.status) items = items.filter((o) => o.status === filter.status);
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      items = items.filter(
        (o) => o.number.toLowerCase().includes(q) || (o.poNumber ?? '').toLowerCase().includes(q),
      );
    }
    return paginate(items, filter);
  }

  async get(context: BuyerContext, orderId: string): Promise<Order> {
    const store = getStore();
    const order = store.orders.find(
      (o) => o.id === orderId && o.companyId === context.company.id,
    );
    if (!order) throw new NotFoundError('Order', orderId);
    return order;
  }

  async reorder(context: BuyerContext, orderId: string): Promise<{ cartId: string }> {
    const order = await this.get(context, orderId);
    const store = getStore();
    for (const line of order.lines) {
      store.cart.items.push({
        id: `ci-reorder-${line.id}-${Date.now()}`,
        variantId: line.sku,
        sku: line.sku,
        name: line.name,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
      });
    }
    return { cartId: store.cart.id };
  }
}
