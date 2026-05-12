import { Card, CardContent, Grid, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router-dom';
import { getAdminOverview } from '@/services/adminService';
import { queryKeys } from '@/state/queries/queryKeys';
import { PageHeader } from '@/ui/components/PageHeader';
import { LoadingState } from '@/ui/components/LoadingState';
import { ErrorState } from '@/ui/components/ErrorState';
import { appConfig } from '@/app/config/env';

const TILES: Array<{ to: string; title: string; description: string }> = [
  { to: '/admin/role-grants', title: 'Role grants', description: 'Augment Shopify roles with portal-only permissions.' },
  { to: '/admin/quote-settings', title: 'Quote settings', description: 'Default expiry, draft-order mirroring.' },
  { to: '/admin/shopping-list-settings', title: 'Shopping list settings', description: 'Sharing defaults & limits.' },
  { to: '/admin/company-settings', title: 'Company settings', description: 'Display name, support email, logo.' },
  { to: '/admin/audit-log', title: 'Audit log', description: 'Every admin change, append-only.' },
  { to: '/admin/features', title: 'Features', description: 'Which flags are enabled on this deployment.' },
];

export const AdminHomePage = () => {
  const overview = useQuery({ queryKey: queryKeys.admin.overview, queryFn: getAdminOverview });
  if (overview.isLoading) return <LoadingState />;
  if (overview.error) return <ErrorState error={overview.error} onRetry={overview.refetch} />;
  return (
    <>
      <PageHeader title="Admin" description="Configure portal behavior for your company." />
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card><CardContent>
            <Typography variant="caption" color="text.secondary">Draft quotes</Typography>
            <Typography variant="h5">{overview.data?.draftQuotes ?? 0}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card><CardContent>
            <Typography variant="caption" color="text.secondary">Active lists</Typography>
            <Typography variant="h5">{overview.data?.activeLists ?? 0}</Typography>
          </CardContent></Card>
        </Grid>
        {appConfig.features.approvals ? (
          <Grid item xs={6} sm={3}>
            <Card><CardContent>
              <Typography variant="caption" color="text.secondary">Pending approvals</Typography>
              <Typography variant="h5">{overview.data?.pendingApprovals ?? 0}</Typography>
            </CardContent></Card>
          </Grid>
        ) : null}
        <Grid item xs={6} sm={3}>
          <Card><CardContent>
            <Typography variant="caption" color="text.secondary">Users</Typography>
            <Typography variant="h5">{overview.data?.usersCount ?? 0}</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        {TILES.map((t) => (
          <Grid item key={t.to} xs={12} sm={6} md={4}>
            <Card><CardContent>
              <Typography variant="h6">
                <RouterLink to={t.to}>{t.title}</RouterLink>
              </Typography>
              <Typography variant="body2" color="text.secondary">{t.description}</Typography>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
};
