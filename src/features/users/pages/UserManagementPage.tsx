import {
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
import { PageHeader } from '@/ui/components/PageHeader';
import { LoadingState } from '@/ui/components/LoadingState';
import { ErrorState } from '@/ui/components/ErrorState';
import { EmptyState } from '@/ui/components/EmptyState';
import { useUsers } from '../hooks/useUsers';

export const UserManagementPage = () => {
  const users = useUsers();
  if (users.isLoading) return <LoadingState />;
  if (users.error) return <ErrorState error={users.error} onRetry={users.refetch} />;
  const items = users.data?.items ?? [];

  return (
    <>
      <PageHeader title="Users" description="Manage company buyers and their roles." />
      {items.length === 0 ? (
        <EmptyState title="No users yet" />
      ) : (
        <Card>
          <CardContent>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <Stack>
                        <Typography>{u.firstName} {u.lastName}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.role.name}{u.role.isAdmin ? ' (admin)' : ''}</TableCell>
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
