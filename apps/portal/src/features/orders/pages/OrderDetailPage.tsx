import {
  Alert, Button, Card, CardContent, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getOrder, reorder } from '@/services/orderService';
import { queryKeys } from '@/state/queries/queryKeys';
import { PageHeader } from '@/ui/components/PageHeader';
import { LoadingState } from '@/ui/components/LoadingState';
import { ErrorState } from '@/ui/components/ErrorState';
import { Money } from '@/ui/components/Money';
import { StatusChip } from '@/ui/components/StatusChip';
import { Can } from '@/ui/components/Can';

export const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: queryKeys.orders.detail(id ?? ''),
    queryFn: () => getOrder(id!),
    enabled: !!id,
  });
  const reorderMut = useMutation({
    mutationFn: () => reorder(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cart });
      navigate('/cart');
    },
  });

  if (q.isLoading) return <LoadingState />;
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />;
  const o = q.data!;
  return (
    <>
      <PageHeader title={`Order ${o.number}`}
        description={`Placed ${new Date(o.placedAt).toLocaleString()}`}
        actions={
          <Can permission="orders.reorder">
            <Button variant="contained"
              onClick={() => reorderMut.mutate()}
              disabled={reorderMut.isPending}>
              {reorderMut.isPending ? 'Building cart…' : 'Reorder'}
            </Button>
          </Can>
        } />
      <Stack spacing={2}>
        {reorderMut.data?.skippedLines.length ? (
          <Alert severity="warning">
            Some lines were skipped: {reorderMut.data.skippedLines.map((l) => l.sku).join(', ')}
          </Alert>
        ) : null}
        {reorderMut.error ? (
          <Alert severity="error">{(reorderMut.error as Error).message}</Alert>
        ) : null}
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
