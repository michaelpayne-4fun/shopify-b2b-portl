import {
  Button, Card, CardContent, IconButton, Stack, TextField, Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  addItemToList, addListToCart, getShoppingList, removeItemFromList,
} from '@/services/shoppingListService';
import { queryKeys } from '@/state/queries/queryKeys';
import { PageHeader } from '@/ui/components/PageHeader';
import { LoadingState } from '@/ui/components/LoadingState';
import { ErrorState } from '@/ui/components/ErrorState';
import { Can } from '@/ui/components/Can';

export const ShoppingListDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState(1);

  const q = useQuery({
    queryKey: queryKeys.shoppingLists.detail(id ?? ''),
    queryFn: () => getShoppingList(id!),
    enabled: !!id,
  });
  const add = useMutation({
    mutationFn: () => addItemToList(id!, sku, quantity),
    onSuccess: (list) => {
      qc.setQueryData(queryKeys.shoppingLists.detail(id!), list);
      setSku(''); setQuantity(1);
    },
  });
  const remove = useMutation({
    mutationFn: (itemId: string) => removeItemFromList(id!, itemId),
    onSuccess: (list) => qc.setQueryData(queryKeys.shoppingLists.detail(id!), list),
  });
  const toCart = useMutation({
    mutationFn: () => addListToCart(id!),
    onSuccess: () => navigate('/cart'),
  });

  if (q.isLoading) return <LoadingState />;
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />;
  const list = q.data!;

  return (
    <>
      <PageHeader title={list.name} description={list.isShared ? 'Shared list' : 'Private list'}
        actions={
          <Can permission="cart.update">
            <Button variant="contained" onClick={() => toCart.mutate()} disabled={toCart.isPending}>
              {toCart.isPending ? 'Adding…' : 'Add all to cart'}
            </Button>
          </Can>
        } />
      <Stack spacing={2}>
        <Can permission="shoppingLists.manage">
          <Card><CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
              <TextField label="SKU" value={sku} onChange={(e) => setSku(e.target.value)} sx={{ flex: 1 }} />
              <TextField label="Quantity" type="number" inputProps={{ min: 1 }}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                sx={{ width: 120 }} />
              <Button variant="outlined" onClick={() => add.mutate()} disabled={!sku || add.isPending}>
                Add item
              </Button>
            </Stack>
          </CardContent></Card>
        </Can>
        <Card><CardContent>
          {list.items.length === 0 ? (
            <Typography color="text.secondary">No items yet.</Typography>
          ) : (
            <Stack divider={<></>} spacing={1}>
              {list.items.map((it) => (
                <Stack key={it.id} direction="row" justifyContent="space-between" alignItems="center">
                  <Typography>{it.name} × {it.quantity}</Typography>
                  <Can permission="shoppingLists.manage">
                    <IconButton aria-label="Remove" onClick={() => remove.mutate(it.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Can>
                </Stack>
              ))}
            </Stack>
          )}
        </CardContent></Card>
      </Stack>
    </>
  );
};
