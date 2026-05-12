import type { Order } from '../models/order';
import type { BuyerContext } from '../models/context';
import { PermissionPolicy } from './PermissionPolicy';

export const OrderPolicy = {
  canReorder(context: BuyerContext | null, order: Order): boolean {
    if (!PermissionPolicy.has(context, 'orders.reorder')) return false;
    return order.status === 'completed' || order.status === 'shipped';
  },

  canViewCompanyOrders(context: BuyerContext | null): boolean {
    return PermissionPolicy.has(context, 'orders.viewCompany');
  },
};
