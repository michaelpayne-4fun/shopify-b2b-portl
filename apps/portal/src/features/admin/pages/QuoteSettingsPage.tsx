// Quote settings live in /admin/company-settings (Quotes section). This
// page is a friendly redirect that documents that fact.
import { Card, CardContent, Typography, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { PageHeader } from '@/ui/components/PageHeader';

export const QuoteSettingsPage = () => (
  <>
    <PageHeader title="Quote settings" />
    <Card><CardContent>
      <Typography>
        Quote-related options are configured under{' '}
        <Link component={RouterLink} to="/admin/company-settings">Company settings</Link>{' '}
        in the Quotes section.
      </Typography>
    </CardContent></Card>
  </>
);
