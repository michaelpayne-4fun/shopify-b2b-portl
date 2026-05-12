import { randomUUID } from 'node:crypto';
import { desc, eq } from 'drizzle-orm';
import type { Database } from '@b2b/db';
import { adminAuditLog } from '@b2b/db';
import type { AuditEntry, Page } from '@b2b/domain';

interface AuditArgs<T> {
  db: Database;
  companyId: string;
  actorId: string;
  action: string;
  subjectType: string;
  subjectId: string;
  before: unknown;
  fn: () => Promise<T>;
}

/**
 * Diffs and audits an admin mutation. The audit row is inserted in
 * the same logical step as the change — if the underlying mutation
 * throws, no row is written.
 */
export const withAudit = async <T>(args: AuditArgs<T>): Promise<T> => {
  const result = await args.fn();
  await args.db.insert(adminAuditLog).values({
    id: randomUUID(),
    companyId: args.companyId,
    actorId: args.actorId,
    action: args.action,
    subjectType: args.subjectType,
    subjectId: args.subjectId,
    before: args.before as never,
    after: result as never,
  });
  return result;
};

export const listAuditEntries = async (
  db: Database,
  companyId: string,
): Promise<Page<AuditEntry>> => {
  const rows = await db
    .select()
    .from(adminAuditLog)
    .where(eq(adminAuditLog.companyId, companyId))
    .orderBy(desc(adminAuditLog.at))
    .limit(100);
  const items: AuditEntry[] = rows.map((r) => ({
    id: r.id,
    companyId: r.companyId,
    actorId: r.actorId,
    action: r.action,
    subjectType: r.subjectType,
    subjectId: r.subjectId,
    before: r.before,
    after: r.after,
    at: r.at.toISOString(),
  }));
  return { items, page: 1, pageSize: items.length, totalItems: items.length, totalPages: 1 };
};
