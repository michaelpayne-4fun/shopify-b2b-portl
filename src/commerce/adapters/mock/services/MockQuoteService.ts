import type { QuoteListFilter, QuoteService } from '@/commerce/interfaces';
import type { BuyerContext, Page, Quote, QuoteDraftInput, QuoteLine } from '@/domain/models';
import { NotFoundError, ValidationError } from '@/domain/errors';
import { getStore } from '../data/store';
import { paginate } from '../data/page';

const buildLines = (input: QuoteDraftInput): { lines: QuoteLine[]; subtotal: number } => {
  const store = getStore();
  let subtotal = 0;
  const lines: QuoteLine[] = input.lines.map((line, idx) => {
    const product = store.products.find((p) => p.sku.toLowerCase() === line.sku.toLowerCase());
    if (!product) throw new NotFoundError('Product', line.sku);
    const variant = product.variants.find((v) => v.id === product.defaultVariantId)!;
    const lineTotal = variant.price.amount * line.quantity;
    subtotal += lineTotal;
    return {
      id: `ql-${idx + 1}`,
      sku: variant.sku,
      variantId: variant.id,
      name: product.name,
      quantity: line.quantity,
      unitPrice: variant.price,
      lineTotal: { amount: lineTotal, currency: variant.price.currency },
      notes: line.notes,
    };
  });
  return { lines, subtotal };
};

export class MockQuoteService implements QuoteService {
  async list(context: BuyerContext, filter?: QuoteListFilter): Promise<Page<Quote>> {
    const store = getStore();
    let items = store.quotes.filter((q) => q.companyId === context.company.id);
    if (filter?.status) items = items.filter((q) => q.status === filter.status);
    return paginate(items, filter);
  }

  async get(context: BuyerContext, quoteId: string): Promise<Quote> {
    const store = getStore();
    const quote = store.quotes.find(
      (q) => q.id === quoteId && q.companyId === context.company.id,
    );
    if (!quote) throw new NotFoundError('Quote', quoteId);
    return quote;
  }

  async createDraft(context: BuyerContext, input: QuoteDraftInput): Promise<Quote> {
    if (input.lines.length === 0) throw new ValidationError('Quote must have at least one line');
    const store = getStore();
    const { lines, subtotal } = buildLines(input);
    const id = `quote-${store.quotes.length + 1}-${Date.now()}`;
    const quote: Quote = {
      id,
      number: `Q-${new Date().getUTCFullYear()}-${String(store.quotes.length + 1).padStart(3, '0')}`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      buyerId: context.buyer.id,
      companyId: context.company.id,
      lines,
      notes: input.notes,
      subtotal: { amount: subtotal, currency: context.currency },
      total: { amount: subtotal, currency: context.currency },
    };
    store.quotes.push(quote);
    return quote;
  }

  async updateDraft(
    context: BuyerContext,
    quoteId: string,
    input: QuoteDraftInput,
  ): Promise<Quote> {
    const store = getStore();
    const idx = store.quotes.findIndex((q) => q.id === quoteId);
    if (idx < 0) throw new NotFoundError('Quote', quoteId);
    if (store.quotes[idx].status !== 'draft') {
      throw new ValidationError('Only draft quotes can be edited');
    }
    const { lines, subtotal } = buildLines(input);
    store.quotes[idx] = {
      ...store.quotes[idx],
      lines,
      notes: input.notes,
      updatedAt: new Date().toISOString(),
      subtotal: { amount: subtotal, currency: context.currency },
      total: { amount: subtotal, currency: context.currency },
    };
    return store.quotes[idx];
  }

  async submit(_ctx: BuyerContext, quoteId: string): Promise<Quote> {
    const store = getStore();
    const idx = store.quotes.findIndex((q) => q.id === quoteId);
    if (idx < 0) throw new NotFoundError('Quote', quoteId);
    if (store.quotes[idx].status !== 'draft') {
      throw new ValidationError('Only draft quotes can be submitted');
    }
    store.quotes[idx] = {
      ...store.quotes[idx],
      status: 'submitted',
      updatedAt: new Date().toISOString(),
    };
    return store.quotes[idx];
  }

  async delete(_ctx: BuyerContext, quoteId: string): Promise<void> {
    const store = getStore();
    const idx = store.quotes.findIndex((q) => q.id === quoteId);
    if (idx < 0) throw new NotFoundError('Quote', quoteId);
    if (store.quotes[idx].status !== 'draft') {
      throw new ValidationError('Only draft quotes can be deleted');
    }
    store.quotes.splice(idx, 1);
  }
}
