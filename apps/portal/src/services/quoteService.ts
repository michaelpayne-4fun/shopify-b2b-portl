import { bff } from './bffClient';
import type { Page, Quote, QuoteDraftInput } from '@b2b/domain';

export const listQuotes = (status?: string) =>
  bff.get<Page<Quote>>(`/quotes${status ? `?status=${encodeURIComponent(status)}` : ''}`);
export const getQuote = (id: string) => bff.get<Quote>(`/quotes/${encodeURIComponent(id)}`);
export const createQuoteDraft = (input: QuoteDraftInput) => bff.post<Quote>('/quotes', input);
export const updateQuoteDraft = (id: string, input: QuoteDraftInput) =>
  bff.patch<Quote>(`/quotes/${encodeURIComponent(id)}`, input);
export const submitQuote = (id: string) => bff.post<Quote>(`/quotes/${encodeURIComponent(id)}/submit`);
export const deleteQuote = (id: string) => bff.delete<void>(`/quotes/${encodeURIComponent(id)}`);
export const convertQuoteToCart = (id: string) =>
  bff.post<{ cartId: string }>(`/quotes/${encodeURIComponent(id)}/convert-to-cart`);
