import { Box, Container } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { AppHeader } from '@/ui/components/AppHeader';
import { AppSidebar } from '@/ui/components/AppSidebar';

export const PortalLayout = () => (
  <Box minHeight="100vh" display="flex" flexDirection="column">
    <AppHeader />
    <Box display="flex" flex={1} minHeight={0}>
      <AppSidebar />
      <Box component="main" flex={1} sx={{ overflowY: 'auto' }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  </Box>
);
