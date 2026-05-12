import { Component, type ReactNode } from 'react';
import { ErrorState } from '@/ui/components/ErrorState';

interface State { error: Error | null }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  override componentDidCatch(error: Error): void {
    // eslint-disable-next-line no-console
    console.error('Unhandled UI error', error);
  }
  override render() {
    if (this.state.error) {
      return <ErrorState title="Unexpected error" error={this.state.error}
                         onRetry={() => this.setState({ error: null })} />;
    }
    return this.props.children;
  }
}
