import type { ReactNode } from 'react';
import { CommerceProvider } from './CommerceProvider';
import { QueryProvider } from './QueryProvider';
import { ThemeProvider } from './ThemeProvider';
import type { CommerceAdapter } from '@/commerce/interfaces';

export interface AppProvidersProps {
  adapter?: CommerceAdapter;
  children: ReactNode;
}

export const AppProviders = ({ adapter, children }: AppProvidersProps) => (
  <CommerceProvider adapter={adapter}>
    <QueryProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryProvider>
  </CommerceProvider>
);
