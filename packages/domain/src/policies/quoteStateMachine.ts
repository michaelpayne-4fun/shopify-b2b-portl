import type { Quote, QuoteStatus } from '../quote';
import { ValidationError } from '../errors';

export type QuoteTransition =
  | 'submit'
  | 'autoApprove'
  | 'approve'
  | 'reject'
  | 'expire'
  | 'convertToCart';

interface TransitionContext {
  approvalsEnabled: boolean;
}

const TABLE: Record<QuoteStatus, Partial<Record<QuoteTransition, QuoteStatus>>> = {
  draft: {
    submit: 'submitted',
    autoApprove: 'approved',
    expire: 'expired',
  },
  submitted: {
    approve: 'approved',
    reject: 'rejected',
    expire: 'expired',
  },
  approved: {
    convertToCart: 'ordered',
    expire: 'expired',
  },
  rejected: {},
  expired: {},
  ordered: {},
};

/**
 * Returns the next status after a transition, or throws if the transition
 * is not legal from the current status.
 *
 * When `approvalsEnabled` is false, `submit` is rewritten to `autoApprove`
 * so the same call-site advances the quote past `submitted` directly into
 * `approved`.
 */
export const advanceQuote = (
  q: Pick<Quote, 'status'>,
  transition: QuoteTransition,
  ctx: TransitionContext,
): QuoteStatus => {
  const effective: QuoteTransition =
    transition === 'submit' && !ctx.approvalsEnabled ? 'autoApprove' : transition;
  const next = TABLE[q.status]?.[effective];
  if (!next) {
    throw new ValidationError(
      `Quote in status "${q.status}" cannot accept transition "${transition}"`,
    );
  }
  return next;
};
