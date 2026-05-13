import {
  Alert, Button, Card, CardContent, Chip, IconButton,
  Stack, TextField, Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Cart } from '@b2b/domain';
import {
  addItemToList, addListToCart, getShoppingList, removeItemFromList,
} from '@/services/shoppingListService';
import { queryKeys } from '@/state/queries/queryKeys';
import { PageHeader } from '@/ui/components/PageHeader';
import { LoadingState } from '@/ui/components/LoadingState';
import { ErrorState } from '@/ui/components/ErrorState';
import { Can } from '@/ui/components/Can';
import { ProductSearch } from '@/features/catalog/components/ProductSearch';
import type { ProductSearchSelection } from '@/features/catalog/components/ProductSearch';

export const ShoppingListDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const navigate = useNavigate();

  // Add-item state
  const [selection, setSelection] = useState<ProductSearchSelection | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addError, setAddError] = useState<string | null>(null);

  const q = useQuery({
    queryKey: queryKeys.shoppingLists.detail(id ?? ''),
    queryFn: () => getShoppingList(id!),
    enabled: !!id,
  });

  const add = useMutation({
    mutationFn: () =>
      addItemToList(id!, selection!.sku, quantity, selection!.name),
    onSuccess: (list) => {
      qc.setQueryData(queryKeys.shoppingLists.detail(id!), list);
      setSelection(null);
      setQuantity(1);
      setAddError(null);
    },
    onError: (e) => setAddError((e as Error).message),
  });

  const remove = useMutation({
    mutationFn: (itemId: string) => removeItemFromList(id!, itemId),
    onSuccess: (list) => qc.setQueryData(queryKeys.shoppingLists.detail(id!), list),
  });

  const toCart = useMutation({
    mutationFn: () => addListToCart(id!),
    onSuccess: (data) => {
      if ((data as unknown as Cart).items !== undefined) {
        qc.setQueryData(queryKeys.cart, data);
      }
      navigate('/cart');
    },
  });

  const handleSelectionChange = useCallback((sel: ProductSearchSelection | null) => {
    setSelection(sel);
    if (sel?.minOrderQty && quantity < sel.minOrderQty) {
      setQuantity(sel.minOrderQty);
    }
    setAddError(null);
  }, [quantity]);

  if (q.isLoading) return <LoadingState />;
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />;
  const list = q.data!;

  const minQty = selection?.minOrderQty ?? 1;
  const maxQty = selection?.maxOrderQty;

  return (
    <>
      <PageHeader
        title={list.name}
        description={list.isShared ? 'Shared list' : 'Private list'}
        actions={
          <Can permission="cart.update">
            <Button
              variant="contained"
              onClick={() => toCart.mutate()}
              disabled={toCart.isPending || list.items.length === 0}
            >
              {toCart.isPending ? 'Adding…' : 'Add all to cart'}
            </Button>
          </Can>
        }
      />

      {toCart.isError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {(toCart.error as Error).message}
        </Alert>
      ) : null}

      <Stack spacing={2}>
        <Can permission="shoppingLists.manage">
          <Card><CardContent>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Add item</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
              <ProductSearch
                value={selection}
                onChange={handleSelectionChange}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Qty"
                type="number"
                inputProps={{ min: minQty, max: maxQty }}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                error={!!maxQty && quantity > maxQty}
                helperText={
                  maxQty && quantity > maxQty ? `Max ${maxQty}` :
                  quantity < minQty ? `Min ${minQty}` : undefined
                }
                sx={{ width: 100 }}
              />
              <Button
                variant="outlined"
                onClick={() => add.mutate()}
                disabled={!selection || add.isPending || quantity < minQty}
                sx={{ mt: { xs: 0, sm: '8px' } }}
              >
                {add.isPending ? 'Adding…' : 'Add'}
              </Button>
            </Stack>
            {addError ? (
              <Alert severity="error" sx={{ mt: 1 }}>{addError}</Alert>
            ) : null}
          </CardContent></Card>
        </Can>

        <Card><CardContent>
          {list.items.length === 0 ? (
            <Typography color="text.secondary">No items yet. Add one above.</Typography>
          ) : (
            <Stack divider={<div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', margin: '4px 0' }} />} spacing={0.5}>
              {list.items.map((it) => (
                <Stack key={it.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.5 }}>
                  <div>
                    <Typography variant="body2">{it.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      SKU {it.sku} · Qty {it.quantity}
                    </Typography>
                  </div>
                  <Can permission="shoppingLists.manage">
                    <IconButton
                      size="small"
                      aria-label="Remove"
                      onClick={() => remove.mutate(it.id)}
                      disabled={remove.isPending}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Can>
                </Stack>
              ))}
            </Stack>
          )}
        </CardContent></Card>

        {list.items.length > 0 ? (
          <Stack direction="row" justifyContent="flex-end">
            <Chip
              label={`${list.items.length} item${list.items.length === 1 ? '' : 's'} · ${list.isShared ? 'Shared' : 'Private'}`}
              size="small"
              variant="outlined"
            />
          </Stack>
        ) : null}
      </Stack>
    </>
  );
};
