import type { BuyerContext, Page, PageRequest, Quote, QuoteDraftInput } from '@/domain/models';

export interface QuoteListFilter extends PageRequest {
  status?: string;
}

export interface QuoteService {
  list(context: BuyerContext, filter?: QuoteListFilter): Promise<Page<Quote>>;
  get(context: BuyerContext, quoteId: string): Promise<Quote>;
  createDraft(context: BuyerContext, input: QuoteDraftInput): Promise<Quote>;
  updateDraft(context: BuyerContext, quoteId: string, input: QuoteDraftInput): Promise<Quote>;
  submit(context: BuyerContext, quoteId: string): Promise<Quote>;
  delete(context: BuyerContext, quoteId: string): Promise<void>;
}
