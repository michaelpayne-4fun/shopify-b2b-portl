import type { MiddlewareHandler } from 'hono';
import type { Permission } from '@b2b/domain';
import { FeatureDisabledError, NotAuthenticatedError, NotAuthorizedError, PermissionPolicy } from '@b2b/domain';
import { features } from '../env';
import type { AppVariables } from './types';

export const requirePermission =
  (permission: Permission | Permission[]): MiddlewareHandler<{ Variables: AppVariables }> =>
  async (c, next) => {
    const auth = c.var.auth;
    if (!auth) throw new NotAuthenticatedError();
    if (!PermissionPolicy.can(auth.buyerContext, permission)) {
      throw new NotAuthorizedError(Array.isArray(permission) ? permission.join(',') : permission);
    }
    await next();
  };

export const requireFeatureFlag =
  (flag: keyof ReturnType<typeof features>): MiddlewareHandler<{ Variables: AppVariables }> =>
  async (c, next) => {
    if (!features()[flag]) throw new FeatureDisabledError(flag);
    await next();
  };
