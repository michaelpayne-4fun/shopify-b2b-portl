import {
  Autocomplete, Avatar, Box, CircularProgress, Stack, TextField, Typography,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import type { Product, ProductVariant } from '@b2b/domain';
import { searchProducts } from '@/services/catalogService';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/state/queries/queryKeys';
import { Money as MoneyView } from '@/ui/components/Money';

export interface ProductSearchSelection {
  sku: string;
  variantId: string;
  name: string;
  minOrderQty?: number;
  maxOrderQty?: number;
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
  value: ProductSearchSelection | null;
  onChange: (sel: ProductSearchSelection | null) => void;
  sx?: SxProps<Theme>;
  label?: string;
  placeholder?: string;
}

export const ProductSearch = ({
  value, onChange, sx, label = 'Product', placeholder = 'Search by name or SKU…',
}: Props) => {
  const [input, setInput] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(input.trim()), 250);
    return () => clearTimeout(t);
  }, [input]);

  // Reset input display when value is cleared externally
  useEffect(() => {
    if (!value) setInput('');
  }, [value]);

  const search = useQuery({
    queryKey: queryKeys.catalog.search(debounced),
    queryFn: () => searchProducts(debounced, 10),
    enabled: debounced.length > 0 && !value,
    staleTime: 30_000,
  });

  const options = useMemo<VariantOption[]>(() => {
    const items = search.data?.items ?? [];
    return items.flatMap((p) => p.variants.map((v) => ({ product: p, variant: v })));
  }, [search.data]);

  return (
    <Autocomplete<VariantOption, false, false, false>
      sx={sx}
      size="small"
      options={options}
      loading={search.isFetching}
      filterOptions={(x) => x}
      inputValue={input}
      value={null}
      onInputChange={(_, v, reason) => {
        setInput(v);
        if (reason === 'input' || reason === 'clear') onChange(null);
      }}
      isOptionEqualToValue={(a, b) => a.variant.id === b.variant.id}
      getOptionLabel={(opt) => `${variantLabel(opt.product, opt.variant)} (${opt.variant.sku})`}
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
      onChange={(_, opt) => {
        if (!opt) { onChange(null); return; }
        const label = variantLabel(opt.product, opt.variant);
        setInput(`${label} (${opt.variant.sku})`);
        onChange({
          sku: opt.variant.sku,
          variantId: opt.variant.id,
          name: label,
          minOrderQty: opt.variant.minOrderQty,
          maxOrderQty: opt.variant.maxOrderQty,
        });
      }}
      noOptionsText={debounced ? 'No matches' : 'Type a name or SKU…'}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {search.isFetching ? <CircularProgress size={14} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};
