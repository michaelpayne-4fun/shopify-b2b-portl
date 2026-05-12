import { Card, CardContent, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { AddressScope } from '@b2b/domain';
import { listAddresses } from '@/services/addressService';
import { queryKeys } from '@/state/queries/queryKeys';
import { PageHeader } from '@/ui/components/PageHeader';
import { LoadingState } from '@/ui/components/LoadingState';
import { ErrorState } from '@/ui/components/ErrorState';
import { EmptyState } from '@/ui/components/EmptyState';

export const AddressListPage = () => {
  const [scope, setScope] = useState<AddressScope>('personal');
  const q = useQuery({
    queryKey: [...queryKeys.addresses, scope],
    queryFn: () => listAddresses(scope),
  });
  if (q.isLoading) return <LoadingState />;
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />;
  const items = q.data?.items ?? [];
  return (
    <>
      <PageHeader title="Addresses" />
      <Tabs value={scope} onChange={(_, v) => setScope(v as AddressScope)} sx={{ mb: 2 }}>
        <Tab value="personal" label="My addresses" />
        <Tab value="company" label="Company locations" />
      </Tabs>
      {items.length === 0 ? (
        <EmptyState title="No addresses" />
      ) : (
        <Stack spacing={2}>
          {items.map((a) => (
            <Card key={a.id}><CardContent>
              <Typography variant="h6">{a.label ?? `${a.firstName} ${a.lastName}`}</Typography>
              <Typography variant="body2" color="text.secondary">
                {a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.region} {a.postalCode}, {a.countryCode}
              </Typography>
            </CardContent></Card>
          ))}
        </Stack>
      )}
    </>
  );
};
