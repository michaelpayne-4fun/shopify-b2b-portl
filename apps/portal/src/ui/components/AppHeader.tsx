import { AppBar, Box, Button, Stack, Toolbar, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBuyerContextStore } from '@/state/stores/buyerContextStore';
import { logout } from '@/services/authService';

export const AppHeader = () => {
  const navigate = useNavigate();
  const context = useBuyerContextStore((s) => s.context);
  const setContext = useBuyerContextStore((s) => s.setContext);
  const qc = useQueryClient();
  const signOut = useMutation({
    mutationFn: logout,
    onSettled: () => {
      setContext(null);
      qc.clear();
      navigate('/login', { replace: true });
    },
  });
  return (
    <AppBar position="static" color="inherit" elevation={0}
            sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Toolbar>
        <Typography variant="h6" sx={{ fontWeight: 700, mr: 4 }}>B2B Portal</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Stack direction="row" spacing={2} alignItems="center">
          {context ? (
            <Typography variant="body2" color="text.secondary">
              {context.company.name}{context.location ? ` · ${context.location.name}` : ''}
            </Typography>
          ) : null}
          {context ? (
            <Button onClick={() => signOut.mutate()} disabled={signOut.isPending}>Sign out</Button>
          ) : null}
        </Stack>
      </Toolbar>
    </AppBar>
  );
};
