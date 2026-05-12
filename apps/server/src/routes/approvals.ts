import { Hono } from 'hono';
import { requireFeatureFlag, requirePermission } from '../middleware/authz';
import type { AppVariables } from '../middleware/types';

/**
 * Approvals are FEATURE_APPROVALS-gated. In v1 the entire router
 * returns 404 unless the flag is on. The endpoints below are sketched
 * for when the flag flips.
 */
export const approvalRoutes = new Hono<{ Variables: AppVariables }>();
approvalRoutes.use('*', requireFeatureFlag('approvals'));

approvalRoutes.get('/approvals', requirePermission('approvals.act'), (c) =>
  c.json({ items: [], page: 1, pageSize: 0, totalItems: 0, totalPages: 1 }),
);

approvalRoutes.get('/approvals/:id', requirePermission('approvals.act'), (c) =>
  c.json({ error: 'NOT_IMPLEMENTED', message: 'approvals.get pending', subjectId: c.req.param('id') }, 501),
);

approvalRoutes.post('/approvals/:id/decide', requirePermission('approvals.act'), (c) =>
  c.json({ error: 'NOT_IMPLEMENTED', message: 'approvals.decide pending', subjectId: c.req.param('id') }, 501),
);
