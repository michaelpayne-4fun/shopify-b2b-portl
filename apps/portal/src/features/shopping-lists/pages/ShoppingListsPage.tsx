import { Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  createShoppingList, deleteShoppingList, listShoppingLists,
} from '@/services/shoppingListService';
import { queryKeys } from '@/state/queries/queryKeys';
import { PageHeader } from '@/ui/components/PageHeader';
import { LoadingState } from '@/ui/components/LoadingState';
import { ErrorState } from '@/ui/components/ErrorState';
import { EmptyState } from '@/ui/components/EmptyState';
import { Can } from '@/ui/components/Can';

export const ShoppingListsPage = () => {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: queryKeys.shoppingLists.list, queryFn: listShoppingLists });
  const [name, setName] = useState('New list');
  const create = useMutation({
    mutationFn: () => createShoppingList({ name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.shoppingLists.list }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteShoppingList(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.shoppingLists.list }),
  });

  if (q.isLoading) return <LoadingState />;
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />;
  const items = q.data?.items ?? [];

  return (
    <>
      <PageHeader title="Shopping lists" description="Reusable baskets shared across your team."
        actions={
          <Can permission="shoppingLists.manage">
            <Button variant="contained" onClick={() => create.mutate()} disabled={create.isPending}>
              New list
            </Button>
          </Can>
        } />
      {items.length === 0 ? (
        <EmptyState title="No lists yet" description="Create one to organize repeating orders." />
      ) : (
        <Stack spacing={2}>
          {items.map((l) => (
            <Card key={l.id}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <div>
                    <Typography variant="h6">
                      <RouterLink to={`/shopping-lists/${encodeURIComponent(l.id)}`}>{l.name}</RouterLink>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {l.items.length} item{l.items.length === 1 ? '' : 's'} · {l.isShared ? 'shared' : 'private'}
                    </Typography>
                  </div>
                  <Can permission="shoppingLists.manage">
                    <Button color="error" onClick={() => remove.mutate(l.id)} disabled={remove.isPending}>
                      Delete
                    </Button>
                  </Can>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
      {/* hidden control for naming — kept simple in v1 */}
      <input type="hidden" value={name} onChange={(e) => setName(e.target.value)} />
    </>
  );
};
