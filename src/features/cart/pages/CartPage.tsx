import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { PageHeader } from '@/ui/components/PageHeader';
import { LoadingState } from '@/ui/components/LoadingState';
import { ErrorState } from '@/ui/components/ErrorState';
import { EmptyState } from '@/ui/components/EmptyState';
import { Money } from '@/ui/components/Money';
import { Can } from '@/ui/components/Can';
import { useCart, useBeginCheckout, useRemoveCartItem, useUpdateCartItem } from '../hooks/useCart';

export const CartPage = () => {
  const cart = useCart();
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();
  const checkout = useBeginCheckout();

  if (cart.isLoading) return <LoadingState />;
  if (cart.error) return <ErrorState error={cart.error} onRetry={cart.refetch} />;
  const data = cart.data;
  if (!data || data.items.length === 0) {
    return (
      <>
        <PageHeader title="Cart" />
        <EmptyState
          title="Your cart is empty"
          description="Add items from Quick Order or a shopping list to get started."
        />
      </>
    );
  }

  const onCheckout = async () => {
    const handoff = await checkout.mutateAsync(data.id);
    if (handoff.url) {
      window.location.assign(handoff.url);
    }
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
                    <Typography variant="caption" color="text.secondary">
                      {it.sku}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Money value={it.unitPrice} />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      inputProps={{ min: 1, style: { width: 60, textAlign: 'right' } }}
                      defaultValue={it.quantity}
                      onBlur={(e) => {
                        const q = Number(e.target.value);
                        if (q !== it.quantity && q > 0) update.mutate({ itemId: it.id, quantity: q });
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Money value={it.lineTotal} />
                  </TableCell>
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
              <Typography>
                Subtotal: <Money value={data.totals.subtotal} />
              </Typography>
              <Typography variant="h6">
                Total: <Money value={data.totals.total} />
              </Typography>
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
