import type { ReactNode } from 'react';
import type { Permission } from '@/domain/models';
import { PermissionPolicy } from '@/domain/policies/PermissionPolicy';
import { useBuyerContextStore } from '@/state/stores/buyerContextStore';

export interface CanProps {
  permission: Permission | Permission[];
  fallback?: ReactNode;
  children: ReactNode;
}

export const Can = ({ permission, fallback = null, children }: CanProps) => {
  const context = useBuyerContextStore((s) => s.context);
  const allowed = PermissionPolicy.can(context, permission);
  return <>{allowed ? children : fallback}</>;
};

export const usePermission = (permission: Permission | Permission[]): boolean => {
  const context = useBuyerContextStore((s) => s.context);
  return PermissionPolicy.can(context, permission);
};
