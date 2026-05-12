/**
 * Canonical permission union. Shopify-derived permissions plus
 * portal-DB-granted permissions both flatten into this set before
 * reaching any UI gate. See packages/db/src/schema/roles.ts for the
 * grant table and apps/server/src/auth/permissions.ts for the merger.
 *
 * IMPORTANT: portal.admin is granted exclusively from inside the
 * portal admin UI (plus the bootstrap rule in §3.5 of the plan). It is
 * never sourced from Shopify.
 */
export const PERMISSIONS = [
  'account.view',
  'account.update',
  'orders.view',
  'orders.viewCompany',
  'orders.reorder',
  'quotes.view',
  'quotes.create',
  'quotes.update',
  'quotes.submit',
  'quotes.delete',
  'cart.view',
  'cart.update',
  'checkout.begin',
  'addresses.view',
  'addresses.manage',
  'company.view',
  'company.manage',
  'users.view',
  'users.manage',
  'shoppingLists.view',
  'shoppingLists.manage',
  'invoices.view',
  'invoices.pay',
  'approvals.act',
  'portal.admin',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const isPermission = (value: string): value is Permission =>
  (PERMISSIONS as readonly string[]).includes(value);

/** Permissions that can only be granted through the portal DB (never Shopify-derived). */
export const PORTAL_ONLY_PERMISSIONS: readonly Permission[] = [
  'approvals.act',
  'shoppingLists.manage',
  'quotes.create',
  'quotes.update',
  'quotes.submit',
  'quotes.delete',
  'portal.admin',
];
