import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingState } from '@/ui/components/LoadingState';
import { useAuthMe } from '@/features/auth/hooks/useAuthMe';
import { useBuyerContextStore } from '@/state/stores/buyerContextStore';

export const ProtectedRoute = () => {
  const location = useLocation();
  const { isLoading, unauthenticated } = useAuthMe();
  const context = useBuyerContextStore((s) => s.context);

  if (unauthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (isLoading || !context) {
    return <LoadingState label="Loading your portal…" />;
  }
  return <Outlet />;
};
