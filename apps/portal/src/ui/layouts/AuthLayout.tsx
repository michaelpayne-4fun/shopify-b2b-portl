import { Box, Container, Paper } from '@mui/material';
import { Outlet } from 'react-router-dom';

export const AuthLayout = () => (
  <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center"
       bgcolor="background.default">
    <Container maxWidth="sm">
      <Paper sx={{ p: 4 }} elevation={0}><Outlet /></Paper>
    </Container>
  </Box>
);
