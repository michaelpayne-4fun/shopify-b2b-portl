import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCommerce } from '@/app/providers/CommerceProvider';
import { useBuyerContext } from '@/features/auth/hooks/useBuyerContext';
import type { AddressInput, PageRequest } from '@/domain/models';
import { queryKeys } from '@/state/queries/queryKeys';

export const useAddresses = (pageRequest?: PageRequest) => {
  const commerce = useCommerce();
  const context = useBuyerContext();
  return useQuery({
    queryKey: queryKeys.addressesList(pageRequest),
    queryFn: () => commerce.address.list(context, pageRequest),
  });
};

export const useCreateAddress = () => {
  const commerce = useCommerce();
  const context = useBuyerContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddressInput) => commerce.address.create(context, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
  });
};

export const useDeleteAddress = () => {
  const commerce = useCommerce();
  const context = useBuyerContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => commerce.address.delete(context, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
  });
};
