import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { quotes, shoppingLists } from '@b2b/db';
import type { Permission } from '@b2b/domain';
import { features } from '../env';
import { requireFeatureFlag, requirePermission } from '../middleware/authz';
import type { AppVariables } from '../middleware/types';
import {
  getCompanySettings, updateCompanySettings,
} from '../portal/admin/companySettings';
import { listGrantsForCompany, replaceGrants } from '../portal/admin/roleGrants';
import { listAuditEntries, withAudit } from '../portal/audit/withAudit';

export const adminRoutes = new Hono<{ Variables: AppVariables }>();

adminRoutes.use('*', requirePermission('portal.admin'));

adminRoutes.get('/admin/features', (c) => c.json(features()));

adminRoutes.get('/admin/overview', async (c) => {
  const companyId = c.var.auth!.company.id;
  const [draftQuotes, activeLists] = await Promise.all([
    c.var.db.select().from(quotes).where(eq(quotes.companyId, companyId)),
    c.var.db.select().from(shoppingLists).where(eq(shoppingLists.companyId, companyId)),
  ]);
  return c.json({
    draftQuotes: draftQuotes.filter((q) => q.status === 'draft').length,
    activeLists: activeLists.length,
    usersCount: c.var.auth!.company.locations.length, // approximation
    pendingApprovals: features().approvals ? 0 : 0,
  });
});

adminRoutes.get('/admin/company-settings', async (c) => {
  return c.json(await getCompanySettings(c.var.db, c.var.auth!.company.id));
});

const settingsPatchSchema = z.object({
  quoteDefaultExpiryDays: z.number().int().min(1).max(365).optional(),
  quoteMirrorToDraftOrder: z.boolean().optional(),
  quoteAllowCustomExpiry: z.boolean().optional(),
  shoppingListDefaultIsShared: z.boolean().optional(),
  shoppingListMaxItems: z.number().int().min(1).max(10000).optional(),
  shoppingListMaxListsPerUser: z.number().int().min(1).max(1000).optional(),
  displayNameOverride: z.string().optional(),
  supportEmail: z.string().email().optional(),
  logoUrl: z.string().url().optional(),
  defaultLocationId: z.string().optional(),
});

adminRoutes.patch('/admin/company-settings', zValidator('json', settingsPatchSchema), async (c) => {
  const auth = c.var.auth!;
  const before = await getCompanySettings(c.var.db, auth.company.id);
  const next = await withAudit({
    db: c.var.db,
    companyId: auth.company.id,
    actorId: auth.buyer.id,
    action: 'companySettings.update',
    subjectType: 'companySettings',
    subjectId: auth.company.id,
    before,
    fn: () => updateCompanySettings(c.var.db, {
      companyId: auth.company.id,
      patch: c.req.valid('json'),
      updatedBy: auth.buyer.id,
    }),
  });
  return c.json(next);
});

adminRoutes.get('/admin/role-grants', async (c) => {
  return c.json(await listGrantsForCompany(c.var.db, c.var.auth!.company.id));
});

const grantsPutSchema = z.object({
  grants: z.array(z.string()).max(20),
});

adminRoutes.put('/admin/role-grants/:userId', zValidator('json', grantsPutSchema), async (c) => {
  const auth = c.var.auth!;
  const userId = c.req.param('userId');
  const before = (await listGrantsForCompany(c.var.db, auth.company.id))
    .find((row) => row.userId === userId) ?? { userId, grants: [] as Permission[] };
  const next = await withAudit({
    db: c.var.db,
    companyId: auth.company.id,
    actorId: auth.buyer.id,
    action: 'roleGrants.replace',
    subjectType: 'buyer',
    subjectId: userId,
    before,
    fn: () => replaceGrants(c.var.db, {
      companyId: auth.company.id,
      buyerId: userId,
      grants: c.req.valid('json').grants as Permission[],
      grantedBy: auth.buyer.id,
    }),
  });
  return c.json(next);
});

adminRoutes.get('/admin/audit-log', async (c) => {
  return c.json(await listAuditEntries(c.var.db, c.var.auth!.company.id));
});

/**
 * /admin/approval-rules is registered behind the approvals flag.
 * It exists so flipping FEATURE_APPROVALS later requires no code change.
 */
const approvalRulesSub = new Hono<{ Variables: AppVariables }>();
approvalRulesSub.use('*', requireFeatureFlag('approvals'));
approvalRulesSub.get('/admin/approval-rules', (c) => c.json([]));
approvalRulesSub.post('/admin/approval-rules', (c) =>
  c.json({ error: 'NOT_IMPLEMENTED', message: 'approval-rules.create pending' }, 501));
adminRoutes.route('/', approvalRulesSub);
