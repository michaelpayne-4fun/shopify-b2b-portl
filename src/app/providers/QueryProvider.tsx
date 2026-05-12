import { QueryClientProvider } from '@tanstack/react-query';
import { useMemo, type ReactNode } from 'react';
import { createQueryClient } from '@/state/queries/queryClient';

export const QueryProvider = ({ children }: { children: ReactNode }) => {
  const client = useMemo(createQueryClient, []);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};
