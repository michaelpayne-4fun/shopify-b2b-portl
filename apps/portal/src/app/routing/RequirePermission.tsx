import { Outlet } from 'react-router-dom';
import type { Permission } from '@b2b/domain';
import { EmptyState } from '@/ui/components/EmptyState';
import { usePermission } from '@/ui/components/Can';

export const RequirePermission = ({ permission }: { permission: Permission | Permission[] }) => {
  const allowed = usePermission(permission);
  if (!allowed) {
    return (
      <EmptyState
        title="You don't have access to this page"
        description="Contact a company administrator if you believe this is a mistake."
      />
    );
  }
  return <Outlet />;
};
