import {
  Alert, Box, Button, Card, CardContent, Chip, Divider, IconButton,
  Stack, TextField, Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Cart, Money as MoneyT, ShoppingListItem } from '@b2b/domain';
import {
  addItemToList, addListToCart, getShoppingList, removeItemFromList, updateItemInList,
} from '@/services/shoppingListService';
import { queryKeys } from '@/state/queries/queryKeys';
import { PageHeader } from '@/ui/components/PageHeader';
import { LoadingState } from '@/ui/components/LoadingState';
import { ErrorState } from '@/ui/components/ErrorState';
import { Money } from '@/ui/components/Money';
import { Can, usePermission } from '@/ui/components/Can';
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
      addItemToList(id!, selection!.sku, quantity, selection!.name, selection!.variantId),
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

  const canManage = usePermission('shoppingLists.manage');

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
            <>
              <Stack divider={<div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', margin: '4px 0' }} />} spacing={0.5}>
                {list.items.map((it) => (
                  <EditableItem
                    key={it.id}
                    item={it}
                    listId={id!}
                    canEdit={canManage}
                    onRemove={() => remove.mutate(it.id)}
                    removeDisabled={remove.isPending}
                  />
                ))}
              </Stack>
              <ListTotals items={list.items} />
            </>
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

interface EditableItemProps {
  item: ShoppingListItem;
  listId: string;
  canEdit: boolean;
  onRemove: () => void;
  removeDisabled: boolean;
}

const EditableItem = ({ item, listId, canEdit, onRemove, removeDisabled }: EditableItemProps) => {
  const qc = useQueryClient();
  const [qty, setQty] = useState(item.quantity);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Reset local qty when the server-side value changes (e.g. after a
  // refetch or another row mutating the list).
  useEffect(() => {
    setQty(item.quantity);
  }, [item.quantity]);

  const save = useMutation({
    mutationFn: (newQty: number) => updateItemInList(listId, item.id, { quantity: newQty }),
    onSuccess: (list) => {
      qc.setQueryData(queryKeys.shoppingLists.detail(listId), list);
      setSaveError(null);
    },
    onError: (e) => {
      setSaveError((e as Error).message);
      setQty(item.quantity);
    },
  });

  const commit = () => {
    if (!canEdit || save.isPending) return;
    if (qty < 1) { setQty(item.quantity); return; }
    if (qty === item.quantity) return;
    save.mutate(qty);
  };

  const lineTotal: MoneyT | undefined = item.unitPrice
    ? { amount: item.unitPrice.amount * qty, currency: item.unitPrice.currency }
    : undefined;

  return (
    <Stack direction="row" alignItems="center" sx={{ py: 0.5 }} spacing={2}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" noWrap>{item.name}</Typography>
        <Typography variant="caption" color="text.secondary">SKU {item.sku}</Typography>
      </Box>
      <Box sx={{ width: 96, textAlign: 'right' }}>
        {item.unitPrice ? (
          <Typography variant="body2"><Money value={item.unitPrice} /></Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">—</Typography>
        )}
      </Box>
      <TextField
        type="number"
        size="small"
        inputProps={{ min: 1 }}
        value={qty}
        onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') { setQty(item.quantity); (e.target as HTMLInputElement).blur(); }
        }}
        disabled={!canEdit || save.isPending}
        error={!!saveError}
        helperText={saveError ? 'Save failed' : undefined}
        sx={{ width: 88 }}
        title={canEdit ? 'Press Enter or click away to save' : undefined}
      />
      <Box sx={{ width: 96, textAlign: 'right' }}>
        {lineTotal ? (
          <Typography variant="body2"><Money value={lineTotal} /></Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">—</Typography>
        )}
      </Box>
      <Can permission="shoppingLists.manage">
        <IconButton
          size="small"
          aria-label="Remove"
          onClick={onRemove}
          disabled={removeDisabled || save.isPending}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Can>
    </Stack>
  );
};

const ListTotals = ({ items }: { items: ShoppingListItem[] }) => {
  const subtotal = useMemo<MoneyT | null>(() => {
    const priced = items.filter((it) => it.unitPrice);
    if (priced.length === 0) return null;
    const currencies = new Set(priced.map((it) => it.unitPrice!.currency));
    if (currencies.size > 1) return null;
    const currency = priced[0].unitPrice!.currency;
    const amount = priced.reduce(
      (acc, it) => acc + it.unitPrice!.amount * it.quantity,
      0,
    );
    return { amount, currency };
  }, [items]);

  const unpriced = items.filter((it) => !it.unitPrice).length;

  return (
    <>
      <Divider sx={{ my: 1 }} />
      <Stack direction="row" justifyContent="flex-end" alignItems="baseline" spacing={2}>
        {unpriced > 0 ? (
          <Typography variant="caption" color="text.secondary">
            {unpriced} item{unpriced === 1 ? '' : 's'} without a price
          </Typography>
        ) : null}
        <Typography variant="body2" color="text.secondary">Subtotal</Typography>
        <Typography variant="subtitle1" sx={{ minWidth: 96, textAlign: 'right' }}>
          {subtotal ? <Money value={subtotal} /> : '—'}
        </Typography>
      </Stack>
    </>
  );
};
