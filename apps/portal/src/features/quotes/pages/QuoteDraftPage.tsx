import {
  Alert, Button, Card, CardContent, IconButton, Stack, TextField, Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import type { QuoteDraftInput } from '@b2b/domain';
import { createQuoteDraft } from '@/services/quoteService';
import { PageHeader } from '@/ui/components/PageHeader';

interface Line { sku: string; quantity: number }

export const QuoteDraftPage = () => {
  const navigate = useNavigate();
  const [lines, setLines] = useState<Line[]>([{ sku: '', quantity: 1 }]);
  const [notes, setNotes] = useState('');

  const create = useMutation({
    mutationFn: (input: QuoteDraftInput) => createQuoteDraft(input),
    onSuccess: (q) => navigate(`/quotes/${encodeURIComponent(q.id)}`),
  });

  const upd = (idx: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const submit = () => {
    const clean = lines.filter((l) => l.sku.trim() && l.quantity > 0);
    if (clean.length === 0) return;
    create.mutate({ lines: clean, notes });
  };

  return (
    <>
      <PageHeader title="New quote" description="Build a draft quote and submit it." />
      {create.error ? <Alert severity="error">{(create.error as Error).message}</Alert> : null}
      <Card><CardContent>
        <Stack spacing={2}>
          {lines.map((line, idx) => (
            <Stack key={idx} direction="row" spacing={2} alignItems="center">
              <TextField label="SKU" value={line.sku}
                onChange={(e) => upd(idx, { sku: e.target.value })}
                sx={{ flex: 1 }} required />
              <TextField label="Quantity" type="number" inputProps={{ min: 1 }}
                value={line.quantity}
                onChange={(e) => upd(idx, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                sx={{ width: 120 }} />
              <IconButton aria-label="Remove line"
                onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                disabled={lines.length === 1}>
                <DeleteIcon />
              </IconButton>
            </Stack>
          ))}
          <Button onClick={() => setLines((prev) => [...prev, { sku: '', quantity: 1 }])}>
            Add line
          </Button>
          <TextField label="Notes" multiline minRows={2}
            value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Typography variant="caption" color="text.secondary">
            Prices and totals are computed from Shopify once the draft is created.
          </Typography>
          <Button variant="contained" onClick={submit} disabled={create.isPending}>
            {create.isPending ? 'Creating…' : 'Create draft'}
          </Button>
        </Stack>
      </CardContent></Card>
    </>
  );
};
