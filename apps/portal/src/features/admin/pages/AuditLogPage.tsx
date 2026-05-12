import {
  Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { listAuditLog } from '@/services/adminService';
import { queryKeys } from '@/state/queries/queryKeys';
import { PageHeader } from '@/ui/components/PageHeader';
import { LoadingState } from '@/ui/components/LoadingState';
import { ErrorState } from '@/ui/components/ErrorState';
import { EmptyState } from '@/ui/components/EmptyState';

export const AuditLogPage = () => {
  const q = useQuery({ queryKey: queryKeys.admin.audit, queryFn: listAuditLog });
  if (q.isLoading) return <LoadingState />;
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />;
  const items = q.data?.items ?? [];
  return (
    <>
      <PageHeader title="Audit log" description="Append-only record of admin changes." />
      {items.length === 0 ? (
        <EmptyState title="No audit entries yet" />
      ) : (
        <Card><CardContent>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>When</TableCell>
              <TableCell>Actor</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Subject</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {items.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{new Date(e.at).toLocaleString()}</TableCell>
                  <TableCell><Typography variant="body2">{e.actorId}</Typography></TableCell>
                  <TableCell>{e.action}</TableCell>
                  <TableCell>{e.subjectType}:{e.subjectId}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      )}
    </>
  );
};
