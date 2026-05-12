import { Alert, AlertTitle, Box, Button } from '@mui/material';

const message = (err: unknown): string =>
  err instanceof Error ? err.message : typeof err === 'string' ? err : 'Something went wrong.';

export const ErrorState = ({
  title = 'Unable to load', error, onRetry,
}: { title?: string; error: unknown; onRetry?: () => void }) => (
  <Box py={2}>
    <Alert severity="error" action={onRetry ? (
      <Button color="inherit" size="small" onClick={onRetry}>Retry</Button>
    ) : null}>
      <AlertTitle>{title}</AlertTitle>{message(error)}
    </Alert>
  </Box>
);
