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
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const isPermission = (value: string): value is Permission =>
  (PERMISSIONS as readonly string[]).includes(value);
