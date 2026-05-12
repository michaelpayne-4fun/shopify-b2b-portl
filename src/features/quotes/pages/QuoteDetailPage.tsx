import {
  Button,
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/ui/components/PageHeader';
import { LoadingState } from '@/ui/components/LoadingState';
import { ErrorState } from '@/ui/components/ErrorState';
import { Money } from '@/ui/components/Money';
import { StatusChip } from '@/ui/components/StatusChip';
import { useQuote, useSubmitQuote } from '../hooks/useQuotes';
import { useBuyerContext } from '@/features/auth/hooks/useBuyerContext';
import { QuotePolicy } from '@/domain/policies/QuotePolicy';

export const QuoteDetailPage = () => {
  const { quoteId } = useParams<{ quoteId: string }>();
  const quote = useQuote(quoteId);
  const submit = useSubmitQuote();
  const context = useBuyerContext();

  if (quote.isLoading) return <LoadingState />;
  if (quote.error) return <ErrorState error={quote.error} onRetry={quote.refetch} />;
  const q = quote.data!;

  return (
    <>
      <PageHeader
        title={`Quote ${q.number}`}
        description={`Created ${new Date(q.createdAt).toLocaleString()}`}
        actions={
          QuotePolicy.canSubmit(context, q) ? (
            <Button variant="contained" onClick={() => submit.mutate(q.id)} disabled={submit.isPending}>
              {submit.isPending ? 'Submitting…' : 'Submit quote'}
            </Button>
          ) : null
        }
      />
      <Stack spacing={2}>
        <Card>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Typography>
                Status: <StatusChip status={q.status} />
              </Typography>
              <Typography>
                Total: <Money value={q.total} />
              </Typography>
            </Stack>
            {q.notes ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {q.notes}
              </Typography>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Unit</TableCell>
                  <TableCell align="right">Line total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {q.lines.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <Typography>{l.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {l.sku}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{l.quantity}</TableCell>
                    <TableCell align="right">
                      <Money value={l.unitPrice} />
                    </TableCell>
                    <TableCell align="right">
                      <Money value={l.lineTotal} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Stack>
    </>
  );
};
