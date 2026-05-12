import type { Permission } from '@b2b/domain';
import { isPermission } from '@b2b/domain';

/**
 * Shopify B2B emits coarse role names (Location admin / Ordering only /
 * Buyer / custom). We translate them into the canonical Permission
 * union, conservatively. Unknown roles produce no permissions.
 *
 * Shopify-side roles never grant portal-only permissions like
 * `approvals.act`, `shoppingLists.manage`, `quotes.*`, `portal.admin`
 * — those come from the portal DB only.
 */
const ROLE_TO_PERMISSIONS: Record<string, Permission[]> = {
  'Location admin': [
    'account.view', 'account.update',
    'orders.view', 'orders.viewCompany', 'orders.reorder',
    'cart.view', 'cart.update',
    'checkout.begin',
    'addresses.view', 'addresses.manage',
    'company.view',
    'users.view',
  ],
  'Ordering only': [
    'account.view',
    'orders.view', 'orders.reorder',
    'cart.view', 'cart.update',
    'checkout.begin',
    'addresses.view',
    'company.view',
  ],
  Buyer: [
    'account.view',
    'orders.view',
    'cart.view', 'cart.update',
    'addresses.view',
    'company.view',
  ],
};

export const mapShopifyRoleToPermissions = (
  roleName: string,
  explicitPermissions: readonly string[] = [],
): Permission[] => {
  const fromRole = ROLE_TO_PERMISSIONS[roleName] ?? [];
  const fromExplicit = explicitPermissions.filter(isPermission);
  const merged = new Set<Permission>([...fromRole, ...fromExplicit]);
  return [...merged];
};

export const isShopifyLocationAdmin = (roleName: string): boolean => roleName === 'Location admin';
