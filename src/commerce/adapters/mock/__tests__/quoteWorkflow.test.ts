import { beforeEach, describe, expect, it } from 'vitest';
import { createMockAdapter, resetStore } from '../index';
import { QuotePolicy } from '@/domain/policies/QuotePolicy';
import { appConfig } from '@/app/config';
import type { BuyerContext } from '@/domain/models';

describe('quote workflow (mock adapter)', () => {
  beforeEach(() => resetStore());

  it('creates, edits, and submits a quote with the right state transitions', async () => {
    const adapter = createMockAdapter();
    const session = await adapter.auth.login({ email: 'senior@acme.test', password: 'password' });
    const { company } = await adapter.company.resolveContext(session);
    const ctx: BuyerContext = {
      buyer: session.buyer,
      company,
      currency: appConfig.defaultCurrency,
      locale: appConfig.defaultLocale,
    };

    const draft = await adapter.quote.createDraft(ctx, {
      lines: [{ sku: 'BOLT-001', quantity: 5 }],
    });
    expect(draft.status).toBe('draft');
    expect(QuotePolicy.canEdit(ctx, draft)).toBe(true);
    expect(QuotePolicy.canSubmit(ctx, draft)).toBe(true);

    const submitted = await adapter.quote.submit(ctx, draft.id);
    expect(submitted.status).toBe('submitted');
    expect(QuotePolicy.canEdit(ctx, submitted)).toBe(false);
    await expect(adapter.quote.submit(ctx, draft.id)).rejects.toThrow();
  });
});
