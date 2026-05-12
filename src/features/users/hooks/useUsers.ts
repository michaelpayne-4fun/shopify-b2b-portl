import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCommerce } from '@/app/providers/CommerceProvider';
import { useBuyerContext } from '@/features/auth/hooks/useBuyerContext';
import { queryKeys } from '@/state/queries/queryKeys';
import type { InviteUserInput } from '@/commerce/interfaces';

export const useUsers = () => {
  const commerce = useCommerce();
  const context = useBuyerContext();
  return useQuery({
    queryKey: queryKeys.usersList(),
    queryFn: () => commerce.role.listUsers(context),
  });
};

export const useRoles = () => {
  const commerce = useCommerce();
  const context = useBuyerContext();
  return useQuery({
    queryKey: queryKeys.roles,
    queryFn: () => commerce.role.listRoles(context),
  });
};

export const useInviteUser = () => {
  const commerce = useCommerce();
  const context = useBuyerContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: InviteUserInput) => commerce.role.inviteUser(context, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
};
