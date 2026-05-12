import { AppBar, Box, Button, Stack, Toolbar, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useBuyerContextStore } from '@/state/stores/buyerContextStore';
import { useAuthStore } from '@/state/stores/authStore';
import { useCommerce } from '@/app/providers/CommerceProvider';

export const AppHeader = () => {
  const navigate = useNavigate();
  const context = useBuyerContextStore((s) => s.context);
  const clearContext = useBuyerContextStore((s) => s.setContext);
  const session = useAuthStore((s) => s.session);
  const clearSession = useAuthStore((s) => s.clear);
  const commerce = useCommerce();

  const handleLogout = async () => {
    if (session) {
      try {
        await commerce.auth.logout(session);
      } catch {
        // Ignore logout errors; we still clear the local session.
      }
    }
    clearSession();
    clearContext(null);
    navigate('/login', { replace: true });
  };

  return (
    <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Toolbar>
        <Typography variant="h6" sx={{ fontWeight: 700, mr: 4 }}>
          B2B Portal
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Stack direction="row" spacing={2} alignItems="center">
          {context ? (
            <Typography variant="body2" color="text.secondary">
              {context.company.name}
              {context.location ? ` · ${context.location.name}` : ''}
            </Typography>
          ) : null}
          {session ? (
            <Button variant="text" onClick={handleLogout}>
              Sign out
            </Button>
          ) : null}
        </Stack>
      </Toolbar>
    </AppBar>
  );
};
