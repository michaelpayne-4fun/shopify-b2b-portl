import { Button, Card, CardContent, IconButton, Stack, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { PageHeader } from '@/ui/components/PageHeader';
import { LoadingState } from '@/ui/components/LoadingState';
import { ErrorState } from '@/ui/components/ErrorState';
import { EmptyState } from '@/ui/components/EmptyState';
import { Can } from '@/ui/components/Can';
import { useAddresses, useDeleteAddress } from '../hooks/useAddresses';

export const AddressListPage = () => {
  const addresses = useAddresses();
  const remove = useDeleteAddress();

  if (addresses.isLoading) return <LoadingState />;
  if (addresses.error) return <ErrorState error={addresses.error} onRetry={addresses.refetch} />;
  const items = addresses.data?.items ?? [];

  return (
    <>
      <PageHeader
        title="Addresses"
        description="Company billing and shipping addresses."
        actions={
          <Can permission="addresses.manage">
            <Button variant="contained" disabled>
              Add address
            </Button>
          </Can>
        }
      />
      {items.length === 0 ? (
        <EmptyState title="No addresses yet" description="Create your first address to ship orders to." />
      ) : (
        <Stack spacing={2}>
          {items.map((a) => (
            <Card key={a.id}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <div>
                    <Typography variant="h6">{a.label ?? `${a.firstName} ${a.lastName}`}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {a.line1}
                      {a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.region} {a.postalCode},{' '}
                      {a.countryCode}
                    </Typography>
                  </div>
                  <Can permission="addresses.manage">
                    <IconButton
                      aria-label="Delete address"
                      onClick={() => remove.mutate(a.id)}
                      disabled={remove.isPending}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Can>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </>
  );
};
