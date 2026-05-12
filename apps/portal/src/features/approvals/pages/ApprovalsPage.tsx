import { PageHeader } from '@/ui/components/PageHeader';
import { EmptyState } from '@/ui/components/EmptyState';

export const ApprovalsPage = () => (
  <>
    <PageHeader title="Approvals" description="Pending decisions for your company." />
    <EmptyState title="Approvals are off in v1"
      description="Enable FEATURE_APPROVALS on the server and configure approval rules from the admin UI to surface pending decisions here." />
  </>
);
