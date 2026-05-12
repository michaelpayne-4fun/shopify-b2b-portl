import { useState } from 'react';
import {
  Card, CardContent, Tab, Tabs, Table, TableBody, TableCell,
  TableHead, TableRow,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { OrderScope } from '@b2b/domain';
import { listOrders } from '@/services/orderService';
import { queryKeys } from '@/state/queries/queryKeys';
import { PageHeader } from '@/ui/components/PageHeader';
import { LoadingState } from '@/ui/components/LoadingState';
import { ErrorState } from '@/ui/components/ErrorState';
import { EmptyState } from '@/ui/components/EmptyState';
import { Money } from '@/ui/components/Money';
import { StatusChip } from '@/ui/components/StatusChip';
import { usePermission } from '@/ui/components/Can';

export const OrdersPage = () => {
  const canCompany = usePermission('orders.viewCompany');
  const [scope, setScope] = useState<OrderScope>('mine');
  const filter = { scope };
  const q = useQuery({
    queryKey: queryKeys.orders.list(filter),
    queryFn: () => listOrders(filter),
  });

  if (q.isLoading) return <LoadingState />;
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />;
  const items = q.data?.items ?? [];

  return (
    <>
      <PageHeader title="Orders"
        description={scope === 'company' ? 'All orders for your company.' : 'Your recent orders.'} />
      {canCompany ? (
        <Tabs value={scope} onChange={(_, v) => setScope(v as OrderScope)} sx={{ mb: 2 }}>
          <Tab value="mine" label="My orders" />
          <Tab value="company" label="Company orders" />
        </Tabs>
      ) : null}

      {items.length === 0 ? (
        <EmptyState title="No orders found" />
      ) : (
        <Card>
          <CardContent>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Order #</TableCell>
                  <TableCell>Placed</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>PO</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((o) => (
                  <TableRow key={o.id} hover>
                    <TableCell>
                      <RouterLink to={`/orders/${encodeURIComponent(o.id)}`}>{o.number}</RouterLink>
                    </TableCell>
                    <TableCell>{new Date(o.placedAt).toLocaleDateString()}</TableCell>
                    <TableCell><StatusChip status={o.status} /></TableCell>
                    <TableCell>{o.poNumber ?? '—'}</TableCell>
                    <TableCell align="right"><Money value={o.total} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
};
