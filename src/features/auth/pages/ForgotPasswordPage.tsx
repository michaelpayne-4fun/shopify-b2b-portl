import { Alert, Button, Stack, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { FormTextField } from '@/ui/forms/FormTextField';
import { useCommerce } from '@/app/providers/CommerceProvider';
import { Link as RouterLink } from 'react-router-dom';

interface FormValues {
  email: string;
}

export const ForgotPasswordPage = () => {
  const commerce = useCommerce();
  const { control, handleSubmit } = useForm<FormValues>({ defaultValues: { email: '' } });
  const reset = useMutation({
    mutationFn: (values: FormValues) => commerce.auth.requestPasswordReset(values.email),
  });

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Reset your password</Typography>
      {reset.isSuccess ? (
        <Alert severity="success">
          If an account exists for that email, you will receive instructions shortly.
        </Alert>
      ) : null}
      {reset.error ? <Alert severity="error">{(reset.error as Error).message}</Alert> : null}
      <form onSubmit={handleSubmit((values) => reset.mutate(values))}>
        <Stack spacing={2}>
          <FormTextField control={control} name="email" type="email" label="Email" required fullWidth />
          <Button type="submit" variant="contained" disabled={reset.isPending}>
            {reset.isPending ? 'Sending…' : 'Send reset link'}
          </Button>
        </Stack>
      </form>
      <Typography variant="body2">
        Remembered your password? <RouterLink to="/login">Sign in</RouterLink>
      </Typography>
    </Stack>
  );
};
