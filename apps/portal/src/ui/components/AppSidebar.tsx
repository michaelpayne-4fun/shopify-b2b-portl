import { Box, List, ListItemButton, ListItemText, Divider, Typography } from '@mui/material';
import { NavLink, useLocation } from 'react-router-dom';
import type { Permission } from '@b2b/domain';
import { appConfig } from '@/app/config/env';
import { usePermission } from './Can';

interface Item {
  to: string;
  label: string;
  permission?: Permission;
  flag?: keyof typeof appConfig.features;
}

const BUYER: Item[] = [
  { to: '/', label: 'Dashboard' },
  { to: '/orders', label: 'Orders', permission: 'orders.view' },
  { to: '/quotes', label: 'Quotes', permission: 'quotes.view', flag: 'quotes' },
  { to: '/quick-order', label: 'Quick Order', permission: 'cart.update' },
  { to: '/cart', label: 'Cart', permission: 'cart.view' },
  { to: '/shopping-lists', label: 'Shopping Lists', permission: 'shoppingLists.view', flag: 'shoppingLists' },
  { to: '/addresses', label: 'Addresses', permission: 'addresses.view' },
  { to: '/users', label: 'Users', permission: 'users.view' },
  { to: '/company', label: 'Company', permission: 'company.view' },
  { to: '/approvals', label: 'Approvals', permission: 'approvals.act', flag: 'approvals' },
];

const ADMIN: Item[] = [
  { to: '/admin', label: 'Admin home', permission: 'portal.admin' },
  { to: '/admin/role-grants', label: 'Role grants', permission: 'portal.admin' },
  { to: '/admin/quote-settings', label: 'Quote settings', permission: 'portal.admin' },
  { to: '/admin/shopping-list-settings', label: 'Shopping list settings', permission: 'portal.admin' },
  { to: '/admin/company-settings', label: 'Company settings', permission: 'portal.admin' },
  { to: '/admin/audit-log', label: 'Audit log', permission: 'portal.admin' },
  { to: '/admin/features', label: 'Features', permission: 'portal.admin' },
];

const Section = ({ items }: { items: Item[] }) => {
  const location = useLocation();
  return (
    <List dense>
      {items.map((item) => {
        const allowed = usePermission(item.permission ?? 'account.view');
        if (item.permission && !allowed) return null;
        if (item.flag && !appConfig.features[item.flag]) return null;
        return (
          <ListItemButton key={item.to} component={NavLink} to={item.to}
                          selected={location.pathname === item.to}>
            <ListItemText primary={item.label} />
          </ListItemButton>
        );
      })}
    </List>
  );
};

export const AppSidebar = () => {
  const canAdmin = usePermission('portal.admin');
  return (
    <Box component="nav" sx={{
      width: 240, borderRight: 1, borderColor: 'divider',
      backgroundColor: 'background.paper', flexShrink: 0,
    }}>
      <Section items={BUYER} />
      {canAdmin ? (
        <>
          <Divider />
          <Typography variant="overline" sx={{ px: 2, pt: 2, display: 'block' }}>Admin</Typography>
          <Section items={ADMIN} />
        </>
      ) : null}
    </Box>
  );
};
