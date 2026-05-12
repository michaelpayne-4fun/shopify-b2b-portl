import type { QuoteListFilter, QuoteService } from '@/commerce/interfaces';
import type { BuyerContext, Page, Quote, QuoteDraftInput } from '@/domain/models';
import type { B2bClient } from '../client/b2bClient';
import type { BCQuoteResponse } from '../types/responses';
import { mapBcQuote } from '../mappers/quoteMapper';

interface BCQuoteListResponse {
  data: BCQuoteResponse['data'][];
  meta: { pagination: { current_page: number; per_page: number; total: number; total_pages: number } };
}

const toBody = (input: QuoteDraftInput) => ({
  notes: input.notes,
  shipping_address_id: input.shippingAddressId,
  billing_address_id: input.billingAddressId,
  items: input.lines.map((l) => ({ sku: l.sku, quantity: l.quantity, notes: l.notes })),
});

export class BigCommerceQuoteService implements QuoteService {
  constructor(private readonly client: B2bClient) {}

  async list(_ctx: BuyerContext, filter?: QuoteListFilter): Promise<Page<Quote>> {
    const params = new URLSearchParams();
    params.set('page', String(filter?.page ?? 1));
    params.set('per_page', String(filter?.pageSize ?? 20));
    if (filter?.status) params.set('status', filter.status);
    const resp = await this.client.http.request<BCQuoteListResponse>({
      url: `/v3/io/quotes?${params.toString()}`,
    });
    return {
      items: resp.data.map(mapBcQuote),
      page: resp.meta.pagination.current_page,
      pageSize: resp.meta.pagination.per_page,
      totalItems: resp.meta.pagination.total,
      totalPages: resp.meta.pagination.total_pages,
    };
  }

  async get(_ctx: BuyerContext, quoteId: string): Promise<Quote> {
    const resp = await this.client.http.request<BCQuoteResponse>({
      url: `/v3/io/quotes/${encodeURIComponent(quoteId)}`,
    });
    return mapBcQuote(resp.data);
  }

  async createDraft(_ctx: BuyerContext, input: QuoteDraftInput): Promise<Quote> {
    const resp = await this.client.http.request<BCQuoteResponse>({
      url: '/v3/io/quotes',
      method: 'POST',
      body: toBody(input),
    });
    return mapBcQuote(resp.data);
  }

  async updateDraft(_ctx: BuyerContext, quoteId: string, input: QuoteDraftInput): Promise<Quote> {
    const resp = await this.client.http.request<BCQuoteResponse>({
      url: `/v3/io/quotes/${encodeURIComponent(quoteId)}`,
      method: 'PUT',
      body: toBody(input),
    });
    return mapBcQuote(resp.data);
  }

  async submit(_ctx: BuyerContext, quoteId: string): Promise<Quote> {
    const resp = await this.client.http.request<BCQuoteResponse>({
      url: `/v3/io/quotes/${encodeURIComponent(quoteId)}/submit`,
      method: 'POST',
    });
    return mapBcQuote(resp.data);
  }

  async delete(_ctx: BuyerContext, quoteId: string): Promise<void> {
    await this.client.http.request<void>({
      url: `/v3/io/quotes/${encodeURIComponent(quoteId)}`,
      method: 'DELETE',
    });
  }
}
