import type { Permission } from '@/domain/models';
import { isPermission } from '@/domain/models';

/**
 * BigCommerce B2B Edition emits permission strings using its own taxonomy
 * (e.g. `order:view`, `quote.submit`, `address:edit`). This map translates
 * the strings we have observed into the canonical domain Permission union.
 * Anything we have not mapped is dropped; we never invent domain permissions
 * out of unknown BC strings.
 */
const BC_PERMISSION_MAP: Record<string, Permission> = {
  'account:view': 'account.view',
  'account:edit': 'account.update',
  'order:view': 'orders.view',
  'order:viewCompany': 'orders.viewCompany',
  'order:reorder': 'orders.reorder',
  'quote:view': 'quotes.view',
  'quote:create': 'quotes.create',
  'quote:edit': 'quotes.update',
  'quote:submit': 'quotes.submit',
  'quote:delete': 'quotes.delete',
  'cart:view': 'cart.view',
  'cart:edit': 'cart.update',
  'checkout:begin': 'checkout.begin',
  'address:view': 'addresses.view',
  'address:edit': 'addresses.manage',
  'company:view': 'company.view',
  'company:manage': 'company.manage',
  'user:view': 'users.view',
  'user:manage': 'users.manage',
  'shopping_list:view': 'shoppingLists.view',
  'shopping_list:edit': 'shoppingLists.manage',
  'invoice:view': 'invoices.view',
  'invoice:pay': 'invoices.pay',
  'approval:act': 'approvals.act',
};

export const mapBcPermissions = (raw: readonly string[]): Permission[] => {
  const out: Permission[] = [];
  const seen = new Set<Permission>();
  for (const value of raw) {
    const mapped = BC_PERMISSION_MAP[value];
    if (mapped && !seen.has(mapped)) {
      out.push(mapped);
      seen.add(mapped);
    } else if (isPermission(value) && !seen.has(value)) {
      // Some installations already emit canonical names; allow them through.
      out.push(value);
      seen.add(value);
    }
  }
  return out;
};
