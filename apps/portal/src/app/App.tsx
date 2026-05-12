import { AppProviders } from './providers/AppProviders';
import { AppRouter } from './routing/router';
import { ErrorBoundary } from '@/ui/feedback/ErrorBoundary';

export const App = () => (
  <ErrorBoundary>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </ErrorBoundary>
);
