import {
  Alert, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControl, IconButton, InputLabel, MenuItem, Select,
  Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { InviteUserInput } from '@b2b/domain';
import { assignRole, inviteUser, listRoles, listUsers, removeUser } from '@/services/userService';
import { queryKeys } from '@/state/queries/queryKeys';
import { PageHeader } from '@/ui/components/PageHeader';
import { LoadingState } from '@/ui/components/LoadingState';
import { EmptyState } from '@/ui/components/EmptyState';
import { Can } from '@/ui/components/Can';

const EMPTY_INVITE: InviteUserInput = { email: '', firstName: '', lastName: '', roleId: '' };

export const UserManagementPage = () => {
  const qc = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState<InviteUserInput>(EMPTY_INVITE);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  const users = useQuery({ queryKey: queryKeys.users, queryFn: listUsers });
  const roles = useQuery({ queryKey: ['roles'], queryFn: listRoles, staleTime: 60_000 });

  const invite = useMutation({
    mutationFn: (input: InviteUserInput) => inviteUser(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users });
      setInviteOpen(false);
      setForm(EMPTY_INVITE);
    },
  });

  const changeRole = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      assignRole(userId, roleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.users }),
  });

  const remove = useMutation({
    mutationFn: (userId: string) => removeUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users });
      setConfirmDelete(null);
    },
  });

  if (users.isLoading) return <LoadingState />;
  // The server now degrades to a 200 with `warning: 'scope-missing'`
  // when read_customers isn't granted, so we key on that instead of
  // `users.error` (which would only be set on a hard failure).
  const scopeMissing = users.data?.warning === 'scope-missing' || !!users.error;
  const items = users.data?.items ?? [];
  const roleList = roles.data ?? [];

  const handleInviteOpen = () => {
    setForm(EMPTY_INVITE);
    setInviteOpen(true);
  };

  const formValid =
    form.email.includes('@') && form.firstName.trim() && form.lastName.trim() && form.roleId;

  return (
    <>
      <PageHeader
        title="Users"
        description="Company buyers, their Shopify roles, and portal permissions."
        actions={
          <Can permission="portal.admin">
            <Button variant="contained" startIcon={<PersonAddIcon />} onClick={handleInviteOpen}>
              Invite user
            </Button>
          </Can>
        }
      />

      {scopeMissing && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Could not load company contacts — the Shopify app may be missing the{' '}
          <strong>read_customers</strong> scope. Add it in the Partner Dashboard then reinstall.
        </Alert>
      )}

      {!scopeMissing && items.length === 0 ? (
        <EmptyState title="No users found" description="Invite your first buyer using the button above." />
      ) : items.length > 0 ? (
        <Card><CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Shopify role</TableCell>
                <TableCell>Portal permissions</TableCell>
                <TableCell sx={{ width: 48 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>
                    <Typography variant="body2">
                      {u.firstName} {u.lastName}
                      {u.role.isAdmin ? (
                        <Chip size="small" label="Admin" color="primary" sx={{ ml: 1 }} />
                      ) : null}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{u.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Can permission="portal.admin" fallback={<Typography variant="body2">{u.role.name}</Typography>}>
                      <FormControl size="small" sx={{ minWidth: 160 }}>
                        <Select
                          value={u.role.id}
                          onChange={(e) => changeRole.mutate({ userId: u.contactId ?? u.id, roleId: e.target.value })}
                          disabled={changeRole.isPending}
                        >
                          {roleList.length > 0
                            ? roleList.map((r) => (
                                <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                              ))
                            : <MenuItem value={u.role.id}>{u.role.name}</MenuItem>}
                        </Select>
                      </FormControl>
                    </Can>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {u.role.permissions.length > 0
                        ? `${u.role.permissions.length} permission${u.role.permissions.length === 1 ? '' : 's'}`
                        : 'Default'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Can permission="portal.admin">
                      <Tooltip title="Remove user">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setConfirmDelete({ id: u.contactId ?? u.id, name: `${u.firstName} ${u.lastName}` })}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Can>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      ) : null}

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onClose={() => !invite.isPending && setInviteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite user</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            {invite.error ? (
              <Alert severity="error">{(invite.error as Error).message}</Alert>
            ) : null}
            <Stack direction="row" spacing={2}>
              <TextField
                label="First name"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                required
                fullWidth
                disabled={invite.isPending}
              />
              <TextField
                label="Last name"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                required
                fullWidth
                disabled={invite.isPending}
              />
            </Stack>
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              fullWidth
              disabled={invite.isPending}
            />
            <FormControl fullWidth required>
              <InputLabel>Role</InputLabel>
              <Select
                label="Role"
                value={form.roleId}
                onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}
                disabled={invite.isPending || roles.isLoading}
              >
                {roleList.map((r) => (
                  <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteOpen(false)} disabled={invite.isPending}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => invite.mutate(form)}
            disabled={!formValid || invite.isPending}
          >
            {invite.isPending ? 'Inviting…' : 'Send invite'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!confirmDelete} onClose={() => !remove.isPending && setConfirmDelete(null)} maxWidth="xs">
        <DialogTitle>Remove user?</DialogTitle>
        <DialogContent>
          <Typography>
            This will remove <strong>{confirmDelete?.name}</strong> from your company portal and
            revoke all their portal-level grants. Their Shopify account is not deleted.
          </Typography>
          {remove.error ? (
            <Alert severity="error" sx={{ mt: 2 }}>{(remove.error as Error).message}</Alert>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)} disabled={remove.isPending}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => confirmDelete && remove.mutate(confirmDelete.id)}
            disabled={remove.isPending}
          >
            {remove.isPending ? 'Removing…' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
