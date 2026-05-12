import { Alert, Button, Stack, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { FormTextField } from '@/ui/forms/FormTextField';
import { useLogin } from '../hooks/useLogin';
import { useAuthStore } from '@/state/stores/authStore';
import { useBuyerContextStore } from '@/state/stores/buyerContextStore';

interface FormValues {
  email: string;
  password: string;
}

interface LocationState {
  from?: string;
}

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const session = useAuthStore((s) => s.session);
  const context = useBuyerContextStore((s) => s.context);
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: { email: '', password: '' },
  });
  const login = useLogin();

  useEffect(() => {
    if (session && context) {
      const state = location.state as LocationState | undefined;
      navigate(state?.from && state.from !== '/login' ? state.from : '/', { replace: true });
    }
  }, [session, context, navigate, location.state]);

  const onSubmit = handleSubmit((values) => login.mutate(values));

  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4" gutterBottom>
          Sign in
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Use your company account to access the buyer portal.
        </Typography>
      </div>
      {login.error ? <Alert severity="error">{(login.error as Error).message}</Alert> : null}
      <form onSubmit={onSubmit}>
        <Stack spacing={2}>
          <FormTextField
            control={control}
            name="email"
            label="Email"
            type="email"
            autoComplete="username"
            required
            fullWidth
          />
          <FormTextField
            control={control}
            name="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            fullWidth
          />
          <Button type="submit" variant="contained" disabled={login.isPending}>
            {login.isPending ? 'Signing in…' : 'Sign in'}
          </Button>
        </Stack>
      </form>
      <Typography variant="body2">
        Forgot your password? <RouterLink to="/forgot-password">Reset it</RouterLink>
      </Typography>
    </Stack>
  );
};
