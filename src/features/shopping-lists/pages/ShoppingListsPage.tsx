import { Card, CardContent, Stack, Typography } from '@mui/material';
import { PageHeader } from '@/ui/components/PageHeader';
import { EmptyState } from '@/ui/components/EmptyState';

export const ShoppingListsPage = () => (
  <>
    <PageHeader title="Shopping lists" description="Reusable baskets shared across your team." />
    <Stack spacing={2}>
      <Card>
        <CardContent>
          <Typography variant="h6">Monthly resupply</Typography>
          <Typography variant="body2" color="text.secondary">
            2 items · shared
          </Typography>
        </CardContent>
      </Card>
      <EmptyState
        title="Want more shopping lists?"
        description="The shopping-lists feature is wired through the commerce adapter; new lists can be added once your adapter implements them."
      />
    </Stack>
  </>
);

export const ShoppingListDetailPage = () => (
  <>
    <PageHeader title="Shopping list" />
    <EmptyState title="Detail view not yet implemented" />
  </>
);
