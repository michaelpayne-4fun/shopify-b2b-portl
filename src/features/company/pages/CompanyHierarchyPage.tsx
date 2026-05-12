import { Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { PageHeader } from '@/ui/components/PageHeader';
import { useBuyerContext } from '@/features/auth/hooks/useBuyerContext';

export const CompanyHierarchyPage = () => {
  const context = useBuyerContext();
  return (
    <>
      <PageHeader title={context.company.name} description={`Status: ${context.company.status}`} />
      <Stack spacing={2}>
        {context.company.locations.map((loc) => (
          <Card key={loc.id}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">{loc.name}</Typography>
                {loc.isDefault ? <Chip size="small" color="primary" label="Default" /> : null}
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {loc.address.line1}
                {loc.address.line2 ? `, ${loc.address.line2}` : ''}, {loc.address.city},{' '}
                {loc.address.region} {loc.address.postalCode}, {loc.address.countryCode}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </>
  );
};
