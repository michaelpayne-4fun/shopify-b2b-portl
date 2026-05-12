import type { BuyerContext } from '../models/context';
import type { Permission } from '../models/permission';

export type AnyPermission = Permission | readonly Permission[];

export const PermissionPolicy = {
  has(context: BuyerContext | null, permission: Permission): boolean {
    if (!context) return false;
    if (context.buyer.role.isAdmin) return true;
    return context.buyer.role.permissions.includes(permission);
  },

  hasAny(context: BuyerContext | null, permissions: readonly Permission[]): boolean {
    return permissions.some((p) => PermissionPolicy.has(context, p));
  },

  hasAll(context: BuyerContext | null, permissions: readonly Permission[]): boolean {
    return permissions.every((p) => PermissionPolicy.has(context, p));
  },

  can(context: BuyerContext | null, requirement: AnyPermission): boolean {
    return Array.isArray(requirement)
      ? PermissionPolicy.hasAll(context, requirement)
      : PermissionPolicy.has(context, requirement as Permission);
  },
};
