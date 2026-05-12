import { Outlet } from 'react-router-dom';
import type { Permission } from '@/domain/models';
import { usePermission } from '@/ui/components/Can';
import { EmptyState } from '@/ui/components/EmptyState';

export const RequirePermission = ({ permission }: { permission: Permission | Permission[] }) => {
  const allowed = usePermission(permission);
  if (!allowed) {
    return (
      <EmptyState
        title="You don't have access to this page"
        description="If you believe this is a mistake, contact a company administrator."
      />
    );
  }
  return <Outlet />;
};
