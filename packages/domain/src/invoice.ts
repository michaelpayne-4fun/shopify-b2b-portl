import type { Money } from './money';

export type InvoiceStatus = 'open' | 'paid' | 'overdue' | 'voided';

export interface Invoice {
  id: string;
  number: string;
  status: InvoiceStatus;
  issuedAt: string;
  dueAt?: string;
  amountDue: Money;
  amountPaid: Money;
  total: Money;
  orderId?: string;
}
