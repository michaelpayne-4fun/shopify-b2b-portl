import {
  Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { listAuditLog } from '@/services/adminService';
import { queryKeys } from '@/state/queries/queryKeys';
import { PageHeader } from '@/ui/components/PageHeader';
import { LoadingState } from '@/ui/components/LoadingState';
import { ErrorState } from '@/ui/components/ErrorState';
import { EmptyState } from '@/ui/components/EmptyState';

/**
 * Format a Shopify GID like gid://shopify/Customer/123 into "Customer 123".
 * Falls back to the raw value if it doesn't match the expected pattern.
 */
const formatGid = (gid: string): { short: string; full: string } => {
  const m = /^gid:\/\/shopify\/([^/]+)\/(\w+)$/.exec(gid);
  if (!m) return { short: gid, full: gid };
  // Split CamelCase type into words: CompanyContact -> Company Contact
  const typeName = m[1].replace(/([a-z])([A-Z])/g, '$1 $2');
  return { short: `${typeName} ${m[2]}`, full: gid };
};

/** Format action snake_case to Title Case words */
const formatAction = (action: string) =>
  action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

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
              {items.map((e) => {
                const actor = formatGid(e.actorId);
                const subject = formatGid(e.subjectId);
                return (
                  <TableRow key={e.id}>
                    <TableCell>
                      <Tooltip title={new Date(e.at).toISOString()} placement="top">
                        <span>{new Date(e.at).toLocaleString()}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={actor.full} placement="top">
                        <Typography variant="body2">{actor.short}</Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{formatAction(e.action)}</TableCell>
                    <TableCell>
                      <Tooltip title={subject.full} placement="top">
                        <span>{e.subjectType}: {subject.short}</span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent></Card>
      )}
    </>
  );
};
