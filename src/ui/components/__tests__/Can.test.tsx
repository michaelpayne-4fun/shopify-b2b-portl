import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Can } from '../Can';
import { useBuyerContextStore } from '@/state/stores/buyerContextStore';
import type { BuyerContext } from '@/domain/models';

const ctxWith = (permissions: BuyerContext['buyer']['role']['permissions']): BuyerContext => ({
  buyer: {
    id: 'b',
    email: 'a@b.test',
    firstName: 'A',
    lastName: 'B',
    role: { id: 'r', name: 'R', isAdmin: false, permissions },
  },
  company: { id: 'c', name: 'Co', status: 'approved', locations: [] },
  currency: 'USD',
  locale: 'en-US',
});

describe('<Can />', () => {
  beforeEach(() => {
    useBuyerContextStore.setState({ context: null });
  });

  it('renders children when permission granted', () => {
    useBuyerContextStore.setState({ context: ctxWith(['orders.view']) });
    render(<Can permission="orders.view">visible</Can>);
    expect(screen.getByText('visible')).toBeInTheDocument();
  });

  it('renders fallback when permission denied', () => {
    useBuyerContextStore.setState({ context: ctxWith([]) });
    render(
      <Can permission="orders.view" fallback={<span>denied</span>}>
        visible
      </Can>,
    );
    expect(screen.queryByText('visible')).toBeNull();
    expect(screen.getByText('denied')).toBeInTheDocument();
  });

  it('renders fallback when no context', () => {
    render(
      <Can permission="orders.view" fallback={<span>denied</span>}>
        visible
      </Can>,
    );
    expect(screen.getByText('denied')).toBeInTheDocument();
  });
});
