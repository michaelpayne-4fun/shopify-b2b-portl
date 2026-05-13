import {
  Autocomplete, Avatar, Box, Chip, CircularProgress, IconButton,
  Stack, TableCell, TableRow, TextField, Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Money, Product, ProductVariant } from '@b2b/domain';
import { getProductBySku, searchProducts } from '@/services/catalogService';
import { friendlyError, friendlyErrorLine } from '@/services/errorMessages';
import { queryKeys } from '@/state/queries/queryKeys';
import { Money as MoneyView } from '@/ui/components/Money';

export type RowStatus = 'empty' | 'searching' | 'resolved' | 'not_found' | 'oos';

export interface QuickOrderRowSnapshot {
  key: string;
  status: RowStatus;
  variantId?: string;
  sku?: string;
  productName?: string;
  quantity: number;
  unitPrice?: Money;
  minOrderQty?: number;
  maxOrderQty?: number;
  errorMessage?: string;
}

interface VariantOption {
  product: Product;
  variant: ProductVariant;
}

const variantLabel = (p: Product, v: ProductVariant): string => {
  const attrs = Object.values(v.attributes ?? {}).filter(Boolean).join(' / ');
  return attrs ? `${p.name} — ${attrs}` : p.name;
};

interface Props {
  rowKey: string;
  initialInput?: string;
  initialQuantity?: number;
  onSnapshot: (snap: QuickOrderRowSnapshot) => void;
  onRemove: () => void;
  removable: boolean;
  autoFocus?: boolean;
}

