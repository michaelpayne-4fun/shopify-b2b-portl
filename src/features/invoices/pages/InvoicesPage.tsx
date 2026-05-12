import { PageHeader } from '@/ui/components/PageHeader';
import { EmptyState } from '@/ui/components/EmptyState';

export const InvoicesPage = () => (
  <>
    <PageHeader title="Invoices" description="Outstanding and paid invoices." />
    <EmptyState
      title="Invoicing is feature-flagged"
      description="Enable VITE_ENABLE_INVOICES and implement InvoiceService in your commerce adapter to surface this view."
    />
  </>
);
