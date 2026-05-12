import { Alert, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useAddToCart } from '@/features/cart/hooks/useCart';
import { PageHeader } from '@/ui/components/PageHeader';
import { useCommerce } from '@/app/providers/CommerceProvider';
import { useBuyerContext } from '@/features/auth/hooks/useBuyerContext';
import { Money } from '@/ui/components/Money';
import type { Product } from '@/domain/models';

export const QuickOrderPage = () => {
  const commerce = useCommerce();
  const context = useBuyerContext();
  const add = useAddToCart();
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lookup = async () => {
    setError(null);
    setProduct(null);
    if (!sku.trim()) return;
    const found = await commerce.catalog.getProductBySku(context, sku.trim());
    if (!found) {
      setError(`No product found for SKU "${sku}"`);
      return;
    }
    setProduct(found);
  };

  const addNow = async () => {
    if (!product) return;
    await add.mutateAsync({ sku: product.sku, quantity });
  };

  return (
    <>
      <PageHeader title="Quick order" description="Add items by SKU." />
      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
            <TextField
              label="SKU"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') lookup();
              }}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Quantity"
              type="number"
              inputProps={{ min: 1 }}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              sx={{ width: 120 }}
            />
            <Button variant="outlined" onClick={lookup}>
              Look up
            </Button>
          </Stack>
          {error ? <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert> : null}
          {product ? (
            <Card variant="outlined" sx={{ mt: 2 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <div>
                    <Typography variant="h6">{product.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {product.sku}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      <Money value={product.variants[0]?.price ?? { amount: 0, currency: 'USD' }} />
                    </Typography>
                  </div>
                  <Button variant="contained" onClick={addNow} disabled={add.isPending}>
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
