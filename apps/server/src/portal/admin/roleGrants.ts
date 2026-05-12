import { and, eq } from 'drizzle-orm';
import type { Database } from '@b2b/db';
import { roleAssignments } from '@b2b/db';
import type { Permission } from '@b2b/domain';
import { PORTAL_ONLY_PERMISSIONS, isPermission } from '@b2b/domain';

const ASSIGNABLE = new Set<Permission>([
  'approvals.act',
  'shoppingLists.manage',
  'quotes.create',
  'quotes.update',
  'quotes.submit',
  'quotes.delete',
  'portal.admin',
]);

export const listGrantsForCompany = async (db: Database, companyId: string) => {
  const rows = await db.select().from(roleAssignments).where(eq(roleAssignments.companyId, companyId));
  const byBuyer = new Map<string, Permission[]>();
  for (const r of rows) {
    if (!isPermission(r.permission)) continue;
    const arr = byBuyer.get(r.buyerId) ?? [];
    arr.push(r.permission);
    byBuyer.set(r.buyerId, arr);
  }
  return [...byBuyer.entries()].map(([userId, grants]) => ({ userId, grants }));
};

export const replaceGrants = async (
  db: Database,
  args: { companyId: string; buyerId: string; grants: readonly Permission[]; grantedBy: string },
): Promise<{ userId: string; grants: Permission[] }> => {
  const sanitized = args.grants
    .filter(isPermission)
    .filter((p) => ASSIGNABLE.has(p) && PORTAL_ONLY_PERMISSIONS.includes(p));
  const unique = [...new Set(sanitized)];

  await db
    .delete(roleAssignments)
    .where(
      and(
        eq(roleAssignments.buyerId, args.buyerId),
        eq(roleAssignments.companyId, args.companyId),
      ),
    );
  if (unique.length > 0) {
    await db.insert(roleAssignments).values(
      unique.map((p) => ({
        buyerId: args.buyerId,
        companyId: args.companyId,
        permission: p,
        grantedBy: args.grantedBy,
      })),
    );
  }
  return { userId: args.buyerId, grants: unique };
};
