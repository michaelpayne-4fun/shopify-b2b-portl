import { Box, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export const PageHeader = ({
  title, description, actions,
}: { title: string; description?: string; actions?: ReactNode }) => (
  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between"
         alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} mb={3}>
    <Box>
      <Typography variant="h4">{title}</Typography>
      {description ? <Typography variant="body2" color="text.secondary">{description}</Typography> : null}
    </Box>
    {actions ? <Box>{actions}</Box> : null}
  </Stack>
);
