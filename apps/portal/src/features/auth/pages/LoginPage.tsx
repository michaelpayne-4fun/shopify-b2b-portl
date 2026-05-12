import { Alert, Button, Stack, Typography } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { beginLogin } from '@/services/authService';

export const LoginPage = () => {
  const login = useMutation({
    mutationFn: beginLogin,
    onSuccess: (data) => {
      window.location.assign(data.authorizeUrl);
    },
  });

  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4" gutterBottom>Sign in</Typography>
        <Typography variant="body2" color="text.secondary">
          Sign in with your Shopify customer account to access the B2B portal.
        </Typography>
      </div>
      {login.error ? <Alert severity="error">{(login.error as Error).message}</Alert> : null}
      <Button variant="contained" size="large" onClick={() => login.mutate()} disabled={login.isPending}>
        {login.isPending ? 'Redirecting…' : 'Continue with Shopify'}
      </Button>
      <Typography variant="caption" color="text.secondary">
        You will be redirected to Shopify to authenticate, then returned here.
      </Typography>
    </Stack>
  );
};
