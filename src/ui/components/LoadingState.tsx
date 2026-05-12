import { Box, CircularProgress, Typography } from '@mui/material';

export const LoadingState = ({ label = 'Loading…' }: { label?: string }) => (
  <Box display="flex" alignItems="center" justifyContent="center" gap={2} py={6}>
    <CircularProgress size={20} />
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
  </Box>
);
