import { Chip } from '@mui/material';

type Tone = 'default' | 'success' | 'warning' | 'error' | 'info';

const PALETTE: Record<string, Tone> = {
  pending: 'default', awaitingPayment: 'warning', awaitingFulfillment: 'info',
  shipped: 'info', completed: 'success', cancelled: 'default', refunded: 'default',
  draft: 'default', submitted: 'info', approved: 'success', rejected: 'error',
  expired: 'default', ordered: 'success',
  open: 'warning', paid: 'success', overdue: 'error', voided: 'default',
};

export const StatusChip = ({ status }: { status: string }) => (
  <Chip size="small" label={status} color={(PALETTE[status] ?? 'default') as Tone} />
);
