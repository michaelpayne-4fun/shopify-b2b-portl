import type { Permission } from '@b2b/domain';
import { PORTAL_ONLY_PERMISSIONS, isPermission } from '@b2b/domain';

const PORTAL_ONLY = new Set<Permission>(PORTAL_ONLY_PERMISSIONS);

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
  // Defence-in-depth: drop any portal-only permission that somehow
  // arrives via Shopify role data. Portal-only grants must come from
  // the portal DB (role_assignments) and nowhere else.
  return [...new Set<Permission>([...fromRole, ...fromExplicit])].filter((p) => !PORTAL_ONLY.has(p));
};

export const isShopifyLocationAdmin = (roleName: string): boolean => roleName === 'Location admin';
