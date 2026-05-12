import type { Quote } from '../models/quote';
import type { BuyerContext } from '../models/context';
import { PermissionPolicy } from './PermissionPolicy';

export const QuotePolicy = {
  canEdit(context: BuyerContext | null, quote: Quote): boolean {
    if (!PermissionPolicy.has(context, 'quotes.update')) return false;
    return quote.status === 'draft';
  },

  canSubmit(context: BuyerContext | null, quote: Quote): boolean {
    if (!PermissionPolicy.has(context, 'quotes.submit')) return false;
    return quote.status === 'draft' && quote.lines.length > 0;
  },

  canConvertToOrder(context: BuyerContext | null, quote: Quote): boolean {
    if (!PermissionPolicy.has(context, 'checkout.begin')) return false;
    return quote.status === 'approved';
  },
};
