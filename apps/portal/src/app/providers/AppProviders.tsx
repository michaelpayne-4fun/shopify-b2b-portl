import { CssBaseline, ThemeProvider } from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { useMemo, type ReactNode } from 'react';
import { theme } from '@/ui/theme';
import { createQueryClient } from '@/state/queries/queryClient';

export const AppProviders = ({ children }: { children: ReactNode }) => {
  const client = useMemo(createQueryClient, []);
  return (
    <QueryClientProvider client={client}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
};
