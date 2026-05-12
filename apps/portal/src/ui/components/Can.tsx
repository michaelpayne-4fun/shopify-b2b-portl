import type { ReactNode } from 'react';
import type { Permission } from '@b2b/domain';
import { PermissionPolicy } from '@b2b/domain';
import { useBuyerContextStore } from '@/state/stores/buyerContextStore';

export const Can = ({
  permission,
  fallback = null,
  children,
}: {
  permission: Permission | Permission[];
  fallback?: ReactNode;
  children: ReactNode;
}) => {
  const context = useBuyerContextStore((s) => s.context);
  return <>{PermissionPolicy.can(context, permission) ? children : fallback}</>;
};

export const usePermission = (permission: Permission | Permission[]): boolean => {
  const context = useBuyerContextStore((s) => s.context);
  return PermissionPolicy.can(context, permission);
};
