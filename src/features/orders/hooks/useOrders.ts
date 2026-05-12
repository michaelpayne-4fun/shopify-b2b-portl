import { useQuery } from '@tanstack/react-query';
import { useCommerce } from '@/app/providers/CommerceProvider';
import { useBuyerContext } from '@/features/auth/hooks/useBuyerContext';
import type { OrderListFilter } from '@/commerce/interfaces';
import { queryKeys } from '@/state/queries/queryKeys';

export const useOrders = (filter?: OrderListFilter) => {
  const commerce = useCommerce();
  const context = useBuyerContext();
  return useQuery({
    queryKey: queryKeys.ordersList(filter),
    queryFn: () => commerce.order.list(context, filter),
  });
};

export const useOrder = (orderId: string | undefined) => {
  const commerce = useCommerce();
  const context = useBuyerContext();
  return useQuery({
    queryKey: queryKeys.order(orderId ?? ''),
    enabled: !!orderId,
    queryFn: () => commerce.order.get(context, orderId!),
  });
};
