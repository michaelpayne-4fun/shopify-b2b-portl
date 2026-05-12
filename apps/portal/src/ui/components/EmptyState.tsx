import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export const EmptyState = ({
  title, description, action,
}: { title: string; description?: string; action?: ReactNode }) => (
  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center"
       gap={1} py={6} px={2} textAlign="center">
    <Typography variant="h6">{title}</Typography>
    {description ? <Typography variant="body2" color="text.secondary">{description}</Typography> : null}
    {action ? <Box mt={2}>{action}</Box> : null}
  </Box>
);
