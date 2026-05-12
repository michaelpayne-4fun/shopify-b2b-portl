import { CssBaseline, ThemeProvider as MuiThemeProvider } from '@mui/material';
import type { ReactNode } from 'react';
import { theme } from '@/ui/theme';

export const ThemeProvider = ({ children }: { children: ReactNode }) => (
  <MuiThemeProvider theme={theme}>
    <CssBaseline />
    {children}
  </MuiThemeProvider>
);
