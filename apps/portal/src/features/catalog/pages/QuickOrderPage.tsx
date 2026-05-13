import {
  Alert, Box, Button, Card, CardContent, Divider, Paper, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { BulkAddCartItem, Money } from '@b2b/domain';
import { addManyToCart } from '@/services/cartService';
import { queryKeys } from '@/state/queries/queryKeys';
import { PageHeader } from '@/ui/components/PageHeader';
import { Money as MoneyView } from '@/ui/components/Money';
import { QuickOrderRow, type QuickOrderRowSnapshot } from '../components/QuickOrderRow';

interface RowEntry {
  key: string;
  initialInput?: string;
  initialQuantity?: number;
}

interface ParsedRow {
  sku: string;
  quantity: number;
}

interface ParseResult {
  rows: ParsedRow[];
  skipped: number;
}

const newKey = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const emptyRow = (): RowEntry => ({ key: newKey() });

// Real SKUs are short and have no whitespace. Anything else is almost
// certainly stray text from a chat UI, an email signature, etc., and
// would just generate a "Not found" row that the user has to delete.
const looksLikeSku = (sku: string): boolean =>
  sku.length > 0 && sku.length <= 64 && !/\s/.test(sku);

const parseClipboardCsv = (text: string): ParseResult => {
  const rows: ParsedRow[] = [];
  let skipped = 0;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const cols = line.split(/[,\t;]/).map((s) => s.trim().replace(/^"(.*)"$/, '$1'));
    const sku = cols[0];
    if (!sku) continue;
    if (/^sku$/i.test(sku)) continue; // skip header
    if (!looksLikeSku(sku)) { skipped++; continue; }
    const qty = Math.max(1, parseInt(cols[1] ?? '1', 10) || 1);
    rows.push({ sku, quantity: qty });
  }
  return { rows, skipped };
};

