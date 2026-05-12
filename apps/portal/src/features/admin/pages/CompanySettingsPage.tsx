import { Alert, Button, Card, CardContent, Stack, Switch, TextField, Typography } from '@mui/material';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CompanySettings } from '@b2b/domain';
import { getCompanySettings, updateCompanySettings } from '@/services/adminService';
import { queryKeys } from '@/state/queries/queryKeys';
import { PageHeader } from '@/ui/components/PageHeader';
import { LoadingState } from '@/ui/components/LoadingState';
import { ErrorState } from '@/ui/components/ErrorState';

type FormShape = Partial<CompanySettings>;

export const CompanySettingsPage = () => {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: queryKeys.admin.settings, queryFn: getCompanySettings });
  const save = useMutation({
    mutationFn: (patch: FormShape) => updateCompanySettings(patch),
    onSuccess: (data) => qc.setQueryData(queryKeys.admin.settings, data),
  });

  const form = useForm<FormShape>({ defaultValues: {} });
  useEffect(() => { if (q.data) form.reset(q.data); }, [q.data, form]);

  if (q.isLoading) return <LoadingState />;
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />;

  return (
    <>
      <PageHeader title="Company settings" />
      {save.isSuccess ? <Alert severity="success">Settings updated.</Alert> : null}
      {save.error ? <Alert severity="error">{(save.error as Error).message}</Alert> : null}
      <Card><CardContent>
        <form onSubmit={form.handleSubmit((v) => save.mutate(v))}>
          <Stack spacing={2}>
            <Typography variant="h6">Quotes</Typography>
            <Controller control={form.control} name="quoteDefaultExpiryDays"
              render={({ field }) => (
                <TextField label="Default expiry (days)" type="number"
                  value={field.value ?? 14} onChange={(e) => field.onChange(Number(e.target.value))}
                  inputProps={{ min: 1, max: 365 }} />
              )} />
            <Controller control={form.control} name="quoteMirrorToDraftOrder"
              render={({ field }) => (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Switch checked={!!field.value} onChange={(_, c) => field.onChange(c)} />
                  <Typography>Mirror approved quotes to Shopify Draft Orders</Typography>
                </Stack>
              )} />
            <Typography variant="h6">Shopping lists</Typography>
            <Controller control={form.control} name="shoppingListDefaultIsShared"
              render={({ field }) => (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Switch checked={!!field.value} onChange={(_, c) => field.onChange(c)} />
                  <Typography>New lists default to shared</Typography>
                </Stack>
              )} />
            <Typography variant="h6">Branding</Typography>
            <Controller control={form.control} name="displayNameOverride"
              render={({ field }) => (
                <TextField label="Display name override" value={field.value ?? ''}
                  onChange={field.onChange} fullWidth />
              )} />
            <Controller control={form.control} name="supportEmail"
              render={({ field }) => (
                <TextField label="Support email" type="email" value={field.value ?? ''}
                  onChange={field.onChange} fullWidth />
              )} />
            <Controller control={form.control} name="logoUrl"
              render={({ field }) => (
                <TextField label="Logo URL" value={field.value ?? ''}
                  onChange={field.onChange} fullWidth />
              )} />
            <Button type="submit" variant="contained" disabled={save.isPending}>
              {save.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </Stack>
        </form>
      </CardContent></Card>
    </>
  );
};
