import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCommerce } from '@/app/providers/CommerceProvider';
import { useBuyerContext } from '@/features/auth/hooks/useBuyerContext';
import { queryKeys } from '@/state/queries/queryKeys';
import type { AddCartItemInput } from '@/domain/models';

export const useCart = () => {
  const commerce = useCommerce();
  const context = useBuyerContext();
  return useQuery({
    queryKey: queryKeys.cart,
    queryFn: () => commerce.cart.getCart(context),
  });
};

export const useAddToCart = () => {
  const commerce = useCommerce();
  const context = useBuyerContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddCartItemInput) => commerce.cart.addItem(context, input),
    onSuccess: (cart) => qc.setQueryData(queryKeys.cart, cart),
  });
};

export const useUpdateCartItem = () => {
  const commerce = useCommerce();
  const context = useBuyerContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      commerce.cart.updateItem(context, itemId, quantity),
    onSuccess: (cart) => qc.setQueryData(queryKeys.cart, cart),
  });
};

export const useRemoveCartItem = () => {
  const commerce = useCommerce();
  const context = useBuyerContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => commerce.cart.removeItem(context, itemId),
    onSuccess: (cart) => qc.setQueryData(queryKeys.cart, cart),
  });
};

export const useBeginCheckout = () => {
  const commerce = useCommerce();
  const context = useBuyerContext();
  return useMutation({
    mutationFn: (cartId: string) => commerce.checkout.beginCheckout(context, cartId),
  });
};
