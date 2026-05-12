import { Alert, Stack, Typography } from '@mui/material';
import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { completeLogin } from '@/services/authService';
import { LoadingState } from '@/ui/components/LoadingState';
import { queryKeys } from '@/state/queries/queryKeys';

export const AuthCallbackPage = () => {
  const [params] = useSearchParams();
  const code = params.get('code');
  const state = params.get('state');
  const qc = useQueryClient();
  const navigate = useNavigate();

  const exchange = useMutation({
    mutationFn: () => completeLogin(code!, state!),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.me });
      navigate('/', { replace: true });
    },
  });

  useEffect(() => {
    if (code && state && !exchange.isPending && !exchange.isSuccess) {
      exchange.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, state]);

  if (!code || !state) {
    return <Alert severity="error">Missing authorization code or state from Shopify.</Alert>;
  }
  if (exchange.error) {
    return (
      <Stack spacing={2}>
        <Typography variant="h6">Sign-in failed</Typography>
        <Alert severity="error">{(exchange.error as Error).message}</Alert>
      </Stack>
    );
  }
  return <LoadingState label="Completing sign-in…" />;
};
