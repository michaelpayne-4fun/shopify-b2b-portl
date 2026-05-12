import type { BuyerContext } from '../context';
import type { Quote } from '../quote';
import { PermissionPolicy } from './PermissionPolicy';

export const QuotePolicy = {
  canEdit(ctx: BuyerContext | null, q: Quote): boolean {
    if (!PermissionPolicy.has(ctx, 'quotes.update')) return false;
    return q.status === 'draft';
  },
  canSubmit(ctx: BuyerContext | null, q: Quote): boolean {
    if (!PermissionPolicy.has(ctx, 'quotes.submit')) return false;
    return q.status === 'draft' && q.lines.length > 0;
  },
  canConvertToCart(ctx: BuyerContext | null, q: Quote): boolean {
    if (!PermissionPolicy.has(ctx, 'checkout.begin')) return false;
    return q.status === 'approved';
  },
  canDelete(ctx: BuyerContext | null, q: Quote): boolean {
    if (!PermissionPolicy.has(ctx, 'quotes.delete')) return false;
    return q.status === 'draft';
  },
};
