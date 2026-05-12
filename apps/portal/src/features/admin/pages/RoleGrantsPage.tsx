import {
  Card, CardContent, Checkbox, FormControlLabel, Stack, Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Permission } from '@b2b/domain';
import { PORTAL_ONLY_PERMISSIONS } from '@b2b/domain';
import { listRoleGrants, setRoleGrants } from '@/services/adminService';
import { listUsers } from '@/services/userService';
import { queryKeys } from '@/state/queries/queryKeys';
import { PageHeader } from '@/ui/components/PageHeader';
import { LoadingState } from '@/ui/components/LoadingState';
import { ErrorState } from '@/ui/components/ErrorState';
import { appConfig } from '@/app/config/env';

const ASSIGNABLE_BASE: Permission[] = PORTAL_ONLY_PERMISSIONS as Permission[];

export const RoleGrantsPage = () => {
  const qc = useQueryClient();
  const users = useQuery({ queryKey: queryKeys.users, queryFn: listUsers });
  const grants = useQuery({ queryKey: queryKeys.admin.grants, queryFn: listRoleGrants });
  const save = useMutation({
    mutationFn: ({ userId, grants: g }: { userId: string; grants: Permission[] }) =>
      setRoleGrants(userId, g),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.admin.grants }),
  });

  if (users.isLoading || grants.isLoading) return <LoadingState />;
  if (users.error) return <ErrorState error={users.error} />;
  if (grants.error) return <ErrorState error={grants.error} />;

  const assignable = ASSIGNABLE_BASE.filter(
    (p) => p !== 'approvals.act' || appConfig.features.approvals,
  );

  const byUser = new Map(grants.data?.map((g) => [g.userId, g.grants]) ?? []);

  return (
    <>
      <PageHeader title="Role grants"
        description="Augment Shopify's coarse role with portal-only permissions." />
      <Stack spacing={2}>
        {(users.data?.items ?? []).map((u) => {
          const current = byUser.get(u.id) ?? [];
          const toggle = (perm: Permission) => {
            const next = current.includes(perm)
              ? current.filter((p) => p !== perm)
              : [...current, perm];
            save.mutate({ userId: u.id, grants: next });
          };
          return (
            <Card key={u.id}><CardContent>
              <Typography variant="h6">{u.firstName} {u.lastName}</Typography>
              <Typography variant="body2" color="text.secondary">
                Shopify role: {u.role.name}{u.role.isAdmin ? ' (admin)' : ''} · {u.email}
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={2} sx={{ mt: 1 }}>
                {assignable.map((p) => (
                  <FormControlLabel key={p}
                    control={
                      <Checkbox checked={current.includes(p)} onChange={() => toggle(p)}
                        disabled={save.isPending} />
                    }
                    label={p} />
                ))}
              </Stack>
            </CardContent></Card>
          );
        })}
      </Stack>
    </>
  );
};
