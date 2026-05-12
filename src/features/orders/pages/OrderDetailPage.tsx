import {
  Button,
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/ui/components/PageHeader';
import { LoadingState } from '@/ui/components/LoadingState';
import { ErrorState } from '@/ui/components/ErrorState';
import { Money } from '@/ui/components/Money';
import { StatusChip } from '@/ui/components/StatusChip';
import { useOrder } from '../hooks/useOrders';
import { useCommerce } from '@/app/providers/CommerceProvider';
import { useBuyerContext } from '@/features/auth/hooks/useBuyerContext';
import { OrderPolicy } from '@/domain/policies/OrderPolicy';

export const OrderDetailPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const order = useOrder(orderId);
  const commerce = useCommerce();
  const context = useBuyerContext();
  const navigate = useNavigate();

  const reorder = useMutation({
    mutationFn: (id: string) => commerce.order.reorder(context, id),
    onSuccess: () => navigate('/cart'),
  });

  if (order.isLoading) return <LoadingState />;
  if (order.error) return <ErrorState error={order.error} onRetry={order.refetch} />;
  const o = order.data!;

  return (
    <>
      <PageHeader
        title={`Order ${o.number}`}
        description={`Placed ${new Date(o.placedAt).toLocaleString()}`}
        actions={
          OrderPolicy.canReorder(context, o) ? (
            <Button variant="contained" onClick={() => reorder.mutate(o.id)} disabled={reorder.isPending}>
              {reorder.isPending ? 'Reordering…' : 'Reorder'}
            </Button>
          ) : null
        }
      />
      <Stack spacing={2}>
        <Card>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Typography>
                Status: <StatusChip status={o.status} />
              </Typography>
              {o.poNumber ? <Typography>PO #: {o.poNumber}</Typography> : null}
              <Typography>
                Total: <Money value={o.total} />
              </Typography>
            </Stack>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Unit price</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {o.lines.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <Typography>{l.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {l.sku}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{l.quantity}</TableCell>
                    <TableCell align="right">
                      <Money value={l.unitPrice} />
                    </TableCell>
                    <TableCell align="right">
                      <Money value={l.lineTotal} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Stack>
    </>
  );
};
