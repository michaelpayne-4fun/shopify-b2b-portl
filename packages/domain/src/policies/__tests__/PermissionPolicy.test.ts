import { describe, expect, it } from 'vitest';
import type { BuyerContext } from '../../context';
import type { Permission } from '../../permission';
import { PermissionPolicy } from '../PermissionPolicy';

const ctx = (perms: Permission[], isAdmin = false): BuyerContext => ({
  buyer: {
    id: 'b1',
    email: 'a@b.test',
    firstName: 'A',
    lastName: 'B',
    role: { id: 'r1', name: 'Buyer', isAdmin, permissions: perms },
  },
  company: { id: 'c1', name: 'Co', status: 'approved', shopifyCompanyGid: 'gid://co/1', locations: [] },
  currency: 'USD',
  locale: 'en-US',
});

describe('PermissionPolicy', () => {
  it('returns false for null context', () => {
    expect(PermissionPolicy.has(null, 'orders.view')).toBe(false);
  });
  it('grants present permission', () => {
    expect(PermissionPolicy.has(ctx(['orders.view']), 'orders.view')).toBe(true);
  });
  it('denies missing permission', () => {
    expect(PermissionPolicy.has(ctx(['orders.view']), 'portal.admin')).toBe(false);
  });
  it('admin gets everything', () => {
    expect(PermissionPolicy.has(ctx([], true), 'portal.admin')).toBe(true);
  });
  it('hasAll requires every permission', () => {
    expect(PermissionPolicy.hasAll(ctx(['orders.view']), ['orders.view', 'portal.admin'])).toBe(false);
  });
});
