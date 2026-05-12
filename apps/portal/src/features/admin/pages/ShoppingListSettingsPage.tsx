import { Card, CardContent, Typography, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { PageHeader } from '@/ui/components/PageHeader';

export const ShoppingListSettingsPage = () => (
  <>
    <PageHeader title="Shopping list settings" />
    <Card><CardContent>
      <Typography>
        Shopping-list options are configured under{' '}
        <Link component={RouterLink} to="/admin/company-settings">Company settings</Link>{' '}
        in the Shopping lists section.
      </Typography>
    </CardContent></Card>
  </>
);
