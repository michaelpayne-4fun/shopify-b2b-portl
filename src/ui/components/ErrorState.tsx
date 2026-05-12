import { Alert, AlertTitle, Box, Button } from '@mui/material';

export interface ErrorStateProps {
  title?: string;
  error: unknown;
  onRetry?: () => void;
}

const messageOf = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Something went wrong.';
};

export const ErrorState = ({ title = 'Unable to load', error, onRetry }: ErrorStateProps) => (
  <Box py={2}>
    <Alert
      severity="error"
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        ) : null
      }
    >
      <AlertTitle>{title}</AlertTitle>
      {messageOf(error)}
    </Alert>
  </Box>
);
