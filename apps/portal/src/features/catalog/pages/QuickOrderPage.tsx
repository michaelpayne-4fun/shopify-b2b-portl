import {
  Alert, Autocomplete, Avatar, Box, Button, Card, CardContent, CircularProgress,
  Stack, TextField, Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import type { Product, ProductVariant } from '@b2b/domain';
import { getProductBySku, searchProducts } from '@/services/catalogService';
import { addToCart } from '@/services/cartService';
import { queryKeys } from '@/state/queries/queryKeys';
import { PageHeader } from '@/ui/components/PageHeader';
import { Money } from '@/ui/components/Money';

interface VariantOption {
  product: Product;
  variant: ProductVariant;
}

const variantLabel = (p: Product, v: ProductVariant): string => {
  const attrs = Object.values(v.attributes ?? {}).filter(Boolean).join(' / ');
  return attrs ? `${p.name} — ${attrs}` : p.name;
};

export const QuickOrderPage = () => {
  const qc = useQueryClient();
  const [input, setInput] = useState('');
  const [debouncedInput, setDebouncedInput] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [variant, setVariant] = useState<ProductVariant | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedInput(input.trim()), 250);
    return () => clearTimeout(t);
  }, [input]);

  const search = useQuery({
    queryKey: queryKeys.catalog.search(debouncedInput),
    queryFn: () => searchProducts(debouncedInput, 10),
    enabled: debouncedInput.length > 0,
    staleTime: 30_000,
  });

  const lookup = useMutation({
    mutationFn: (s: string) => getProductBySku(s),
    onSuccess: (p) => {
      setProduct(p);
      const v = p.variants[0] ?? null;
      setVariant(v);
      if (v?.minOrderQty) setQuantity(v.minOrderQty);
    },
    onError: () => {
      setProduct(null);
      setVariant(null);
    },
  });

  const add = useMutation({
    mutationFn: () => {
      if (!variant) return Promise.reject(new Error('No product selected'));
      return addToCart({ sku: variant.sku, variantId: variant.id, quantity });
    },
    onSuccess: (cart) => qc.setQueryData(queryKeys.cart, cart),
  });

  const options = useMemo<VariantOption[]>(() => {
    const items = search.data?.items ?? [];
    return items.flatMap((p) => p.variants.map((v) => ({ product: p, variant: v })));
  }, [search.data]);

  const handleSelect = (opt: VariantOption | string | null) => {
    if (opt == null) {
      setProduct(null);
      setVariant(null);
      return;
    }
    if (typeof opt === 'string') {
      lookup.mutate(opt);
      return;
    }
    setProduct(opt.product);
    setVariant(opt.variant);
    setQuantity(Math.max(1, opt.variant.minOrderQty ?? 1));
  };

  return (
    <>
      <PageHeader title="Quick order" description="Search by product name or SKU." />
      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
            <Autocomplete<VariantOption, false, false, true>
              freeSolo
              fullWidth
              sx={{ flex: 1 }}
              options={options}
              loading={search.isFetching}
              filterOptions={(x) => x}
              inputValue={input}
              onInputChange={(_, v) => setInput(v)}
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
                      <Avatar variant="rounded" src={opt.product.images[0].url} alt="" />
                    ) : (
                      <Avatar variant="rounded">{opt.product.name[0]}</Avatar>
                    )}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" noWrap>{variantLabel(opt.product, opt.variant)}</Typography>
                      <Typography variant="caption" color="text.secondary">SKU {opt.variant.sku}</Typography>
                    </Box>
                    <Money value={opt.variant.price} />
                  </Stack>
                </Box>
              )}
              onChange={(_, opt) => handleSelect(opt)}
              noOptionsText={debouncedInput ? 'No matches' : 'Type to search…'}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search by product name or SKU"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && options.length === 0 && input.trim()) {
                      e.preventDefault();
                      lookup.mutate(input.trim());
                    }
                  }}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {search.isFetching ? <CircularProgress size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
            <TextField
              label="Quantity"
              type="number"
              inputProps={{ min: variant?.minOrderQty ?? 1, max: variant?.maxOrderQty }}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              sx={{ width: 120 }}
            />
          </Stack>

          {lookup.error ? (
            <Alert severity="error" sx={{ mt: 2 }}>{(lookup.error as Error).message}</Alert>
          ) : null}

          {product && variant ? (
            <Card variant="outlined" sx={{ mt: 2 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <div>
                    <Typography variant="h6">{variantLabel(product, variant)}</Typography>
                    <Typography variant="body2" color="text.secondary">{variant.sku}</Typography>
                    <Typography sx={{ mt: 1 }}>
                      <Money value={variant.price} />
                    </Typography>
                  </div>
                  <Button variant="contained" onClick={() => add.mutate()} disabled={add.isPending}>
                    {add.isPending ? 'Adding…' : 'Add to cart'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ) : null}

          {add.isSuccess ? <Alert severity="success" sx={{ mt: 2 }}>Added to cart.</Alert> : null}
        </CardContent>
      </Card>
    </>
  );
};
