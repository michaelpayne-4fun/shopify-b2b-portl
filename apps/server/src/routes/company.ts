import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { sessions } from '@b2b/db';
import { NotFoundError } from '@b2b/domain';
import type { AppVariables } from '../middleware/types';

export const companyRoutes = new Hono<{ Variables: AppVariables }>();

companyRoutes.get('/me/company', (c) => c.json(c.var.auth!.company));

const switchSchema = z.object({ locationId: z.string().min(1) });

companyRoutes.post('/me/company/switch-location', zValidator('json', switchSchema), async (c) => {
  const { locationId } = c.req.valid('json');
  const auth = c.var.auth!;
  const location = auth.company.locations.find((l) => l.id === locationId);
  if (!location) throw new NotFoundError('CompanyLocation', locationId);

  await c.var.db.update(sessions)
    .set({ activeLocationGid: locationId })
    .where(eq(sessions.id, auth.sessionId));

  return c.json({ activeLocationId: locationId });
});
