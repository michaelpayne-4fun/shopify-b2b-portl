import {
  Button, Card, CardContent, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QuotePolicy } from '@b2b/domain';
import {
  convertQuoteToCart, getQuote, submitQuote,
} from '@/services/quoteService';
import { queryKeys } from '@/state/queries/queryKeys';
import { PageHeader } from '@/ui/components/PageHeader';
import { LoadingState } from '@/ui/components/LoadingState';
import { ErrorState } from '@/ui/components/ErrorState';
import { Money } from '@/ui/components/Money';
import { StatusChip } from '@/ui/components/StatusChip';
import { useBuyerContextStore } from '@/state/stores/buyerContextStore';

export const QuoteDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const ctx = useBuyerContextStore((s) => s.context);
  const q = useQuery({
    queryKey: queryKeys.quotes.detail(id ?? ''),
    queryFn: () => getQuote(id!),
    enabled: !!id,
  });
  const submit = useMutation({
    mutationFn: () => submitQuote(id!),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.quotes.detail(id!) }),
  });
  const convert = useMutation({
    mutationFn: () => convertQuoteToCart(id!),
    onSuccess: () => navigate('/cart'),
  });

  if (q.isLoading) return <LoadingState />;
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />;
  const quote = q.data!;

  const actions = (
    <Stack direction="row" spacing={1}>
      {QuotePolicy.canSubmit(ctx, quote) ? (
        <Button variant="contained" onClick={() => submit.mutate()} disabled={submit.isPending}>
          {submit.isPending ? 'Submitting…' : 'Submit quote'}
        </Button>
      ) : null}
      {QuotePolicy.canConvertToCart(ctx, quote) ? (
        <Button variant="outlined" onClick={() => convert.mutate()} disabled={convert.isPending}>
          {convert.isPending ? 'Converting…' : 'Convert to cart'}
        </Button>
      ) : null}
    </Stack>
  );

  return (
    <>
      <PageHeader title={`Quote ${quote.number}`} actions={actions}
        description={`Created ${new Date(quote.createdAt).toLocaleString()}`} />
      <Stack spacing={2}>
        <Card><CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Typography>Status: <StatusChip status={quote.status} /></Typography>
            <Typography>Total: <Money value={quote.total} /></Typography>
          </Stack>
          {quote.notes ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>{quote.notes}</Typography>
          ) : null}
        </CardContent></Card>
        <Card><CardContent>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>Item</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell align="right">Unit</TableCell>
              <TableCell align="right">Line total</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {quote.lines.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <Typography>{l.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{l.sku}</Typography>
                  </TableCell>
                  <TableCell align="right">{l.quantity}</TableCell>
                  <TableCell align="right"><Money value={l.unitPrice} /></TableCell>
                  <TableCell align="right"><Money value={l.lineTotal} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      </Stack>
    </>
  );
};
