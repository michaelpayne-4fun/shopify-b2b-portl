import { Alert, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { Product } from '@b2b/domain';
import { getProductBySku } from '@/services/catalogService';
import { addToCart } from '@/services/cartService';
import { queryKeys } from '@/state/queries/queryKeys';
import { PageHeader } from '@/ui/components/PageHeader';
import { Money } from '@/ui/components/Money';

export const QuickOrderPage = () => {
  const qc = useQueryClient();
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<Product | null>(null);

  const lookup = useMutation({
    mutationFn: (s: string) => getProductBySku(s),
    onSuccess: (p) => setProduct(p),
    onError: () => setProduct(null),
  });
  const add = useMutation({
    mutationFn: () => addToCart({ sku, quantity }),
    onSuccess: (cart) => qc.setQueryData(queryKeys.cart, cart),
  });

  return (
    <>
      <PageHeader title="Quick order" description="Add items by SKU." />
      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
            <TextField label="SKU" value={sku} onChange={(e) => setSku(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') lookup.mutate(sku); }}
              sx={{ flex: 1 }} />
            <TextField label="Quantity" type="number" inputProps={{ min: 1 }}
              value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              sx={{ width: 120 }} />
            <Button variant="outlined" onClick={() => lookup.mutate(sku)} disabled={lookup.isPending}>
              Look up
            </Button>
          </Stack>
          {lookup.error ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {(lookup.error as Error).message}
            </Alert>
          ) : null}
          {product ? (
            <Card variant="outlined" sx={{ mt: 2 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <div>
                    <Typography variant="h6">{product.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{product.sku}</Typography>
                    <Typography sx={{ mt: 1 }}>
                      <Money value={product.variants[0]?.price ?? { amount: 0, currency: 'USD' }} />
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
