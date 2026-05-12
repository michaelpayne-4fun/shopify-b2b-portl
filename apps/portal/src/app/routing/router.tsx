import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RequirePermission } from './RequirePermission';
import { AuthLayout } from '@/ui/layouts/AuthLayout';
import { PortalLayout } from '@/ui/layouts/PortalLayout';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { AuthCallbackPage } from '@/features/auth/pages/AuthCallbackPage';
import { DashboardPage } from '@/features/account/pages/DashboardPage';
import { CartPage } from '@/features/cart/pages/CartPage';
import { QuickOrderPage } from '@/features/catalog/pages/QuickOrderPage';
import { OrdersPage } from '@/features/orders/pages/OrdersPage';
import { OrderDetailPage } from '@/features/orders/pages/OrderDetailPage';
import { QuotesPage } from '@/features/quotes/pages/QuotesPage';
import { QuoteDetailPage } from '@/features/quotes/pages/QuoteDetailPage';
import { QuoteDraftPage } from '@/features/quotes/pages/QuoteDraftPage';
import { ShoppingListsPage } from '@/features/shopping-lists/pages/ShoppingListsPage';
import { ShoppingListDetailPage } from '@/features/shopping-lists/pages/ShoppingListDetailPage';
import { AddressListPage } from '@/features/addresses/pages/AddressListPage';
import { UserManagementPage } from '@/features/users/pages/UserManagementPage';
import { CompanyHierarchyPage } from '@/features/company/pages/CompanyHierarchyPage';
import { ApprovalsPage } from '@/features/approvals/pages/ApprovalsPage';
import { AdminHomePage } from '@/features/admin/pages/AdminHomePage';
import { CompanySettingsPage } from '@/features/admin/pages/CompanySettingsPage';
import { RoleGrantsPage } from '@/features/admin/pages/RoleGrantsPage';
import { QuoteSettingsPage } from '@/features/admin/pages/QuoteSettingsPage';
import { ShoppingListSettingsPage } from '@/features/admin/pages/ShoppingListSettingsPage';
import { AuditLogPage } from '@/features/admin/pages/AuditLogPage';
import { FeaturesPage } from '@/features/admin/pages/FeaturesPage';
import { appConfig } from '@/app/config/env';

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/auth/callback', element: <AuthCallbackPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [{
      element: <PortalLayout />,
      children: [
        { index: true, element: <DashboardPage /> },
        {
          element: <RequirePermission permission="cart.view" />,
          children: [{ path: '/cart', element: <CartPage /> }],
        },
        {
          element: <RequirePermission permission="cart.update" />,
          children: [{ path: '/quick-order', element: <QuickOrderPage /> }],
        },
        {
          element: <RequirePermission permission="orders.view" />,
          children: [
            { path: '/orders', element: <OrdersPage /> },
            { path: '/orders/:id', element: <OrderDetailPage /> },
          ],
        },
        ...(appConfig.features.quotes ? [{
          element: <RequirePermission permission="quotes.view" />,
          children: [
            { path: '/quotes', element: <QuotesPage /> },
            { path: '/quotes/new', element: <QuoteDraftPage /> },
            { path: '/quotes/:id', element: <QuoteDetailPage /> },
          ],
        }] : []),
        ...(appConfig.features.shoppingLists ? [{
          element: <RequirePermission permission="shoppingLists.view" />,
          children: [
            { path: '/shopping-lists', element: <ShoppingListsPage /> },
            { path: '/shopping-lists/:id', element: <ShoppingListDetailPage /> },
          ],
        }] : []),
        ...(appConfig.features.approvals ? [{
          element: <RequirePermission permission="approvals.act" />,
          children: [{ path: '/approvals', element: <ApprovalsPage /> }],
        }] : []),
        {
          element: <RequirePermission permission="addresses.view" />,
          children: [{ path: '/addresses', element: <AddressListPage /> }],
        },
        {
          element: <RequirePermission permission="users.view" />,
          children: [{ path: '/users', element: <UserManagementPage /> }],
        },
        {
          element: <RequirePermission permission="company.view" />,
          children: [{ path: '/company', element: <CompanyHierarchyPage /> }],
        },
        {
          element: <RequirePermission permission="portal.admin" />,
          children: [
            { path: '/admin', element: <AdminHomePage /> },
            { path: '/admin/role-grants', element: <RoleGrantsPage /> },
            { path: '/admin/quote-settings', element: <QuoteSettingsPage /> },
            { path: '/admin/shopping-list-settings', element: <ShoppingListSettingsPage /> },
            { path: '/admin/company-settings', element: <CompanySettingsPage /> },
            { path: '/admin/audit-log', element: <AuditLogPage /> },
            { path: '/admin/features', element: <FeaturesPage /> },
          ],
        },
      ],
    }],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export const AppRouter = () => <RouterProvider router={router} />;
