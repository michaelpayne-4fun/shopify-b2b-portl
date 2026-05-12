import type { Permission, Role } from '@b2b/domain';
import { PORTAL_ONLY_PERMISSIONS, isPermission } from '@b2b/domain';
import { eq } from 'drizzle-orm';
import type { Database } from '@b2b/db';
import { roleAssignments } from '@b2b/db';

/**
 * Merge Shopify-derived permissions with portal-DB role grants for
 * a buyer. PORTAL_ONLY_PERMISSIONS coming in from Shopify are dropped
 * (defence-in-depth: they should never appear there).
 */
export const buildMergedRole = async (
  db: Database,
  args: {
    buyerId: string;
    shopifyRoleName: string;
    shopifyPermissions: readonly Permission[];
    isShopifyLocationAdmin: boolean;
  },
): Promise<Role> => {
  const portalOnly = new Set<Permission>(PORTAL_ONLY_PERMISSIONS);
  const allowed = args.shopifyPermissions.filter((p) => !portalOnly.has(p));

  const grants = await db.select().from(roleAssignments).where(eq(roleAssignments.buyerId, args.buyerId));

  const final = new Set<Permission>(allowed);
  for (const g of grants) {
    if (isPermission(g.permission)) final.add(g.permission);
  }

  return {
    id: 'merged',
    name: args.shopifyRoleName,
    isAdmin: args.isShopifyLocationAdmin && final.has('portal.admin'),
    permissions: [...final],
  };
};

/**
 * Bootstrap rule: any Shopify Location admin signing in for the first
 * time gets `portal.admin` automatically if the company has no portal
 * admin yet. Idempotent.
 */
export const bootstrapPortalAdminIfFirst = async (
  db: Database,
  args: { companyId: string; buyerId: string; isShopifyLocationAdmin: boolean },
): Promise<void> => {
  if (!args.isShopifyLocationAdmin) return;
  const existing = await db
    .select()
    .from(roleAssignments)
    .where(eq(roleAssignments.companyId, args.companyId));
  if (existing.some((row) => row.permission === 'portal.admin')) return;
  await db.insert(roleAssignments).values({
    buyerId: args.buyerId,
    companyId: args.companyId,
    permission: 'portal.admin',
    grantedBy: 'system:bootstrap',
  });
};
