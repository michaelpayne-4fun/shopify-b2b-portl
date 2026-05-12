import { randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import type { Database } from '@b2b/db';
import { quoteLines, quotes } from '@b2b/db';
import type { Page, Quote, QuoteDraftInput, QuoteLine } from '@b2b/domain';
import { NotFoundError, ValidationError, advanceQuote } from '@b2b/domain';
import { features } from '../../env';
import { storefrontQuery } from '../../shopify/storefrontClient';

const SKU_LOOKUP_QUERY = `
  query SkuLookup($q: String!) {
    products(query: $q, first: 1) {
      edges { node { title variants(first: 1) { edges { node { id sku price { amount currencyCode } } } } } }
    }
  }
`;

interface SkuLookupData {
  products: { edges: Array<{ node: { title: string; variants: { edges: Array<{ node: { id: string; sku: string; price: { amount: string; currencyCode: string } } }> } } }> };
}

interface BuildLinesOpts {
  buyerAccessToken: string;
}

const buildLines = async (
  input: QuoteDraftInput,
  opts: BuildLinesOpts,
): Promise<{ lines: QuoteLine[]; subtotalCents: number; currency: string }> => {
  const lines: QuoteLine[] = [];
  let subtotal = 0;
  let currency = 'USD';
  for (const ln of input.lines) {
    const data = await storefrontQuery<SkuLookupData>(
      SKU_LOOKUP_QUERY,
      { q: `sku:${ln.sku}` },
      { buyerAccessToken: opts.buyerAccessToken },
    );
    const node = data.products.edges[0]?.node;
    const variant = node?.variants.edges[0]?.node;
    if (!variant) throw new ValidationError(`Unknown SKU "${ln.sku}"`);
    const unit = Number(variant.price.amount);
    currency = variant.price.currencyCode;
    const lineTotal = unit * ln.quantity;
    subtotal += lineTotal;
    lines.push({
      id: randomUUID(),
      sku: ln.sku,
      variantId: variant.id,
      name: node.title,
      quantity: ln.quantity,
      unitPrice: { amount: unit, currency },
      lineTotal: { amount: lineTotal, currency },
      notes: ln.notes,
    });
  }
  return { lines, subtotalCents: Math.round(subtotal * 100), currency };
};

const rowToDomain = (q: typeof quotes.$inferSelect, lns: Array<typeof quoteLines.$inferSelect>): Quote => ({
  id: q.id,
  number: q.number,
  status: q.status as Quote['status'],
  createdAt: q.createdAt.toISOString(),
  updatedAt: q.updatedAt.toISOString(),
  expiresAt: q.expiresAt?.toISOString(),
  buyerId: q.buyerId,
  companyId: q.companyId,
  locationId: q.locationId ?? undefined,
  lines: lns.map((l) => ({
    id: l.id,
    sku: l.sku,
    variantId: l.variantId ?? undefined,
    name: l.name,
    quantity: l.quantity,
    unitPrice: { amount: l.unitPriceCents / 100, currency: q.currency },
    lineTotal: { amount: l.lineTotalCents / 100, currency: q.currency },
    notes: l.notes ?? undefined,
  })),
  subtotal: { amount: q.subtotalCents / 100, currency: q.currency },
  total: { amount: q.totalCents / 100, currency: q.currency },
  notes: q.notes ?? undefined,
  shopifyDraftOrderGid: q.shopifyDraftOrderGid ?? undefined,
});

const nextNumber = async (db: Database, companyId: string): Promise<string> => {
  const rows = await db
    .select()
    .from(quotes)
    .where(eq(quotes.companyId, companyId))
    .orderBy(desc(quotes.createdAt))
    .limit(1);
  const lastNum = rows[0]?.number?.match(/(\d+)$/)?.[1];
  const next = lastNum ? Number(lastNum) + 1 : 1;
  return `Q-${new Date().getUTCFullYear()}-${String(next).padStart(4, '0')}`;
};

export const listQuotes = async (
  db: Database,
  companyId: string,
  status?: string,
): Promise<Page<Quote>> => {
  const rows = await db
    .select()
    .from(quotes)
    .where(status ? and(eq(quotes.companyId, companyId), eq(quotes.status, status)) : eq(quotes.companyId, companyId))
    .orderBy(desc(quotes.createdAt));
  const ids = rows.map((r) => r.id);
  if (ids.length === 0) return { items: [], page: 1, pageSize: 0, totalItems: 0, totalPages: 1 };
  const lineRows = await db.select().from(quoteLines);
  const byQuote = new Map<string, Array<typeof quoteLines.$inferSelect>>();
  for (const ln of lineRows) {
    const list = byQuote.get(ln.quoteId) ?? [];
    list.push(ln);
    byQuote.set(ln.quoteId, list);
  }
  const items = rows.map((r) => rowToDomain(r, byQuote.get(r.id) ?? []));
  return { items, page: 1, pageSize: items.length, totalItems: items.length, totalPages: 1 };
};

export const getQuote = async (db: Database, companyId: string, id: string): Promise<Quote> => {
  const rows = await db.select().from(quotes).where(and(eq(quotes.id, id), eq(quotes.companyId, companyId))).limit(1);
  if (!rows[0]) throw new NotFoundError('Quote', id);
  const lns = await db.select().from(quoteLines).where(eq(quoteLines.quoteId, id));
  return rowToDomain(rows[0], lns);
};

export const createQuoteDraft = async (
  db: Database,
  args: { companyId: string; buyerId: string; locationId?: string; input: QuoteDraftInput; buyerAccessToken: string },
): Promise<Quote> => {
  if (args.input.lines.length === 0) throw new ValidationError('Quote must have at least one line');
  const { lines, subtotalCents, currency } = await buildLines(args.input, { buyerAccessToken: args.buyerAccessToken });

  const id = randomUUID();
  const number = await nextNumber(db, args.companyId);
  const now = new Date();
  await db.insert(quotes).values({
    id, number, status: 'draft',
    companyId: args.companyId,
    locationId: args.locationId,
    buyerId: args.buyerId,
    currency,
    subtotalCents,
    totalCents: subtotalCents,
    notes: args.input.notes,
    expiresAt: args.input.expiresAt ? new Date(args.input.expiresAt) : null,
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(quoteLines).values(
    lines.map((l, idx) => ({
      id: l.id,
      quoteId: id,
      sku: l.sku,
      variantId: l.variantId ?? null,
      name: l.name,
      quantity: l.quantity,
      unitPriceCents: Math.round(l.unitPrice.amount * 100),
      lineTotalCents: Math.round(l.lineTotal.amount * 100),
      notes: l.notes ?? null,
      attributes: null,
      position: String(idx + 1),
    })),
  );
  return getQuote(db, args.companyId, id);
};

export const updateQuoteDraft = async (
  db: Database,
  args: { companyId: string; id: string; input: QuoteDraftInput; buyerAccessToken: string },
): Promise<Quote> => {
  const existing = await getQuote(db, args.companyId, args.id);
  if (existing.status !== 'draft') throw new ValidationError('Only draft quotes can be edited');
  const { lines, subtotalCents, currency } = await buildLines(args.input, { buyerAccessToken: args.buyerAccessToken });
  await db.update(quotes).set({
    subtotalCents,
    totalCents: subtotalCents,
    currency,
    notes: args.input.notes,
    expiresAt: args.input.expiresAt ? new Date(args.input.expiresAt) : null,
    updatedAt: new Date(),
  }).where(eq(quotes.id, args.id));
  await db.delete(quoteLines).where(eq(quoteLines.quoteId, args.id));
  await db.insert(quoteLines).values(lines.map((l, idx) => ({
    id: l.id, quoteId: args.id, sku: l.sku, variantId: l.variantId ?? null,
    name: l.name, quantity: l.quantity,
    unitPriceCents: Math.round(l.unitPrice.amount * 100),
    lineTotalCents: Math.round(l.lineTotal.amount * 100),
    notes: l.notes ?? null, attributes: null, position: String(idx + 1),
  })));
  return getQuote(db, args.companyId, args.id);
};

export const submitQuote = async (
  db: Database,
  args: { companyId: string; id: string },
): Promise<Quote> => {
  const existing = await getQuote(db, args.companyId, args.id);
  const next = advanceQuote(existing, 'submit', { approvalsEnabled: features().approvals });
  await db.update(quotes).set({ status: next, updatedAt: new Date() }).where(eq(quotes.id, args.id));
  // TODO: when FEATURE_APPROVALS=true, also insert an approvals row
  // here via the rule engine. Skipped in v1.
  return getQuote(db, args.companyId, args.id);
};

export const deleteQuote = async (db: Database, companyId: string, id: string): Promise<void> => {
  const existing = await getQuote(db, companyId, id);
  if (existing.status !== 'draft') throw new ValidationError('Only draft quotes can be deleted');
  await db.delete(quoteLines).where(eq(quoteLines.quoteId, id));
  await db.delete(quotes).where(eq(quotes.id, id));
};
