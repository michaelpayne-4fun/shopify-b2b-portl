import { Box, List, ListItemButton, ListItemText } from '@mui/material';
import { NavLink, useLocation } from 'react-router-dom';
import { appConfig } from '@/app/config';
import type { Permission } from '@/domain/models';
import { usePermission } from './Can';

interface NavItem {
  to: string;
  label: string;
  permission?: Permission;
  flag?: keyof typeof appConfig.features;
}

const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard' },
  { to: '/orders', label: 'Orders', permission: 'orders.view' },
  { to: '/quotes', label: 'Quotes', permission: 'quotes.view', flag: 'quotes' },
  { to: '/quick-order', label: 'Quick Order', permission: 'cart.update' },
  { to: '/cart', label: 'Cart', permission: 'cart.view' },
  { to: '/shopping-lists', label: 'Shopping Lists', permission: 'shoppingLists.view', flag: 'shoppingLists' },
  { to: '/addresses', label: 'Addresses', permission: 'addresses.view', flag: 'companyManagement' },
  { to: '/users', label: 'Users', permission: 'users.view', flag: 'companyManagement' },
  { to: '/company', label: 'Company', permission: 'company.view', flag: 'companyManagement' },
  { to: '/invoices', label: 'Invoices', permission: 'invoices.view', flag: 'invoices' },
  { to: '/account', label: 'Account Settings' },
];

const SidebarLink = ({ item }: { item: NavItem }) => {
  const location = useLocation();
  const allowed = usePermission(item.permission ?? 'account.view');
  if (item.permission && !allowed) return null;
  if (item.flag && !appConfig.features[item.flag]) return null;
  const selected = location.pathname === item.to;
  return (
    <ListItemButton component={NavLink} to={item.to} selected={selected}>
      <ListItemText primary={item.label} />
    </ListItemButton>
  );
};

export const AppSidebar = () => (
  <Box
    component="nav"
    sx={{
      width: 240,
      borderRight: 1,
      borderColor: 'divider',
      backgroundColor: 'background.paper',
      flexShrink: 0,
    }}
  >
    <List dense>
      {NAV.map((item) => (
        <SidebarLink key={item.to} item={item} />
      ))}
    </List>
  </Box>
);
