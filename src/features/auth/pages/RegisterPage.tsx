import { Alert, Button, Stack, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useCommerce } from '@/app/providers/CommerceProvider';
import { useAuthStore } from '@/state/stores/authStore';
import { useBuyerContextStore } from '@/state/stores/buyerContextStore';
import { FormTextField } from '@/ui/forms/FormTextField';
import { appConfig } from '@/app/config';

interface FormValues {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
}

export const RegisterPage = () => {
  const commerce = useCommerce();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const setContext = useBuyerContextStore((s) => s.setContext);
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: { email: '', password: '', firstName: '', lastName: '', companyName: '' },
  });

  const register = useMutation({
    mutationFn: async (values: FormValues) => {
      const session = await commerce.auth.register(values);
      const { company, activeLocationId } = await commerce.company.resolveContext(session);
      return { session, company, activeLocationId };
    },
  });

  useEffect(() => {
    if (register.data) {
      const { session, company, activeLocationId } = register.data;
      setSession(session);
      setContext({
        buyer: session.buyer,
        company,
        location: company.locations.find((l) => l.id === activeLocationId),
        currency: appConfig.defaultCurrency,
        locale: session.buyer.locale ?? appConfig.defaultLocale,
      });
      navigate('/', { replace: true });
    }
  }, [register.data, setSession, setContext, navigate]);

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Create your account</Typography>
      {register.error ? <Alert severity="error">{(register.error as Error).message}</Alert> : null}
      <form onSubmit={handleSubmit((values) => register.mutate(values))}>
        <Stack spacing={2}>
          <FormTextField control={control} name="firstName" label="First name" required fullWidth />
          <FormTextField control={control} name="lastName" label="Last name" required fullWidth />
          <FormTextField control={control} name="companyName" label="Company" required fullWidth />
          <FormTextField control={control} name="email" type="email" label="Email" required fullWidth />
          <FormTextField control={control} name="password" type="password" label="Password" required fullWidth />
          <Button type="submit" variant="contained" disabled={register.isPending}>
            {register.isPending ? 'Creating…' : 'Create account'}
          </Button>
        </Stack>
      </form>
      <Typography variant="body2">
        Already have an account? <RouterLink to="/login">Sign in</RouterLink>
      </Typography>
    </Stack>
  );
};
