import { useState } from 'react';
import {
  Card,
  CardContent,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { PageHeader } from '@/ui/components/PageHeader';
import { LoadingState } from '@/ui/components/LoadingState';
import { ErrorState } from '@/ui/components/ErrorState';
import { EmptyState } from '@/ui/components/EmptyState';
import { Money } from '@/ui/components/Money';
import { StatusChip } from '@/ui/components/StatusChip';
import { useOrders } from '../hooks/useOrders';
import { usePermission } from '@/ui/components/Can';
import type { OrderScope } from '@/domain/models';

export const OrdersPage = () => {
  const canViewCompany = usePermission('orders.viewCompany');
  const [scope, setScope] = useState<OrderScope>('mine');
  const orders = useOrders({ scope });

  if (orders.isLoading) return <LoadingState />;
  if (orders.error) return <ErrorState error={orders.error} onRetry={orders.refetch} />;
  const items = orders.data?.items ?? [];

  return (
    <>
      <PageHeader
        title="Orders"
        description={scope === 'company' ? 'All orders placed under your company.' : 'Your recent orders.'}
      />
      {canViewCompany ? (
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
                    <TableCell>
                      <StatusChip status={o.status} />
                    </TableCell>
                    <TableCell>{o.poNumber ?? '—'}</TableCell>
                    <TableCell align="right">
                      <Money value={o.total} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      <Stack sx={{ mt: 2 }} />
    </>
  );
};
