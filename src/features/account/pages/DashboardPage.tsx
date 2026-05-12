import { Card, CardActionArea, CardContent, Grid, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useBuyerContext } from '@/features/auth/hooks/useBuyerContext';
import { PageHeader } from '@/ui/components/PageHeader';
import { Can } from '@/ui/components/Can';
import type { Permission } from '@/domain/models';

interface Tile {
  to: string;
  title: string;
  description: string;
  permission: Permission;
}

const TILES: Tile[] = [
  { to: '/orders', title: 'Orders', description: 'Recent orders and status', permission: 'orders.view' },
  { to: '/quotes', title: 'Quotes', description: 'Draft, submitted, and approved quotes', permission: 'quotes.view' },
  { to: '/quick-order', title: 'Quick Order', description: 'Add items by SKU', permission: 'cart.update' },
  { to: '/cart', title: 'Cart', description: 'Review and check out', permission: 'cart.view' },
  { to: '/shopping-lists', title: 'Shopping Lists', description: 'Saved baskets', permission: 'shoppingLists.view' },
  { to: '/users', title: 'Users', description: 'Manage company users', permission: 'users.view' },
];

export const DashboardPage = () => {
  const context = useBuyerContext();
  return (
    <>
      <PageHeader
        title={`Welcome, ${context.buyer.firstName}`}
        description={`Acting on behalf of ${context.company.name}`}
      />
      <Grid container spacing={2}>
        {TILES.map((tile) => (
          <Can key={tile.to} permission={tile.permission}>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardActionArea component={RouterLink} to={tile.to}>
                  <CardContent>
                    <Typography variant="h6">{tile.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {tile.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          </Can>
        ))}
      </Grid>
    </>
  );
};
