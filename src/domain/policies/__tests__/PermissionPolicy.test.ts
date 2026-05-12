import { describe, expect, it } from 'vitest';
import { PermissionPolicy } from '../PermissionPolicy';
import type { BuyerContext } from '@/domain/models';

const buildContext = (overrides: Partial<BuyerContext['buyer']['role']> = {}): BuyerContext => ({
  buyer: {
    id: 'b1',
    email: 'a@b.test',
    firstName: 'A',
    lastName: 'B',
    role: {
      id: 'r1',
      name: 'Buyer',
      isAdmin: false,
      permissions: ['orders.view'],
      ...overrides,
    },
  },
  company: { id: 'c1', name: 'Co', status: 'approved', locations: [] },
  currency: 'USD',
  locale: 'en-US',
});

describe('PermissionPolicy', () => {
  it('returns false for null context', () => {
    expect(PermissionPolicy.has(null, 'orders.view')).toBe(false);
  });

  it('returns true when permission present', () => {
    expect(PermissionPolicy.has(buildContext(), 'orders.view')).toBe(true);
  });

  it('returns false when permission missing', () => {
    expect(PermissionPolicy.has(buildContext(), 'company.manage')).toBe(false);
  });

  it('admins are granted any permission', () => {
    const ctx = buildContext({ isAdmin: true, permissions: [] });
    expect(PermissionPolicy.has(ctx, 'company.manage')).toBe(true);
  });

  it('hasAny matches at least one', () => {
    expect(PermissionPolicy.hasAny(buildContext(), ['company.manage', 'orders.view'])).toBe(true);
  });

  it('hasAll requires every permission', () => {
    expect(PermissionPolicy.hasAll(buildContext(), ['orders.view', 'company.manage'])).toBe(false);
  });
});
