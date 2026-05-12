import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { BuyerContext } from '@b2b/domain';
import { Can } from '../Can';
import { useBuyerContextStore } from '@/state/stores/buyerContextStore';

const ctx = (perms: BuyerContext['buyer']['role']['permissions']): BuyerContext => ({
  buyer: { id: 'b', email: 'a@b.test', firstName: 'A', lastName: 'B',
    role: { id: 'r', name: 'R', isAdmin: false, permissions: perms } },
  company: { id: 'c', name: 'Co', status: 'approved', shopifyCompanyGid: 'gid://Co/1', locations: [] },
  currency: 'USD', locale: 'en-US',
});

describe('<Can />', () => {
  beforeEach(() => { useBuyerContextStore.setState({ context: null }); });

  it('renders children when permission present', () => {
    useBuyerContextStore.setState({ context: ctx(['orders.view']) });
    render(<Can permission="orders.view">visible</Can>);
    expect(screen.getByText('visible')).toBeInTheDocument();
  });
  it('renders fallback when permission missing', () => {
    useBuyerContextStore.setState({ context: ctx([]) });
    render(<Can permission="orders.view" fallback={<span>denied</span>}>x</Can>);
    expect(screen.getByText('denied')).toBeInTheDocument();
  });
  it('renders fallback with no context', () => {
    render(<Can permission="orders.view" fallback={<span>denied</span>}>x</Can>);
    expect(screen.getByText('denied')).toBeInTheDocument();
  });
});
