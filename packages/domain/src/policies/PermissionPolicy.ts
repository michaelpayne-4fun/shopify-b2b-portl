import type { BuyerContext } from '../context';
import type { Permission } from '../permission';

export type AnyPermission = Permission | readonly Permission[];

export const PermissionPolicy = {
  has(context: BuyerContext | null, permission: Permission): boolean {
    if (!context) return false;
    if (context.buyer.role.isAdmin) return true;
    return context.buyer.role.permissions.includes(permission);
  },
  hasAny(context: BuyerContext | null, perms: readonly Permission[]): boolean {
    return perms.some((p) => PermissionPolicy.has(context, p));
  },
  hasAll(context: BuyerContext | null, perms: readonly Permission[]): boolean {
    return perms.every((p) => PermissionPolicy.has(context, p));
  },
  can(context: BuyerContext | null, req: AnyPermission): boolean {
    return Array.isArray(req)
      ? PermissionPolicy.hasAll(context, req)
      : PermissionPolicy.has(context, req as Permission);
  },
};