export const QuickOrderPage = () => {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<RowEntry[]>([emptyRow()]);
  const [snapshots, setSnapshots] = useState<Record<string, QuickOrderRowSnapshot>>({});
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error' | 'info'; text: string } | null>(null);

  const handleSnapshot = useCallback((snap: QuickOrderRowSnapshot) => {
    setSnapshots((prev) => {
      const existing = prev[snap.key];
      if (
        existing &&
        existing.status === snap.status &&
        existing.variantId === snap.variantId &&
        existing.quantity === snap.quantity &&
        existing.errorMessage === snap.errorMessage
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

  const ingestParsed = (parsed: ParseResult) => {
    if (parsed.rows.length === 0) {
      setFeedback({
        kind: 'info',
        text: parsed.skipped
          ? `No SKU-shaped rows found (${parsed.skipped} line${parsed.skipped === 1 ? '' : 's'} skipped). Use one "SKU,qty" per line.`
          : 'No rows found in clipboard. Use one "SKU,qty" per line.',
      });
      return;
    }
    const newRows: RowEntry[] = parsed.rows.map((p) => ({
      key: newKey(),
      initialInput: p.sku,
      initialQuantity: p.quantity,
    }));
    setRows((rs) => {
      const filtered = rs.filter((r) => {
        const snap = snapshots[r.key];
        // Drop rows that haven't been touched, are empty, or are
        // showing a stale "not found" from earlier; keep anything the
        // buyer has already resolved or is actively working on.
        if (!snap) return false;
        if (snap.status === 'empty' || snap.status === 'not_found') return false;
        return true;
      });
      return [...filtered, ...newRows];
    });
    const imported = `Imported ${parsed.rows.length} row${parsed.rows.length === 1 ? '' : 's'}.`;
    const skippedNote = parsed.skipped
      ? ` Skipped ${parsed.skipped} non-SKU line${parsed.skipped === 1 ? '' : 's'}.`
      : '';
    setFeedback({ kind: 'info', text: `${imported}${skippedNote} Resolving…` });
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      ingestParsed(parseClipboardCsv(text));
    } catch (e) {
      setFeedback({
        kind: 'error',
        text: e instanceof Error
          ? `Clipboard read failed: ${e.message}`
          : 'Clipboard read failed. Your browser may have blocked it.',
      });
    }
  };

  const onFileChosen = async (file: File) => {
    const text = await file.text();
    ingestParsed(parseClipboardCsv(text));
  };

  const snapshotList = useMemo(
    () => rows.map((r) => snapshots[r.key]).filter((s): s is QuickOrderRowSnapshot => !!s),
    [rows, snapshots],
  );

  const validItems = useMemo<BulkAddCartItem[]>(
    () => snapshotList
      .filter((s) => s.status === 'resolved' && s.variantId && !!s.quantity)
      .filter((s) => s.quantity >= (s.minOrderQty ?? 1) && (s.maxOrderQty === undefined || s.quantity <= s.maxOrderQty))
      .map((s) => ({ variantId: s.variantId!, quantity: s.quantity })),
    [snapshotList],
  );

  const subtotal = useMemo<Money | null>(() => {
    const resolved = snapshotList.filter(
      (s) => s.status === 'resolved' && s.unitPrice,
    );
    if (resolved.length === 0) return null;
    const currency = resolved[0].unitPrice!.currency;
    const amount = resolved.reduce((acc, s) => acc + s.unitPrice!.amount * s.quantity, 0);
    return { amount, currency };
  }, [snapshotList]);

  const blockedCount = snapshotList.filter(
    (s) => s.status === 'not_found' || s.status === 'oos',
  ).length;

  const addAll = useMutation({
    mutationFn: () => addManyToCart({ items: validItems }),
    onSuccess: (cart) => {
      qc.setQueryData(queryKeys.cart, cart);
      setFeedback({
        kind: 'success',
        text: `Added ${validItems.length} item${validItems.length === 1 ? '' : 's'} to cart.`,
      });
      setRows([emptyRow()]);
      setSnapshots({});
    },
    onError: (e) => {
      setFeedback({
        kind: 'error',
        text: e instanceof Error ? e.message : 'Failed to add items to cart.',
      });
    },
  });

  return (
    <>
      <PageHeader
        title="Quick order"
        description="Search products by name or SKU, paste a list, or upload a CSV. One row per line item."
      />
      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ContentPasteIcon />}
              onClick={pasteFromClipboard}
            >
              Paste from clipboard
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<UploadFileIcon />}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload CSV
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFileChosen(f);
                e.target.value = '';
              }}
            />
            <Box sx={{ flex: 1 }} />
            <Button
              variant="text"
              size="small"
              startIcon={<AddIcon />}
              onClick={addRow}
            >
              Add row
            </Button>
          </Stack>

          {feedback ? (
            <Alert
              severity={feedback.kind}
              onClose={() => setFeedback(null)}
              sx={{ mb: 2 }}
            >
              {feedback.text}
            </Alert>
          ) : null}

          <TableContainer component={Paper} variant="outlined">
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
                    initialInput={r.initialInput}
                    initialQuantity={r.initialQuantity}
                    onSnapshot={handleSnapshot}
                    onRemove={() => removeRow(r.key)}
                    removable={rows.length > 1}
                    autoFocus={idx === 0 && !r.initialInput}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider sx={{ my: 2 }} />

          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {validItems.length} ready{blockedCount ? ` · ${blockedCount} blocked` : ''}
              </Typography>
              {subtotal ? (
                <Typography variant="h6">
                  Subtotal: <MoneyView value={subtotal} />
                </Typography>
              ) : null}
            </Box>
            <Button
              variant="contained"
              size="large"
              onClick={() => addAll.mutate()}
              disabled={validItems.length === 0 || addAll.isPending}
            >
              {addAll.isPending
                ? 'Adding…'
                : `Add ${validItems.length || ''} to cart`.trim()}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
};
