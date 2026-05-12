import { Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getFeatures } from '@/services/adminService';
import { queryKeys } from '@/state/queries/queryKeys';
import { PageHeader } from '@/ui/components/PageHeader';
import { LoadingState } from '@/ui/components/LoadingState';
import { ErrorState } from '@/ui/components/ErrorState';

export const FeaturesPage = () => {
  const q = useQuery({ queryKey: queryKeys.admin.features, queryFn: getFeatures });
  if (q.isLoading) return <LoadingState />;
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />;
  const flags = q.data!;
  return (
    <>
      <PageHeader title="Features" description="Server-enforced flags (read-only)." />
      <Card><CardContent>
        <Stack spacing={1}>
          {Object.entries(flags).map(([k, v]) => (
            <Stack key={k} direction="row" justifyContent="space-between" alignItems="center">
              <Typography>{k}</Typography>
              <Chip size="small" color={v ? 'success' : 'default'} label={v ? 'on' : 'off'} />
            </Stack>
          ))}
        </Stack>
      </CardContent></Card>
    </>
  );
};
