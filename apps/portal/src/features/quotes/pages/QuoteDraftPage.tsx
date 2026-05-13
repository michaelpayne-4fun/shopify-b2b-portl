import {
  Alert, Box, Button, Card, CardContent, Divider, Paper, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import type { QuoteDraftInput } from '@b2b/domain';
import { createQuoteDraft } from '@/services/quoteService';
import { PageHeader } from '@/ui/components/PageHeader';
import { Money as MoneyView } from '@/ui/components/Money';
import { QuickOrderRow, type QuickOrderRowSnapshot } from '@/features/catalog/components/QuickOrderRow';

const newKey = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const emptyRow = (): { key: string } => ({ key: newKey() });

export const QuoteDraftPage = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([emptyRow()]);
  const [snapshots, setSnapshots] = useState<Record<string, QuickOrderRowSnapshot>>({});
  const [notes, setNotes] = useState('');

  const handleSnapshot = useCallback((snap: QuickOrderRowSnapshot) => {
    setSnapshots((prev) => {
      const existing = prev[snap.key];
      if (
        existing &&
        existing.status === snap.status &&
        existing.variantId === snap.variantId &&
        existing.quantity === snap.quantity
      ) return prev;
      return { ...prev, [snap.key]: snap };
    });
  }, []);

  const addRow = () => setRows((rs) => [...rs, emptyRow()]);

  const removeRow = (key: string) =>
    setRows((rs) => {
      const next = rs.filter((r) => r.key !== key);
      return next.length === 0 ? [emptyRow()] : next;
    });

  const snapshotList = useMemo(
    () => rows.map((r) => snapshots[r.key]).filter((s): s is QuickOrderRowSnapshot => !!s),
    [rows, snapshots],
  );

  const readyLines = useMemo(
    () => snapshotList.filter(
      (s) => s.status === 'resolved' && s.sku && s.quantity >= (s.minOrderQty ?? 1),
    ),
    [snapshotList],
  );

  const subtotal = useMemo(() => {
    const resolved = readyLines.filter((s) => s.unitPrice);
    if (resolved.length === 0) return null;
    const currencies = new Set(resolved.map((s) => s.unitPrice!.currency));
    if (currencies.size > 1) return null;
    const currency = resolved[0].unitPrice!.currency;
    const amount = resolved.reduce((acc, s) => acc + s.unitPrice!.amount * s.quantity, 0);
    return { amount, currency };
  }, [readyLines]);

  const create = useMutation({
    mutationFn: (input: QuoteDraftInput) => createQuoteDraft(input),
    onSuccess: (q) => navigate(`/quotes/${encodeURIComponent(q.id)}`),
  });

  const submit = () => {
    if (readyLines.length === 0) return;
    create.mutate({
      lines: readyLines.map((s) => ({ sku: s.sku!, quantity: s.quantity })),
      notes: notes.trim() || undefined,
    });
  };

  const blockedCount = snapshotList.filter(
    (s) => s.status === 'not_found' || s.status === 'oos',
  ).length;

  return (
    <>
      <PageHeader
        title="New quote"
        description="Search products by name or SKU. Prices shown are indicative — final pricing is confirmed by your rep."
      />

      {create.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {(create.error as Error).message}
        </Alert>
      ) : null}

      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
            <Button size="small" startIcon={<AddIcon />} onClick={addRow}>
              Add row
            </Button>
          </Stack>

          <Paper variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell sx={{ width: 120 }}>Qty</TableCell>
                  <TableCell sx={{ width: 120 }} align="right">Unit price</TableCell>
                  <TableCell sx={{ width: 120 }} align="right">Line total</TableCell>
                  <TableCell sx={{ width: 140 }}>Status</TableCell>
                  <TableCell sx={{ width: 48 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r, idx) => (
                  <QuickOrderRow
                    key={r.key}
                    rowKey={r.key}
                    onSnapshot={handleSnapshot}
                    onRemove={() => removeRow(r.key)}
                    removable={rows.length > 1}
                    autoFocus={idx === 0}
                  />
                ))}
              </TableBody>
            </Table>
          </Paper>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={2}>
            <TextField
              label="Notes for your rep (optional)"
              multiline
              minRows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {readyLines.length} line{readyLines.length === 1 ? '' : 's'} ready
                  {blockedCount ? ` · ${blockedCount} blocked` : ''}
                </Typography>
                {subtotal ? (
                  <Typography variant="h6">
                    Indicative total: <MoneyView value={subtotal} />
                  </Typography>
                ) : null}
              </Box>
              <Button
                variant="contained"
                size="large"
                onClick={submit}
                disabled={readyLines.length === 0 || create.isPending}
              >
                {create.isPending ? 'Creating…' : 'Create draft quote'}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
};
