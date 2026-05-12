import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/state/stores/authStore';
import { useBuyerContextStore } from '@/state/stores/buyerContextStore';
import { LoadingState } from '@/ui/components/LoadingState';
import { useResolveBuyerContext } from '@/features/auth/hooks/useResolveBuyerContext';

export const ProtectedRoute = () => {
  const location = useLocation();
  const session = useAuthStore((s) => s.session);
  const context = useBuyerContextStore((s) => s.context);
  const { isLoading, error } = useResolveBuyerContext();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (error) {
    // The session is bad; bounce to login.
    return <Navigate to="/login" replace />;
  }
  if (!context || isLoading) {
    return <LoadingState label="Loading your portal…" />;
  }
  return <Outlet />;
};
