import {
  Card, CardContent, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getOrder } from '@/services/orderService';
import { queryKeys } from '@/state/queries/queryKeys';
import { PageHeader } from '@/ui/components/PageHeader';
import { LoadingState } from '@/ui/components/LoadingState';
import { ErrorState } from '@/ui/components/ErrorState';
import { Money } from '@/ui/components/Money';
import { StatusChip } from '@/ui/components/StatusChip';

export const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const q = useQuery({
    queryKey: queryKeys.orders.detail(id ?? ''),
    queryFn: () => getOrder(id!),
    enabled: !!id,
  });
  if (q.isLoading) return <LoadingState />;
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />;
  const o = q.data!;
  return (
    <>
      <PageHeader title={`Order ${o.number}`}
        description={`Placed ${new Date(o.placedAt).toLocaleString()}`} />
      <Stack spacing={2}>
        <Card><CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Typography>Status: <StatusChip status={o.status} /></Typography>
            {o.poNumber ? <Typography>PO #: {o.poNumber}</Typography> : null}
            <Typography>Total: <Money value={o.total} /></Typography>
          </Stack>
        </CardContent></Card>
        <Card><CardContent>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>Item</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell align="right">Unit price</TableCell>
              <TableCell align="right">Total</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {o.lines.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <Typography>{l.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{l.sku}</Typography>
                  </TableCell>
                  <TableCell align="right">{l.quantity}</TableCell>
                  <TableCell align="right"><Money value={l.unitPrice} /></TableCell>
                  <TableCell align="right"><Money value={l.lineTotal} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      </Stack>
    </>
  );
};
