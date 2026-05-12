import { describe, expect, it } from 'vitest';
import { advanceQuote } from '../quoteStateMachine';

describe('advanceQuote', () => {
  it('submit auto-approves when approvals disabled', () => {
    expect(advanceQuote({ status: 'draft' }, 'submit', { approvalsEnabled: false })).toBe('approved');
  });
  it('submit goes to submitted when approvals enabled', () => {
    expect(advanceQuote({ status: 'draft' }, 'submit', { approvalsEnabled: true })).toBe('submitted');
  });
  it('approve advances submitted -> approved', () => {
    expect(advanceQuote({ status: 'submitted' }, 'approve', { approvalsEnabled: true })).toBe('approved');
  });
  it('convertToCart advances approved -> ordered', () => {
    expect(advanceQuote({ status: 'approved' }, 'convertToCart', { approvalsEnabled: false })).toBe('ordered');
  });
  it('rejects illegal transitions', () => {
    expect(() => advanceQuote({ status: 'ordered' }, 'submit', { approvalsEnabled: false })).toThrow();
    expect(() => advanceQuote({ status: 'rejected' }, 'approve', { approvalsEnabled: true })).toThrow();
  });
  it('expire works from draft, submitted, approved', () => {
    expect(advanceQuote({ status: 'draft' }, 'expire', { approvalsEnabled: false })).toBe('expired');
    expect(advanceQuote({ status: 'submitted' }, 'expire', { approvalsEnabled: true })).toBe('expired');
    expect(advanceQuote({ status: 'approved' }, 'expire', { approvalsEnabled: true })).toBe('expired');
  });
});
