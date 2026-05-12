import {
  Button, Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listQuotes } from '@/services/quoteService';
import { queryKeys } from '@/state/queries/queryKeys';
import { PageHeader } from '@/ui/components/PageHeader';
import { LoadingState } from '@/ui/components/LoadingState';
import { ErrorState } from '@/ui/components/ErrorState';
import { EmptyState } from '@/ui/components/EmptyState';
import { Money } from '@/ui/components/Money';
import { StatusChip } from '@/ui/components/StatusChip';
import { Can } from '@/ui/components/Can';

export const QuotesPage = () => {
  const q = useQuery({ queryKey: queryKeys.quotes.list(), queryFn: () => listQuotes() });
  if (q.isLoading) return <LoadingState />;
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />;
  const items = q.data?.items ?? [];
  return (
    <>
      <PageHeader title="Quotes" description="Drafts, submitted, and approved quotes."
        actions={
          <Can permission="quotes.create">
            <Button component={RouterLink} to="/quotes/new" variant="contained">New quote</Button>
          </Can>
        } />
      {items.length === 0 ? (
        <EmptyState title="No quotes yet" />
      ) : (
        <Card><CardContent>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>Quote #</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Total</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.id} hover>
                  <TableCell><RouterLink to={`/quotes/${encodeURIComponent(it.id)}`}>{it.number}</RouterLink></TableCell>
                  <TableCell><StatusChip status={it.status} /></TableCell>
                  <TableCell>{new Date(it.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align="right"><Money value={it.total} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      )}
    </>
  );
};
