import {
  Box, Button, Card, CardContent, IconButton, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  beginCheckout, getCart, removeCartItem, updateCartItem,
} from '@/services/cartService';
import { queryKeys } from '@/state/queries/queryKeys';
import { PageHeader } from '@/ui/components/PageHeader';
import { LoadingState } from '@/ui/components/LoadingState';
import { ErrorState } from '@/ui/components/ErrorState';
import { EmptyState } from '@/ui/components/EmptyState';
import { Money } from '@/ui/components/Money';
import { Can } from '@/ui/components/Can';

export const CartPage = () => {
  const qc = useQueryClient();
  const cart = useQuery({ queryKey: queryKeys.cart, queryFn: getCart });
  const update = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) => updateCartItem(id, quantity),
    onSuccess: (data) => qc.setQueryData(queryKeys.cart, data),
  });
  const remove = useMutation({
    mutationFn: (id: string) => removeCartItem(id),
    onSuccess: (data) => qc.setQueryData(queryKeys.cart, data),
  });
  const checkout = useMutation({ mutationFn: beginCheckout });

  if (cart.isLoading) return <LoadingState />;
  if (cart.error) return <ErrorState error={cart.error} onRetry={cart.refetch} />;
  const data = cart.data!;
  if (data.items.length === 0) {
    return (
      <>
        <PageHeader title="Cart" />
        <EmptyState title="Your cart is empty"
                    description="Add items from Quick Order or a shopping list." />
      </>
    );
  }

  const onCheckout = async () => {
    const handoff = await checkout.mutateAsync();
    if (handoff.url) window.location.assign(handoff.url);
  };

  return (
    <>
      <PageHeader title="Cart" description={`${data.items.length} item(s)`} />
      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell align="right">Unit price</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {data.items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell>
                    <Typography>{it.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{it.sku}</Typography>
                  </TableCell>
                  <TableCell align="right"><Money value={it.unitPrice} /></TableCell>
                  <TableCell align="right">
                    <TextField size="small" type="number"
                      inputProps={{ min: 0, style: { width: 60, textAlign: 'right' } }}
                      defaultValue={it.quantity}
                      onBlur={(e) => {
                        const q = Number(e.target.value);
                        if (q !== it.quantity) update.mutate({ id: it.id, quantity: q });
                      }} />
                  </TableCell>
                  <TableCell align="right"><Money value={it.lineTotal} /></TableCell>
                  <TableCell align="right">
                    <IconButton aria-label="Remove" onClick={() => remove.mutate(it.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Box display="flex" justifyContent="flex-end" mt={3}>
            <Stack alignItems="flex-end" spacing={1}>
              <Typography>Subtotal: <Money value={data.totals.subtotal} /></Typography>
              <Typography variant="h6">Total: <Money value={data.totals.total} /></Typography>
              <Can permission="checkout.begin">
                <Button variant="contained" onClick={onCheckout} disabled={checkout.isPending}>
                  {checkout.isPending ? 'Starting checkout…' : 'Checkout'}
                </Button>
              </Can>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </>
  );
};
