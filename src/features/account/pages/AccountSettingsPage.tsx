import { Alert, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useCommerce } from '@/app/providers/CommerceProvider';
import { useBuyerContext } from '@/features/auth/hooks/useBuyerContext';
import { useBuyerContextStore } from '@/state/stores/buyerContextStore';
import { PageHeader } from '@/ui/components/PageHeader';
import { FormTextField } from '@/ui/forms/FormTextField';

interface ProfileForm {
  firstName: string;
  lastName: string;
  phone: string;
}

interface PasswordForm {
  current: string;
  next: string;
}

export const AccountSettingsPage = () => {
  const context = useBuyerContext();
  const commerce = useCommerce();
  const setContext = useBuyerContextStore((s) => s.setContext);

  const profileForm = useForm<ProfileForm>({
    defaultValues: {
      firstName: context.buyer.firstName,
      lastName: context.buyer.lastName,
      phone: context.buyer.phone ?? '',
    },
  });
  const passwordForm = useForm<PasswordForm>({ defaultValues: { current: '', next: '' } });

  const updateProfile = useMutation({
    mutationFn: async (values: ProfileForm) => commerce.customer.updateProfile(context, values),
    onSuccess: (buyer) => setContext({ ...context, buyer }),
  });
  const changePassword = useMutation({
    mutationFn: async ({ current, next }: PasswordForm) =>
      commerce.customer.changePassword(context, current, next),
    onSuccess: () => passwordForm.reset({ current: '', next: '' }),
  });

  return (
    <>
      <PageHeader title="Account settings" description="Update your contact details and password." />
      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Profile
            </Typography>
            {updateProfile.isSuccess ? <Alert severity="success">Profile updated.</Alert> : null}
            {updateProfile.error ? (
              <Alert severity="error">{(updateProfile.error as Error).message}</Alert>
            ) : null}
            <form onSubmit={profileForm.handleSubmit((v) => updateProfile.mutate(v))}>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <FormTextField control={profileForm.control} name="firstName" label="First name" required fullWidth />
                <FormTextField control={profileForm.control} name="lastName" label="Last name" required fullWidth />
                <FormTextField control={profileForm.control} name="phone" label="Phone" fullWidth />
                <Button type="submit" variant="contained" disabled={updateProfile.isPending}>
                  Save profile
                </Button>
              </Stack>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Password
            </Typography>
            {changePassword.isSuccess ? <Alert severity="success">Password updated.</Alert> : null}
            {changePassword.error ? (
              <Alert severity="error">{(changePassword.error as Error).message}</Alert>
            ) : null}
            <form onSubmit={passwordForm.handleSubmit((v) => changePassword.mutate(v))}>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <FormTextField
                  control={passwordForm.control}
                  name="current"
                  type="password"
                  label="Current password"
                  required
                  fullWidth
                />
                <FormTextField
                  control={passwordForm.control}
                  name="next"
                  type="password"
                  label="New password"
                  required
                  fullWidth
                />
                <Button type="submit" variant="contained" disabled={changePassword.isPending}>
                  Update password
                </Button>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </Stack>
    </>
  );
};
