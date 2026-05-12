import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RequirePermission } from './RequirePermission';
import { AuthLayout } from '@/ui/layouts/AuthLayout';
import { PortalLayout } from '@/ui/layouts/PortalLayout';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { DashboardPage } from '@/features/account/pages/DashboardPage';
import { AccountSettingsPage } from '@/features/account/pages/AccountSettingsPage';
import { CompanyHierarchyPage } from '@/features/company/pages/CompanyHierarchyPage';
import { UserManagementPage } from '@/features/users/pages/UserManagementPage';
import { AddressListPage } from '@/features/addresses/pages/AddressListPage';
import { QuickOrderPage } from '@/features/catalog/pages/QuickOrderPage';
import { CartPage } from '@/features/cart/pages/CartPage';
import { OrdersPage } from '@/features/orders/pages/OrdersPage';
import { OrderDetailPage } from '@/features/orders/pages/OrderDetailPage';
import { QuotesPage } from '@/features/quotes/pages/QuotesPage';
import { QuoteDetailPage } from '@/features/quotes/pages/QuoteDetailPage';
import { QuoteDraftPage } from '@/features/quotes/pages/QuoteDraftPage';
import {
  ShoppingListsPage,
  ShoppingListDetailPage,
} from '@/features/shopping-lists/pages/ShoppingListsPage';
import { InvoicesPage } from '@/features/invoices/pages/InvoicesPage';
import { appConfig } from '@/app/config';

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <PortalLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: '/account', element: <AccountSettingsPage /> },
          {
            element: <RequirePermission permission="orders.view" />,
            children: [
              { path: '/orders', element: <OrdersPage /> },
              { path: '/orders/:orderId', element: <OrderDetailPage /> },
            ],
          },
          ...(appConfig.features.quotes
            ? [
                {
                  element: <RequirePermission permission="quotes.view" />,
                  children: [
                    { path: '/quotes', element: <QuotesPage /> },
                    { path: '/quotes/new', element: <QuoteDraftPage /> },
                    { path: '/quotes/:quoteId', element: <QuoteDetailPage /> },
                  ],
                },
              ]
            : []),
          {
            element: <RequirePermission permission="cart.update" />,
            children: [{ path: '/quick-order', element: <QuickOrderPage /> }],
          },
          {
            element: <RequirePermission permission="cart.view" />,
            children: [{ path: '/cart', element: <CartPage /> }],
          },
          ...(appConfig.features.shoppingLists
            ? [
                {
                  element: <RequirePermission permission="shoppingLists.view" />,
                  children: [
                    { path: '/shopping-lists', element: <ShoppingListsPage /> },
                    { path: '/shopping-lists/:id', element: <ShoppingListDetailPage /> },
                  ],
                },
              ]
            : []),
          ...(appConfig.features.companyManagement
            ? [
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
              ]
            : []),
          ...(appConfig.features.invoices
            ? [
                {
                  element: <RequirePermission permission="invoices.view" />,
                  children: [{ path: '/invoices', element: <InvoicesPage /> }],
                },
              ]
            : []),
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export const AppRouter = () => <RouterProvider router={router} />;
