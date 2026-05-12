import {
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { PageHeader } from '@/ui/components/PageHeader';
import { LoadingState } from '@/ui/components/LoadingState';
import { ErrorState } from '@/ui/components/ErrorState';
import { EmptyState } from '@/ui/components/EmptyState';
import { Money } from '@/ui/components/Money';
import { StatusChip } from '@/ui/components/StatusChip';
import { Can } from '@/ui/components/Can';
import { useQuotes } from '../hooks/useQuotes';

export const QuotesPage = () => {
  const quotes = useQuotes();
  if (quotes.isLoading) return <LoadingState />;
  if (quotes.error) return <ErrorState error={quotes.error} onRetry={quotes.refetch} />;
  const items = quotes.data?.items ?? [];

  return (
    <>
      <PageHeader
        title="Quotes"
        description="Drafts, submitted quotes, and approvals."
        actions={
          <Can permission="quotes.create">
            <Button component={RouterLink} to="/quotes/new" variant="contained">
              New quote
            </Button>
          </Can>
        }
      />
      {items.length === 0 ? (
        <EmptyState title="No quotes yet" />
      ) : (
        <Card>
          <CardContent>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Quote #</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((q) => (
                  <TableRow key={q.id} hover>
                    <TableCell>
                      <RouterLink to={`/quotes/${encodeURIComponent(q.id)}`}>{q.number}</RouterLink>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={q.status} />
                    </TableCell>
                    <TableCell>{new Date(q.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <Money value={q.total} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
};