export const QuickOrderRow = ({
  rowKey, initialInput, initialQuantity, onSnapshot, onRemove, removable, autoFocus,
}: Props) => {
  const [input, setInput] = useState(initialInput ?? '');
  const [debounced, setDebounced] = useState((initialInput ?? '').trim());
  const [quantity, setQuantity] = useState(initialQuantity ?? 1);
  const [product, setProduct] = useState<Product | null>(null);
  const [variant, setVariant] = useState<ProductVariant | null>(null);
  const [errorObj, setErrorObj] = useState<unknown>();
  const skuLookupAttemptedFor = useRef<string | null>(null);

  const friendly = useMemo(
    () => (errorObj ? friendlyError(errorObj, 'sku-lookup') : null),
    [errorObj],
  );

  useEffect(() => {
    const t = setTimeout(() => setDebounced(input.trim()), 250);
    return () => clearTimeout(t);
  }, [input]);

  const search = useQuery({
    queryKey: queryKeys.catalog.search(debounced),
    queryFn: () => searchProducts(debounced, 10),
    enabled: debounced.length > 0 && !variant,
    staleTime: 30_000,
  });

  const skuLookup = useMutation({
    mutationFn: (s: string) => getProductBySku(s),
    onSuccess: (p) => {
      const v = p.variants[0] ?? null;
      setProduct(p);
      setVariant(v);
      setErrorObj(undefined);
      if (v?.minOrderQty && quantity < v.minOrderQty) setQuantity(v.minOrderQty);
    },
    onError: (e) => {
      setProduct(null);
      setVariant(null);
      setErrorObj(e);
    },
  });

  // Resolve initial pasted/uploaded SKU exactly once.
  useEffect(() => {
    const trimmed = (initialInput ?? '').trim();
    if (!trimmed) return;
    if (skuLookupAttemptedFor.current === trimmed) return;
    skuLookupAttemptedFor.current = trimmed;
    skuLookup.mutate(trimmed);
  }, [initialInput]); // eslint-disable-line react-hooks/exhaustive-deps

  const options = useMemo<VariantOption[]>(() => {
    const items = search.data?.items ?? [];
    return items.flatMap((p) => p.variants.map((v) => ({ product: p, variant: v })));
  }, [search.data]);

  const status: RowStatus = useMemo(() => {
    if (variant) {
      const avail = variant.inventory?.available;
      if (avail !== undefined && avail !== null && avail <= 0 && !variant.inventory?.backorderable) {
        return 'oos';
      }
      return 'resolved';
    }
    if (errorObj) return 'not_found';
    if (skuLookup.isPending || search.isFetching) return 'searching';
    if (!input.trim()) return 'empty';
    return 'searching';
  }, [variant, errorObj, skuLookup.isPending, search.isFetching, input]);

  // Emit snapshot whenever anything material changes.
  useEffect(() => {
    onSnapshot({
      key: rowKey,
      status,
      variantId: variant?.id,
      sku: variant?.sku,
      productName: product && variant ? variantLabel(product, variant) : undefined,
      quantity,
      unitPrice: variant?.price,
      minOrderQty: variant?.minOrderQty,
      maxOrderQty: variant?.maxOrderQty,
      errorMessage: friendly?.text,
    });
  }, [rowKey, status, variant, product, quantity, friendly, onSnapshot]);

  const handleSelect = (opt: VariantOption | string | null) => {
    if (opt == null) return;
    if (typeof opt === 'string') {
      skuLookup.mutate(opt.trim());
      return;
    }
    setProduct(opt.product);
    setVariant(opt.variant);
    setErrorObj(undefined);
    setQuantity((q) => Math.max(q, opt.variant.minOrderQty ?? 1));
  };

  const reset = () => {
    setProduct(null);
    setVariant(null);
    setErrorObj(undefined);
    skuLookupAttemptedFor.current = null;
  };

  const lineTotal = useMemo<Money | undefined>(() => {
    if (!variant) return undefined;
    return {
      amount: variant.price.amount * quantity,
      currency: variant.price.currency,
    };
  }, [variant, quantity]);

  const minQty = variant?.minOrderQty ?? 1;
  const maxQty = variant?.maxOrderQty;
  const qtyInvalid = quantity < minQty || (maxQty !== undefined && quantity > maxQty);

  return (
    <TableRow hover>
      <TableCell sx={{ minWidth: 280 }}>
        <Autocomplete<VariantOption, false, false, true>
          freeSolo
          fullWidth
          size="small"
          options={options}
          loading={search.isFetching}
          filterOptions={(x) => x}
          inputValue={input}
          onInputChange={(_, v, reason) => {
            setInput(v);
            // Clear any stale resolved variant or error message whenever
            // the user edits the field, so a previously failed lookup
            // doesn't keep a "Not found" chip after the field is cleared.
            if (reason === 'input' || reason === 'clear') reset();
          }}
          isOptionEqualToValue={(a, b) =>
            typeof a !== 'string' && typeof b !== 'string' && a.variant.id === b.variant.id
          }
          getOptionLabel={(opt) =>
            typeof opt === 'string' ? opt : `${variantLabel(opt.product, opt.variant)} (${opt.variant.sku})`
          }
          renderOption={(props, opt) => (
            <Box component="li" {...props} key={opt.variant.id}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
                {opt.product.images[0] ? (
                  <Avatar variant="rounded" src={opt.product.images[0].url} alt="" sx={{ width: 32, height: 32 }} />
                ) : (
                  <Avatar variant="rounded" sx={{ width: 32, height: 32 }}>{opt.product.name[0]}</Avatar>
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" noWrap>{variantLabel(opt.product, opt.variant)}</Typography>
                  <Typography variant="caption" color="text.secondary">SKU {opt.variant.sku}</Typography>
                </Box>
                <MoneyView value={opt.variant.price} />
              </Stack>
            </Box>
          )}
          onChange={(_, opt) => handleSelect(opt)}
          noOptionsText={debounced ? 'No matches' : 'Type a name or SKU…'}
          renderInput={(params) => (
            <TextField
              {...params}
              autoFocus={autoFocus}
              placeholder="Search by name or SKU"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && options.length === 0 && input.trim()) {
                  e.preventDefault();
                  skuLookup.mutate(input.trim());
                }
              }}
              InputProps={{
                ...params.InputProps,
                startAdornment: variant && product?.images[0] ? (
                  <Avatar variant="rounded" src={product.images[0].url} alt="" sx={{ width: 24, height: 24, ml: 0.5, mr: 1 }} />
                ) : params.InputProps.startAdornment,
                endAdornment: (
                  <>
                    {(search.isFetching || skuLookup.isPending) ? <CircularProgress size={14} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
        {variant ? (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
            SKU {variant.sku}
          </Typography>
        ) : null}
      </TableCell>
      <TableCell sx={{ width: 120 }}>
        <TextField
          size="small"
          type="number"
          inputProps={{ min: minQty, max: maxQty }}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
          error={qtyInvalid}
          helperText={
            qtyInvalid
              ? maxQty !== undefined && quantity > maxQty
                ? `Max ${maxQty}`
                : `Min ${minQty}`
              : undefined
          }
          sx={{ width: 96 }}
        />
      </TableCell>
      <TableCell sx={{ width: 120 }} align="right">
        {variant ? <MoneyView value={variant.price} /> : <Typography variant="body2" color="text.secondary">—</Typography>}
      </TableCell>
      <TableCell sx={{ width: 120 }} align="right">
        {lineTotal ? <MoneyView value={lineTotal} /> : <Typography variant="body2" color="text.secondary">—</Typography>}
      </TableCell>
      <TableCell sx={{ width: 140 }}>
        {status === 'resolved' && !qtyInvalid ? (
          <Chip size="small" color="success" label="Ready" />
        ) : status === 'searching' ? (
          <Chip size="small" label="Searching" />
        ) : status === 'not_found' ? (
          <Chip
            size="small"
            color="error"
            label={friendly?.chipLabel ?? 'Not found'}
            title={errorObj ? friendlyErrorLine(errorObj, 'sku-lookup') : undefined}
          />
        ) : status === 'oos' ? (
          <Chip
            size="small"
            color="warning"
            label="Out of stock"
            title="This variant is currently out of stock and isn't set to backorder."
          />
        ) : qtyInvalid ? (
          <Chip
            size="small"
            color="warning"
            label="Check qty"
            title={
              maxQty !== undefined && quantity > maxQty
                ? `Maximum order quantity is ${maxQty}.`
                : `Minimum order quantity is ${minQty}.`
            }
          />
        ) : (
          <Chip size="small" variant="outlined" label="Empty" />
        )}
      </TableCell>
      <TableCell sx={{ width: 48 }} align="right">
        <IconButton size="small" onClick={onRemove} disabled={!removable} aria-label="Remove row">
          <CloseIcon fontSize="small" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};
