import { Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { PageHeader } from '@/ui/components/PageHeader';
import { useBuyerContextStore } from '@/state/stores/buyerContextStore';

export const CompanyHierarchyPage = () => {
  const ctx = useBuyerContextStore((s) => s.context)!;
  return (
    <>
      <PageHeader title={ctx.company.name} description={`Status: ${ctx.company.status}`} />
      <Stack spacing={2}>
        {ctx.company.locations.map((l) => (
          <Card key={l.id}><CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">{l.name}</Typography>
              {l.isDefault ? <Chip size="small" color="primary" label="Default" /> : null}
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {l.address.line1}{l.address.line2 ? `, ${l.address.line2}` : ''}, {l.address.city}, {l.address.region} {l.address.postalCode}, {l.address.countryCode}
            </Typography>
          </CardContent></Card>
        ))}
      </Stack>
    </>
  );
};
