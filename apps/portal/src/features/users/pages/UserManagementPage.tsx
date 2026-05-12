import {
  Card, CardContent, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { listUsers } from '@/services/userService';
import { queryKeys } from '@/state/queries/queryKeys';
import { PageHeader } from '@/ui/components/PageHeader';
import { LoadingState } from '@/ui/components/LoadingState';
import { ErrorState } from '@/ui/components/ErrorState';
import { EmptyState } from '@/ui/components/EmptyState';

export const UserManagementPage = () => {
  const q = useQuery({ queryKey: queryKeys.users, queryFn: listUsers });
  if (q.isLoading) return <LoadingState />;
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />;
  const items = q.data?.items ?? [];
  return (
    <>
      <PageHeader title="Users" description="Company buyers and their roles." />
      {items.length === 0 ? (
        <EmptyState title="No users yet" />
      ) : (
        <Card><CardContent>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Permissions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {items.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <Stack><Typography>{u.firstName} {u.lastName}</Typography></Stack>
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.role.name}{u.role.isAdmin ? ' (admin)' : ''}</TableCell>
                  <TableCell>{u.role.permissions.length}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      )}
    </>
  );
};
